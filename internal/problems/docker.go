package problems

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/docker/docker/pkg/stdcopy"
	"go.uber.org/zap"
)

var (
	ErrCompilationFailed = errors.New("compilation failed")
	ErrExecutionFailed   = errors.New("execution failed")
)

type DockerClient struct {
	client *client.Client
	logger *zap.Logger
}

func NewDockerClient(logger *zap.Logger) (*DockerClient, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, err
	}
	return &DockerClient{
		client: cli,
		logger: logger,
	}, nil
}

func (d *DockerClient) CreateContainer(ctx context.Context, code, language string) (string, error) {
	var imageName, srcFilename, compileCmd string

	switch language {
	case "python":
		imageName = "python:3.9"
		srcFilename = "solution.py"
		compileCmd = "" // Python scripts run directly
	case "c++":
		imageName = "gcc:latest"
		srcFilename = "solution.cpp"
		compileCmd = "g++ /workspace/" + srcFilename + " -o /workspace/solution"
	case "java":
		imageName = "openjdk:latest"
		srcFilename = "Solution.java"
		compileCmd = "javac /workspace/" + srcFilename
	default:
		return "", fmt.Errorf("unsupported language: %s", language)
	}

	resp, err := d.client.ContainerCreate(ctx,
		&container.Config{
			Image:      imageName,
			Entrypoint: []string{"tail", "-f", "/dev/null"},
			Tty:        false,
			WorkingDir: "/workspace",
		},
		&container.HostConfig{
			Resources: container.Resources{
				Memory:     128 * 1024 * 1024, // 128 MB RAM
				MemorySwap: 128 * 1024 * 1024, // Отключить swap
				NanoCPUs:   1000000000,        // 1 CPU (в наносекундах)
				PidsLimit:  &[]int64{100}[0],  // Макс. количество процессов
			},
			// Сброс всех привилегий
			CapDrop: []string{"ALL"},
			// Добавление только минимально необходимой привилегии
			CapAdd:         []string{"DAC_OVERRIDE"}, // Только это по-настоящему требуется
			ReadonlyRootfs: true,                     // Корневая ФС только для чтения
			AutoRemove:     true,                     // Автоматически удалить контейнер после выполнения
			NetworkMode:    "none",                   // Отключить сеть полностью
			Tmpfs: map[string]string{
				"/workspace": "rw,exec,nosuid,size=100m", // Разрешаем выполнение файлов
			},
			// Можно добавить дополнительный seccomp профиль
			SecurityOpt: []string{
				"no-new-privileges:true", // Процессы не могут получать новые привилегии
			},
		},
		nil, nil, "")
	if err != nil {
		return "", fmt.Errorf("failed to create container: %w", err)
	}

	// Start container
	if err := d.client.ContainerStart(ctx, resp.ID, container.StartOptions{}); err != nil {
		return "", fmt.Errorf("failed to start container: %w", err)
	}

	// В функции CreateContainer
	destPath := filepath.Join("/workspace", srcFilename)
	if err := d.writeFileToContainer(ctx, resp.ID, code, destPath); err != nil {
		return "", fmt.Errorf("failed to write code to container: %w", err)
	}

	// Проверяем, что файл создался правильно
	_, _, err = d.execCommand(ctx, resp.ID, fmt.Sprintf("ls -la /workspace/%s && cat /workspace/%s", srcFilename, srcFilename))
	if err != nil {
		return "", fmt.Errorf("failed to check file: %w", err)
	}

	if compileCmd != "" {
		stdout, stderr, err := d.execCommand(ctx, resp.ID, compileCmd)
		if stderr.Len() > 0 {
			d.logger.Debug("compilation error", zap.String("stdout", stdout.String()), zap.String("stderr", stderr.String()))
			return "", ErrCompilationFailed
		}
		if err != nil {
			return "", err
		}
	}

	return resp.ID, nil
}

func (d *DockerClient) RemoveContainer(ctx context.Context, containerID string) error {
	return d.client.ContainerRemove(ctx, containerID, container.RemoveOptions{
		Force: true,
	})
}

// execCommand runs a shell command inside the given container and returns stdout and stderr
func (d *DockerClient) execCommand(ctx context.Context, containerID, cmd string) (bytes.Buffer, bytes.Buffer, error) {
	var outBuf, errBuf bytes.Buffer
	execConfig := container.ExecOptions{
		AttachStdout: true,
		AttachStderr: true,
		Cmd:          []string{"sh", "-c", cmd},
	}
	execResp, err := d.client.ContainerExecCreate(ctx, containerID, execConfig)
	if err != nil {
		return outBuf, errBuf, err
	}
	attachResp, err := d.client.ContainerExecAttach(ctx, execResp.ID, container.ExecAttachOptions{})
	if err != nil {
		return outBuf, errBuf, err
	}
	defer attachResp.Close()
	_, err = stdcopy.StdCopy(&outBuf, &errBuf, attachResp.Reader)
	return outBuf, errBuf, err
}

func (d *DockerClient) ExecuteCode(ctx context.Context, containerID, language string, testCases []TestCase) (bool, []TestCaseResult, SolutionResultDetails, error) {
	var (
		failedTests []TestCaseResult
		avgMemoryKB uint64
		avgTimeMS   float64
	)
	isAllPassed := true

	for _, tc := range testCases {
		execCtx, cancel := context.WithTimeout(ctx, 5*time.Minute)
		defer cancel()

		// Prepare command based on language
		var cmd []string
		switch language {
		case "python":
			cmd = []string{"python3", "/workspace/solution.py"}
		case "c++":
			cmd = []string{"/workspace/solution"}
		case "java":
			cmd = []string{"java", "-cp", "/workspace", "Solution"}
		default:
			d.logger.Debug("unsupported language", zap.String("language", language))
			return false, nil, SolutionResultDetails{}, fmt.Errorf("unsupported language: %s", language)
		}

		// Take initial memory snapshot before execution
		initialStats, err := d.client.ContainerStatsOneShot(ctx, containerID)
		if err != nil {
			return false, nil, SolutionResultDetails{}, fmt.Errorf("failed to get initial stats: %w", err)
		}

		var initialStatsJSON container.StatsResponse
		if err := json.NewDecoder(initialStats.Body).Decode(&initialStatsJSON); err != nil {
			initialStats.Body.Close()
			return false, nil, SolutionResultDetails{}, fmt.Errorf("failed to decode initial stats: %w", err)
		}
		initialStats.Body.Close()

		baseMemoryKB := initialStatsJSON.MemoryStats.Usage / 1024
		d.logger.Debug("initial memory usage", zap.Uint64("base_memory_kb", baseMemoryKB))

		peakMemoryKB := baseMemoryKB

		startTime := time.Now()

		resetCmd := "echo 0 > /sys/fs/cgroup/memory/memory.max_usage_in_bytes 2>/dev/null || true"
		d.execCommand(ctx, containerID, resetCmd)

		// Set up execution
		execConfig := container.ExecOptions{
			Cmd:          cmd,
			AttachStdin:  true,
			AttachStdout: true,
			AttachStderr: true,
			Tty:          false,
		}

		execID, err := d.client.ContainerExecCreate(execCtx, containerID, execConfig)
		if err != nil {
			d.logger.Debug("failed to create exec instance", zap.Error(err))
			return false, nil, SolutionResultDetails{}, fmt.Errorf("failed to create exec instance: %w", err)
		}

		resp, err := d.client.ContainerExecAttach(execCtx, execID.ID, container.ExecAttachOptions{})
		if err != nil {
			d.logger.Debug("failed to attach to exec instance", zap.Error(err))
			return false, nil, SolutionResultDetails{}, fmt.Errorf("failed to attach to exec instance: %w", err)
		}
		defer resp.Close()

		// Send input
		go func() {
			io.Copy(resp.Conn, strings.NewReader(tc.Input))
			resp.CloseWrite()
		}()

		// Collect output
		outBuf := new(bytes.Buffer)
		errBuf := new(bytes.Buffer)
		_, err = stdcopy.StdCopy(outBuf, errBuf, resp.Reader)

		if err != nil {
			d.logger.Debug("failed to read output", zap.Error(err))
			return false, nil, SolutionResultDetails{}, fmt.Errorf("failed to read output: %w", err)
		}

		// Check for errors
		if errBuf.Len() > 0 {
			d.logger.Debug("execution error", zap.String("stderr", errBuf.String()))
			return false, nil, SolutionResultDetails{}, ErrExecutionFailed
		}

		// End timing
		executionTime := float64(time.Since(startTime).Microseconds()) / 1000.0

		memOut, errtestbuf, err := d.execCommand(ctx, containerID, "cat /sys/fs/cgroup/memory/memory.max_usage_in_bytes 2>/dev/null || echo 0")
		fmt.Println(errtestbuf.String(), err)
		memStr := strings.TrimSpace(memOut.String())
		if memStr != "" && memStr != "0" {
			if peakMem, err := strconv.ParseUint(memStr, 10, 64); err == nil {
				peakMemoryKB = peakMem / 1024 // bytes to KB
				d.logger.Debug("memory usage detected via cgroups", zap.Uint64("peak_memory_kb", peakMemoryKB))
			}
		}

		d.logger.Debug("execution completed", zap.Uint64("peak_memory_kb", peakMemoryKB))

		peakMemoryKB = peakMemoryKB - baseMemoryKB

		// Compare output
		actual := strings.TrimSpace(outBuf.String())
		if actual != tc.Output {
			isAllPassed = false
			result := TestCaseResult{
				TestCase:     tc,
				ActualOutput: actual,
			}
			failedTests = append(failedTests, result)
		}

		avgMemoryKB += peakMemoryKB
		avgTimeMS += executionTime
	}

	// Calculate average metrics
	if len(testCases) > 0 {
		avgMemoryKB /= uint64(len(testCases))
		avgTimeMS /= float64(len(testCases))
	}

	return isAllPassed, failedTests, SolutionResultDetails{AverageTime: avgTimeMS, AverageMemory: avgMemoryKB}, nil
}

// Безопасный метод записи файла через exec, работающий с любой конфигурацией
func (d *DockerClient) writeFileToContainer(ctx context.Context, containerID, content, filePath string) error {
	// Создаем временный файл для кода в безопасном формате (base64)
	encodedContent := base64.StdEncoding.EncodeToString([]byte(content))

	// Пишем закодированную строку в файл через echo
	cmd := fmt.Sprintf("echo '%s' | base64 -d > %s", encodedContent, filePath)
	_, _, err := d.execCommand(ctx, containerID, cmd)
	if err != nil {
		return fmt.Errorf("failed to write file: %w", err)
	}
	return nil
}

package problems

import (
	"bytes"
	"context"
	"diplom/config"
	"encoding/base64"
	"fmt"
	"io"
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/docker/docker/pkg/stdcopy"
	"go.uber.org/zap"
)

// LanguageHandler defines language-specific operations
type LanguageHandler interface {
	GetImage() string
	GetSourceFilename() string
	GetCompileCommand(filename string) string
	GetRunCommand(workdir string) []string
}

// Python language implementation
type PythonHandler struct{}

func (h PythonHandler) GetImage() string                  { return "python:3.9" }
func (h PythonHandler) GetSourceFilename() string         { return "solution.py" }
func (h PythonHandler) GetCompileCommand(_ string) string { return "" } // Python doesn't need compilation
func (h PythonHandler) GetRunCommand(_ string) []string {
	return []string{"python3", "/workspace/solution.py"}
}

// C++ language implementation
type CppHandler struct{}

func (h CppHandler) GetImage() string          { return "gcc:15.1" }
func (h CppHandler) GetSourceFilename() string { return "solution.cpp" }
func (h CppHandler) GetCompileCommand(filename string) string {
	return fmt.Sprintf("g++ -O1 --param=ggc-min-expand=20 --param=ggc-min-heapsize=8192 /workspace/%s -o /workspace/solution", filename)
}
func (h CppHandler) GetRunCommand(_ string) []string { return []string{"/workspace/solution"} }

// Java language implementation
type JavaHandler struct{}

func (h JavaHandler) GetImage() string          { return "openjdk:11" }
func (h JavaHandler) GetSourceFilename() string { return "Solution.java" }
func (h JavaHandler) GetCompileCommand(filename string) string {
	return fmt.Sprintf("javac /workspace/%s", filename)
}
func (h JavaHandler) GetRunCommand(workdir string) []string {
	return []string{"java", "-cp", workdir, "Solution"}
}

// GetLanguageHandler returns the appropriate handler for a language
func GetLanguageHandler(language string) (LanguageHandler, error) {
	switch language {
	case "python":
		return PythonHandler{}, nil
	case "cpp":
		return CppHandler{}, nil
	case "java":
		return JavaHandler{}, nil
	default:
		return nil, fmt.Errorf("unsupported language: %s", language)
	}
}

const maxContainers = 15

// DockerClient manages Docker interaction for code execution
type DockerClient struct {
	client    *client.Client
	logger    *zap.Logger
	config    config.RuntimeConfig
	semaphore chan struct{}
}

// NewDockerClient creates a new Docker client with the given configuration
func NewDockerClient(logger *zap.Logger, config config.RuntimeConfig) (*DockerClient, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, err
	}
	return &DockerClient{
		client:    cli,
		logger:    logger,
		config:    config,
		semaphore: make(chan struct{}, maxContainers),
	}, nil
}

// CreateContainer sets up a Docker container for code execution
func (d *DockerClient) CreateContainer(ctx context.Context, code, language string) (string, string, error) {
	select {
	case d.semaphore <- struct{}{}:
	case <-time.After(40 * time.Second):
		return "", "", fmt.Errorf("server is busy, please try again later")
	case <-ctx.Done():
		return "", "", ctx.Err()
	}

	handler, err := GetLanguageHandler(language)
	if err != nil {
		return "", "", err
	}

	imageName := handler.GetImage()
	srcFilename := handler.GetSourceFilename()
	compileCmd := handler.GetCompileCommand(srcFilename)

	memoryLimit := int64(d.config.MemoryLimitMB)
	// Create container with secure configuration
	resp, err := d.client.ContainerCreate(ctx,
		&container.Config{
			Image:      imageName,
			Entrypoint: []string{"tail", "-f", "/dev/null"},
			Tty:        false,
			WorkingDir: "/workspace",
		},
		&container.HostConfig{
			Resources: container.Resources{
				Memory:     memoryLimit * 1024 * 1024,
				MemorySwap: memoryLimit * 1024 * 1024,             // Disable swap
				NanoCPUs:   int64(d.config.CPULimit) * 1000000000, // CPUs in nanoseconds
				PidsLimit:  &d.config.ProcessLimit,
			},
			CapDrop:        []string{"ALL"},
			CapAdd:         []string{"DAC_OVERRIDE"},
			ReadonlyRootfs: true,
			AutoRemove:     true,
			NetworkMode:    "none",
			Tmpfs: map[string]string{
				"/workspace": "rw,exec,nosuid,size=100m",
			},
			SecurityOpt: []string{
				"no-new-privileges:true",
			},
		},
		nil, nil, "")
	if err != nil {
		return resp.ID, "", fmt.Errorf("failed to create container: %w", err)
	}

	// Start container
	if err := d.client.ContainerStart(ctx, resp.ID, container.StartOptions{}); err != nil {
		return resp.ID, "", fmt.Errorf("failed to start container: %w", err)
	}

	// Write source code to container
	if err := d.writeFileToContainer(ctx, resp.ID, code, srcFilename); err != nil {
		return resp.ID, "", fmt.Errorf("failed to write code to container: %w", err)
	}

	// Verify file was written correctly
	stdout, stderr, err := d.execCommand(ctx, resp.ID, fmt.Sprintf("ls -la /workspace/%s && cat /workspace/%s", srcFilename, srcFilename))
	if stderr.Len() > 0 {
		d.logger.Debug("file check error", zap.String("stdout", stdout.String()), zap.String("stderr", stderr.String()))
		return resp.ID, stderr.String(), fmt.Errorf("failed to check file: %s", stderr.String())
	}
	if err != nil {
		return resp.ID, "", fmt.Errorf("failed to check file: %w", err)
	}

	// Compile if needed
	if compileCmd != "" {
		stdout, stderr, err = d.execCommand(ctx, resp.ID, compileCmd)
		if stderr.Len() > 0 {
			d.logger.Debug("compilation error", zap.String("stdout", stdout.String()), zap.String("stderr", stderr.String()))
			return resp.ID, stderr.String(), ErrCompilationFailed
		}
		if err != nil {
			return resp.ID, "", err
		}
	}

	return resp.ID, "", nil
}

// RemoveContainer removes a Docker container
func (d *DockerClient) RemoveContainer(ctx context.Context, containerID string) error {
	return d.client.ContainerRemove(ctx, containerID, container.RemoveOptions{
		Force: true,
	})
}

// execCommand runs a command in a container and returns stdout and stderr
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

// ExecuteCode runs test cases against the provided code
func (d *DockerClient) ExecuteTests(ctx context.Context, containerID, language string, testCases []TestCase) (bool, []TestCaseResult, SolutionResultDetails, string, error) {
	var (
		failedTests []TestCaseResult
		avgMemoryKB float64
		avgTimeMS   float64
	)
	isAllPassed := true

	handler, err := GetLanguageHandler(language)
	if err != nil {
		return false, nil, SolutionResultDetails{}, "", err
	}

	runCmd := handler.GetRunCommand("/workspace")

	var cancel context.CancelFunc
	ctx, cancel = context.WithTimeout(ctx, time.Duration(d.config.ExecutionTimeMS)*time.Millisecond)
	defer cancel()
	for _, tc := range testCases {
		// Get initial memory stats using Docker stats API instead of cgroup files
		initialMemOut, _, _ := d.execCommand(ctx, containerID, "cat /sys/fs/cgroup/memory/memory.usage_in_bytes 2>/dev/null || cat /sys/fs/cgroup/memory.current 2>/dev/null || echo 0")

		initialMemStr := strings.TrimSpace(initialMemOut.String())
		baseMemoryKB := float64(0)
		if initialMemStr != "" && initialMemStr != "0" {
			if initialMem, err := strconv.ParseUint(initialMemStr, 10, 64); err == nil {
				baseMemoryKB = float64(initialMem) / 1024.0 // bytes to KB
			}
		}

		peakMemoryKB := baseMemoryKB

		// Reset memory stats - try both cgroups v1 and v2 paths
		resetCmd := "echo 0 > /sys/fs/cgroup/memory/memory.max_usage_in_bytes 2>/dev/null || true"
		d.execCommand(ctx, containerID, resetCmd)

		startTime := time.Now()

		// Execute code
		execResult, errDetails, err := d.runTestCase(ctx, containerID, runCmd, tc.Input)
		if err != nil {
			d.logger.Debug("execution error",
				zap.Error(err),
				zap.String("error_details", errDetails))
			return false, nil, SolutionResultDetails{}, errDetails, ErrExecutionFailed
		}

		// End timing
		executionTime := float64(time.Since(startTime).Microseconds()) / 1000.0

		// Collect memory stats - try both cgroups v1 and v2 paths
		memOut, errtestbuf, err := d.execCommand(ctx, containerID,
			"cat /sys/fs/cgroup/memory/memory.max_usage_in_bytes 2>/dev/null || "+
				"cat /sys/fs/cgroup/memory.peak 2>/dev/null || "+
				"cat /sys/fs/cgroup/memory.current 2>/dev/null || echo 0")

		if errtestbuf.Len() > 0 || err != nil {
			d.logger.Debug("failed to get peak memory", zap.String("stderr", errtestbuf.String()), zap.Error(err))
			return false, nil, SolutionResultDetails{}, "", fmt.Errorf("failed to get peak memory")
		}

		memStr := strings.TrimSpace(memOut.String())
		if memStr != "" && memStr != "0" {
			if peakMem, err := strconv.ParseUint(memStr, 10, 64); err == nil {
				peakMemoryKB = float64(peakMem) / 1024 // bytes to KB
			}
		}

		d.logger.Debug("execution completed",
			zap.Int("testcase_id", tc.ID),
			zap.String("container_id", containerID),
			zap.Float64("peak_memory_kb", peakMemoryKB),
			zap.Float64("base_memory_kb", baseMemoryKB),
			zap.Float64("execution_time_ms", executionTime))

		peakMemoryKB = peakMemoryKB - baseMemoryKB

		// Compare output
		actual := strings.TrimSpace(execResult)
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
		avgMemoryKB /= float64(len(testCases))
		avgTimeMS /= float64(len(testCases))
	}

	avgTimeMS = math.Round(avgTimeMS*100) / 100
	avgMemoryKB = math.Round(avgMemoryKB*100) / 100

	return isAllPassed, failedTests, SolutionResultDetails{AverageTime: avgTimeMS, AverageMemory: avgMemoryKB}, "", nil
}

// runTestCase executes a single test case and returns its output
func (d *DockerClient) runTestCase(ctx context.Context, containerID string, cmd []string, input string) (string, string, error) {
	execConfig := container.ExecOptions{
		Cmd:          cmd,
		AttachStdin:  true,
		AttachStdout: true,
		AttachStderr: true,
		Tty:          false,
	}

	execID, err := d.client.ContainerExecCreate(ctx, containerID, execConfig)
	if err != nil {
		return "", "", fmt.Errorf("failed to create exec instance: %w", err)
	}

	resp, err := d.client.ContainerExecAttach(ctx, execID.ID, container.ExecAttachOptions{})
	if err != nil {
		return "", "", fmt.Errorf("failed to attach to exec instance: %w", err)
	}
	defer resp.Close()

	// Send input in a goroutine
	go func() {
		io.Copy(resp.Conn, strings.NewReader(input))
		resp.CloseWrite()
	}()

	// Collect output with context handling
	outBuf := new(bytes.Buffer)
	errBuf := new(bytes.Buffer)

	// Create a channel to signal when copying is done
	done := make(chan struct{})
	var copyErr error

	go func() {
		_, copyErr = stdcopy.StdCopy(outBuf, errBuf, resp.Reader)
		close(done)
	}()

	// Wait for either context cancellation or copying completion
	select {
	case <-ctx.Done():
		// Context was cancelled (timeout)
		d.logger.Debug("execution timeout detected, killing process",
			zap.String("container_id", containerID),
			zap.String("exec_id", execID.ID))

		// Kill the exec process - need to use a background context
		killCtx, killCancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer killCancel()

		// Kill process by sending SIGKILL
		// This requires inspecting exec instance to get PID
		inspectResp, err := d.client.ContainerExecInspect(killCtx, execID.ID)
		if err == nil && inspectResp.Pid > 0 {
			// Kill by PID
			killCmd := fmt.Sprintf("kill -9 %d", inspectResp.Pid)
			d.execCommand(killCtx, containerID, killCmd)
		}

		// Kill any runaway child processes too
		d.execCommand(killCtx, containerID, "pkill -9 -f solution || true")

		return "", "", ErrExecutionTimeout

	case <-done:
		// Normal completion
		if copyErr != nil {
			return "", "", fmt.Errorf("failed to read output: %w", copyErr)
		}
	}

	// Check for errors
	if errBuf.Len() > 0 {
		return "", errBuf.String(), ErrExecutionFailed
	}

	return outBuf.String(), "", nil
}

// writeFileToContainer writes a file to a container using a safe method
func (d *DockerClient) writeFileToContainer(ctx context.Context, containerID, content, fileName string) error {
	// Encode content as base64 for safer transport
	encodedContent := base64.StdEncoding.EncodeToString([]byte(content))

	// Write encoded string to file using echo
	cmd := fmt.Sprintf("echo '%s' | base64 -d > %s", encodedContent, fileName)
	_, stderr, err := d.execCommand(ctx, containerID, cmd)
	if stderr.Len() > 0 || err != nil {
		return fmt.Errorf("failed to write file: %s", stderr.String())
	}
	return nil
}

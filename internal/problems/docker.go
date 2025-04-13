package problems

import (
	"bytes"
	"context"
	"fmt"
	"io"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
)

type DockerClient struct {
	client *client.Client
}

func NewDockerClient() (*DockerClient, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, err
	}
	return &DockerClient{client: cli}, nil
}

func (d *DockerClient) CreateContainer(ctx context.Context, code, language string) (string, error) {
	var image string
	var cmd []string

	// Определяем образ и команду в зависимости от языка
	switch language {
	case "python":
		image = "python:3.9"
		cmd = []string{"sh", "-c", fmt.Sprintf("echo '%s' > solution.py && python solution.py", code)}
	case "c++":
		image = "gcc:latest"
		cmd = []string{"sh", "-c", fmt.Sprintf("echo '%s' > solution.cpp && g++ solution.cpp -o solution && ./solution", code)}
	case "java":
		image = "openjdk:latest"
		cmd = []string{"sh", "-c", fmt.Sprintf("echo '%s' > Solution.java && javac Solution.java && java Solution", code)}
	default:
		return "", fmt.Errorf("unsupported language: %s", language)
	}

	// Создаем контейнер
	resp, err := d.client.ContainerCreate(ctx, &container.Config{
		Image: image,
		Cmd:   cmd,
		Tty:   false,
	}, nil, nil, nil, "")
	if err != nil {
		return "", fmt.Errorf("failed to create container: %w", err)
	}

	// Запускаем контейнер
	if err := d.client.ContainerStart(ctx, resp.ID, container.StartOptions{}); err != nil {
		return "", fmt.Errorf("failed to start container: %w", err)
	}

	return resp.ID, nil
}

func (d *DockerClient) ExecuteCode(ctx context.Context, containerID string, testCases []TestCase) (bool, []FailedTestCase, error) {
	var stdout, stderr bytes.Buffer

	failedTestCases := []FailedTestCase{}

	for _, testCase := range testCases {
		// Формируем команду для выполнения кода с текущим тесткейсом
		cmd := fmt.Sprintf("echo '%s' | ./solution", testCase.Input)

		execConfig := container.ExecOptions{
			AttachStdin:  true,
			AttachStdout: true,
			AttachStderr: true,
			Tty:          false,
			Cmd:          []string{"sh", "-c", cmd},
		}

		execIDResp, err := d.client.ContainerExecCreate(ctx, containerID, execConfig)
		if err != nil {
			return false, nil, fmt.Errorf("failed to create exec instance: %w", err)
		}

		hijackedResp, err := d.client.ContainerExecAttach(ctx, execIDResp.ID, container.ExecAttachOptions{})
		if err != nil {
			return false, nil, fmt.Errorf("failed to attach to exec instance: %w", err)
		}
		defer hijackedResp.Close()

		// Считываем вывод выполнения
		stdout.Reset()
		stderr.Reset()
		_, err = io.Copy(&stdout, hijackedResp.Reader)
		if err != nil {
			return false, nil, fmt.Errorf("failed to read output: %w", err)
		}

		// Сравниваем результат с ожидаемым
		actialOutput := stdout.String()
		if actialOutput != testCase.Output {
			failedTestCases = append(failedTestCases, FailedTestCase{TestCase: testCase, ActualOutput: actialOutput})
		}
	}

	if len(failedTestCases) > 0 {
		return false, failedTestCases, nil
	}
	// Если все тесткейсы прошли
	return true, nil, nil
}

func (d *DockerClient) RemoveContainer(containerID string) error {
	return d.client.ContainerRemove(context.Background(), containerID, container.RemoveOptions{
		Force: true,
	})
}

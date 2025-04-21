package problems

import (
	"archive/tar"
	"bytes"
	"context"
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/client"
	"github.com/docker/docker/pkg/stdcopy"
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

	// Pull image
	reader, err := d.client.ImagePull(ctx, imageName, image.PullOptions{})
	if err != nil {
		return "", fmt.Errorf("failed to pull image %s: %w", imageName, err)
	}
	io.Copy(os.Stdout, reader)
	reader.Close()

	// Create container that stays alive
	resp, err := d.client.ContainerCreate(ctx, &container.Config{
		Image:      imageName,
		Entrypoint: []string{"tail", "-f", "/dev/null"},
		Tty:        false,
		WorkingDir: "/workspace",
	}, nil, nil, nil, "")
	if err != nil {
		return "", fmt.Errorf("failed to create container: %w", err)
	}

	// Start container
	if err := d.client.ContainerStart(ctx, resp.ID, container.StartOptions{}); err != nil {
		return "", fmt.Errorf("failed to start container: %w", err)
	}

	// Ensure workspace exists
	_, _, _ = d.execCommand(ctx, resp.ID, "mkdir -p /workspace")

	archiveBuf := new(bytes.Buffer)
	tw := tar.NewWriter(archiveBuf)
	if err := tw.WriteHeader(&tar.Header{Name: srcFilename, Mode: 0644, Size: int64(len(code))}); err != nil {
		return "", fmt.Errorf("failed to write tar header: %w", err)
	}
	if _, err := tw.Write([]byte(code)); err != nil {
		return "", fmt.Errorf("failed to write code to tar: %w", err)
	}
	tw.Close()
	if err := d.client.CopyToContainer(ctx, resp.ID, "/workspace", archiveBuf, container.CopyToContainerOptions{}); err != nil {
		return "", fmt.Errorf("failed to copy code to container: %w", err)
	}

	if compileCmd != "" {
		if stdout, stderr, err := d.execCommand(ctx, resp.ID, compileCmd); err != nil {
			return "", fmt.Errorf("compilation failed: %s / %s: %w", stdout.String(), stderr.String(), err)
		}
	}

	return resp.ID, nil
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

func (d *DockerClient) ExecuteCode(ctx context.Context, containerID, language string, testCases []TestCase) (bool, []FailedTestCase, error) {
	var failedTestCases []FailedTestCase

	for _, tc := range testCases {
		// Build run command based on language
		var runCmd string
		switch language {
		case "python":
			runCmd = fmt.Sprintf("echo '%s' | python3 /workspace/solution.py", tc.Input)
		case "c++":
			runCmd = fmt.Sprintf("echo '%s' | /workspace/solution", tc.Input)
		case "java":
			runCmd = fmt.Sprintf("echo '%s' | java -cp /workspace Solution", tc.Input)
		default:
			return false, nil, fmt.Errorf("unsupported language: %s", language)
		}

		// Execute inside container
		outBuf, errBuf, err := d.execCommand(ctx, containerID, runCmd)
		if err != nil {
			return false, nil, fmt.Errorf("execution error: %s / %s: %w", outBuf.String(), errBuf.String(), err)
		}
		actual := strings.TrimSpace(outBuf.String())
		if actual != tc.Output {
			failedTestCases = append(failedTestCases, FailedTestCase{TestCase: tc, ActualOutput: actual})
		}
	}

	if len(failedTestCases) > 0 {
		return false, failedTestCases, nil
	}
	return true, nil, nil
}

func (d *DockerClient) RemoveContainer(containerID string) error {
	return d.client.ContainerRemove(context.Background(), containerID, container.RemoveOptions{
		Force: true,
	})
}

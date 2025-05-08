package problems

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"

	"github.com/docker/docker/api/types/image"
	"go.uber.org/zap"
)

var (
	StatusFailed  = "failed"
	StatusSuccess = "success"
)
var (
	MessageCodeCompilationFalied = "Code compilation failed"
	MessageCodeExecutionFalied   = "Code execution failed"
	MessageTestCasesFailed       = "Test cases failed"
	MessageAllTestCasesPassed    = "All test cases passed!"
)

type Problem struct {
	UUID        string `json:"uuid"`
	Name        string `json:"name"`
	Difficulty  string `json:"difficulty"`
	Description string `json:"description"`
}

type SolutionRequest struct {
	ProblemUUID string `json:"problem_uuid"`
	Code        string `json:"code" binding:"required"`
	Language    string `json:"language" binding:"required"`
}

type SolutionResult struct {
	Status      string                 `json:"status"`
	Message     string                 `json:"message"`
	FailedTests []TestCaseResult       `json:"failed_tests,omitempty"`
	Details     *SolutionResultDetails `json:"details,omitempty"`
}

type SolutionResultDetails struct {
	AverageTime   float64 `json:"average_time_ms"`
	AverageMemory uint64  `json:"average_memory_kb"`
}

type TestCase struct {
	Input  string `json:"input"`
	Output string `json:"output"`
}

type TestCaseResult struct {
	TestCase
	ActualOutput string `json:"actual_output,omitempty"`
}

type ProblemRepository interface {
	GetTestCasesByProblemUUID(problemUUID string) ([]TestCase, error)
	GetProblemByUUID(uuid string) (*Problem, error)
}

type ProblemService struct {
	ProblemRepo  ProblemRepository
	DockerClient *DockerClient
	Logger       *zap.Logger
}

func NewProblemService(repo ProblemRepository, logger *zap.Logger) (*ProblemService, error) {
	dockerClient, err := NewDockerClient(logger.Named("docker"))
	if err != nil {
		return nil, fmt.Errorf("failed to create Docker client: %w", err)
	}
	languageImages := []string{
		"python:3.9",
		"gcc:latest",
		// "openjdk:latest",
	}
	for _, imageName := range languageImages {
		reader, err := dockerClient.client.ImagePull(context.Background(), imageName, image.PullOptions{})
		if err != nil {
			return nil, fmt.Errorf("failed to pull image %s: %w", imageName, err)
		}
		io.Copy(os.Stdout, reader)
		reader.Close()
	}
	return &ProblemService{
		ProblemRepo:  repo,
		Logger:       logger.Named("problem"),
		DockerClient: dockerClient,
	}, nil
}

func (s *ProblemService) ProcessSolution(ctx context.Context, req SolutionRequest) (*SolutionResult, error) {
	// Fetch test cases for the problem
	testCases, err := s.ProblemRepo.GetTestCasesByProblemUUID(req.ProblemUUID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch test cases: %w", err)
	}

	// Create a Docker container to execute the solution
	containerID, err := s.DockerClient.CreateContainer(ctx, req.Code, req.Language)
	defer s.DockerClient.RemoveContainer(ctx, containerID)
	if errors.Is(err, ErrCompilationFailed) {
		return &SolutionResult{
			Status:  StatusFailed,
			Message: MessageCodeCompilationFalied,
		}, ErrCompilationFailed
	}
	if err != nil {
		return nil, fmt.Errorf("failed to create Docker container: %w", err)
	}

	// Execute the solution against all test cases
	passed, failedTests, details, err := s.DockerClient.ExecuteCode(ctx, containerID, req.Language, testCases)
	if errors.Is(err, ErrExecutionFailed) {
		return &SolutionResult{
			Status:  StatusFailed,
			Message: MessageCodeExecutionFalied,
		}, ErrExecutionFailed
	}
	if err != nil {
		return nil, fmt.Errorf("failed to execute code: %w", err)
	}

	// If any test case failed, return failure result
	if !passed {
		return &SolutionResult{
			Status:      StatusFailed,
			Message:     MessageTestCasesFailed,
			FailedTests: failedTests,
			Details:     &details,
		}, nil
	}

	// If all test cases passed, return success
	return &SolutionResult{
		Status:  StatusSuccess,
		Message: MessageAllTestCasesPassed,
		Details: &details,
	}, nil
}

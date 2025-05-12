package problems

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

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

var (
	ErrProblemNotFound   = errors.New("problem not found")
	ErrTestCasesNotFound = errors.New("test cases not found")
	ErrTestCaseNotFound  = errors.New("test case not found")
)

type Problem struct {
	ID          int    `json:"id"`
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
	AverageMemory float64 `json:"average_memory_kb"`
}

type TestCase struct {
	ID     int    `json:"id"`
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
	AddProblem(uuid, name, difficulty, description string) error
	AddTestcase(problemUUID, input, output string) error
	GetAllProblems() ([]Problem, error)
	DeleteTestcase(id int) error
	DeleteProblem(uuid string) error
}

type ProblemService struct {
	ProblemRepo  ProblemRepository
	DockerClient *DockerClient
	Logger       *zap.Logger
}

type CreateProblemRequest struct {
	Name        string `json:"name" binding:"required"`
	Difficulty  string `json:"difficulty" binding:"required"` // e.g.: "easy", "medium", "hard"
	Description string `json:"description"`
}

type CreateTestcaseRequest struct {
	Input  string `json:"input"`
	Output string `json:"output"`
}

func NewProblemService(repo ProblemRepository, logger *zap.Logger) (*ProblemService, error) {
	dockerClient, err := NewDockerClient(logger.Named("docker"))
	if err != nil {
		return nil, fmt.Errorf("failed to create Docker client: %w", err)
	}
	// languageImages := []string{
	// 	"python:3.9",
	// 	"gcc:latest",
	// 	// "openjdk:latest",
	// }
	// for _, imageName := range languageImages {
	// 	reader, err := dockerClient.client.ImagePull(context.Background(), imageName, image.PullOptions{})
	// 	if err != nil {
	// 		return nil, fmt.Errorf("failed to pull image %s: %w", imageName, err)
	// 	}
	// 	io.Copy(os.Stdout, reader)
	// 	reader.Close()
	// }
	return &ProblemService{
		ProblemRepo:  repo,
		Logger:       logger.Named("problem"),
		DockerClient: dockerClient,
	}, nil
}

func (s *ProblemService) ProcessSolution(ctx context.Context, req SolutionRequest) (*SolutionResult, error) {
	problem, err := s.ProblemRepo.GetProblemByUUID(req.ProblemUUID)
	if err == sql.ErrNoRows {
		return nil, ErrProblemNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to fetch problem: %w", err)
	}

	testCases, err := s.ProblemRepo.GetTestCasesByProblemUUID(problem.UUID)
	if err == sql.ErrNoRows {
		return nil, ErrTestCasesNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to fetch test cases: %w", err)
	}

	containerID, err := s.DockerClient.CreateContainer(ctx, req.Code, req.Language)
	defer func() {
		err = s.DockerClient.RemoveContainer(ctx, containerID)
		if err != nil {
			s.Logger.Error("failed to remove container", zap.String("container_id", containerID), zap.Error(err))
		}
	}()
	if errors.Is(err, ErrCompilationFailed) {
		return &SolutionResult{
			Status:  StatusFailed,
			Message: MessageCodeCompilationFalied,
		}, ErrCompilationFailed
	}
	if err != nil {
		return nil, fmt.Errorf("failed to create Docker container: %w", err)
	}

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

	if !passed {
		return &SolutionResult{
			Status:      StatusFailed,
			Message:     MessageTestCasesFailed,
			FailedTests: failedTests,
			Details:     &details,
		}, nil
	}

	return &SolutionResult{
		Status:  StatusSuccess,
		Message: MessageAllTestCasesPassed,
		Details: &details,
	}, nil
}

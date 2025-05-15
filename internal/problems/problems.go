package problems

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"go.uber.org/zap"
)

// Status constants for solution results
const (
	StatusFailed  = "failed"
	StatusSuccess = "success"
)

// Message constants for solution feedback
const (
	MessageCodeCompilationFailed = "Code compilation failed"
	MessageCodeExecutionFailed   = "Code execution failed"
	MessageTestCasesFailed       = "Test cases failed"
	MessageAllTestCasesPassed    = "All test cases passed!"
)

// Common errors
var (
	ErrProblemNotFound   = errors.New("problem not found")
	ErrTestCasesNotFound = errors.New("test cases not found")
	ErrTestCaseNotFound  = errors.New("test case not found")
	ErrCompilationFailed = errors.New("compilation failed")
	ErrExecutionFailed   = errors.New("execution failed")
)

// Runtime configuration
type Config struct {
	MemoryLimitMB   int
	CPULimit        int
	ExecutionTimeMS int
	ProcessLimit    int64
}

// Default configuration settings
var DefaultConfig = Config{
	MemoryLimitMB:   512,
	CPULimit:        1,
	ExecutionTimeMS: 1000,
	ProcessLimit:    10,
}

// Problem represents a coding problem entity
type Problem struct {
	ID          int              `json:"id"`
	UUID        string           `json:"uuid"`
	Name        string           `json:"name"`
	Difficulty  string           `json:"difficulty"`
	Description string           `json:"description"`
	Solved      bool             `json:"solved"`
	Solution    *ProblemSolution `json:"solution,omitempty"`
}

// SolutionRequest contains data needed to process a solution
type SolutionRequest struct {
	ProblemUUID string `json:"problem_uuid"`
	Code        string `json:"code" binding:"required"`
	Language    string `json:"language" binding:"required"`
}

// SubmitResult contains the outcome of processing a solution
type SubmitResult struct {
	Status       string                 `json:"status"`
	Message      string                 `json:"message"`
	ErrorDetails string                 `json:"error_details,omitempty"`
	FailedTests  []TestCaseResult       `json:"failed_tests,omitempty"`
	Details      *SolutionResultDetails `json:"details,omitempty"`
}

// SolutionResultDetails contains performance metrics
type SolutionResultDetails struct {
	AverageTime   float64 `json:"average_time_ms"`
	AverageMemory float64 `json:"average_memory_kb"`
	// Comparison metrics
	AvgOtherTime      float64 `json:"avg_other_time_ms"`
	AvgOtherMemory    int64   `json:"avg_other_memory_kb"`
	TimeBeatPercent   float64 `json:"time_beat_percent"`
	MemoryBeatPercent float64 `json:"memory_beat_percent"`
}

type ProblemSolution struct {
	SolutionResultDetails
	CreatedAt time.Time `json:"created_at"`
	Code      string    `json:"code"`
	Language  string    `json:"language"`
	Status    string    `json:"status"`
}

// TestCase represents input/output test data for a problem
type TestCase struct {
	ID     int    `json:"id"`
	Input  string `json:"input"`
	Output string `json:"output"`
}

// TestCaseResult extends TestCase with actual execution output
type TestCaseResult struct {
	TestCase
	ActualOutput string `json:"actual_output,omitempty"`
}

// ProblemRepository defines the data access interface for problems
type ProblemRepository interface {
	GetTestCasesByProblemUUID(problemUUID string) ([]TestCase, error)
	GetProblemByUUID(uuid string, userID string) (*Problem, error)
	AddProblem(uuid, name, difficulty, description string) error
	AddTestcase(problemUUID, input, output string) error
	GetAllProblems(userID string) ([]Problem, error)
	DeleteTestcase(id int) error
	DeleteProblem(uuid string) error
	SaveSolution(userID, problemUUID string, solution ProblemSolution, isAccepted bool) (int, error)
	GetSolutionByProblemAndUser(userID, problemUUID string) (ProblemSolution, error)
	GetSolutionStatistics(problemUUID, userID, language string, userTime float64, userMemory int64) (float64, int64, float64, float64, error)
}

// ProblemService orchestrates problem-related operations
type ProblemService struct {
	ProblemRepo  ProblemRepository
	DockerClient *DockerClient
	Logger       *zap.Logger
}

// CreateProblemRequest contains data needed to create a new problem
type CreateProblemRequest struct {
	Name        string `json:"name" binding:"required"`
	Difficulty  string `json:"difficulty" binding:"required"` // e.g.: "easy", "medium", "hard"
	Description string `json:"description"`
}

// CreateTestcaseRequest contains data needed to create a test case
type CreateTestcaseRequest struct {
	Input  string `json:"input"`
	Output string `json:"output"`
}

// NewProblemService creates a new service with default configuration
func NewProblemService(repo ProblemRepository, logger *zap.Logger) (*ProblemService, error) {
	return NewProblemServiceWithConfig(repo, logger, DefaultConfig)
}

// NewProblemServiceWithConfig creates a new service with custom configuration
func NewProblemServiceWithConfig(repo ProblemRepository, logger *zap.Logger, config Config) (*ProblemService, error) {
	dockerClient, err := NewDockerClient(logger.Named("docker"), config)
	if err != nil {
		return nil, fmt.Errorf("failed to create Docker client: %w", err)
	}

	return &ProblemService{
		ProblemRepo:  repo,
		Logger:       logger.Named("problem"),
		DockerClient: dockerClient,
	}, nil
}

// ProcessSolution handles code submission and execution
func (s *ProblemService) ProcessSolution(ctx context.Context, req SolutionRequest, userID string) (*SubmitResult, error) {
	// Fetch problem
	problem, err := s.ProblemRepo.GetProblemByUUID(req.ProblemUUID, userID)
	if err == sql.ErrNoRows {
		return nil, ErrProblemNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to fetch problem: %w", err)
	}

	// Fetch test cases
	testCases, err := s.ProblemRepo.GetTestCasesByProblemUUID(problem.UUID)
	if err == sql.ErrNoRows {
		return nil, ErrTestCasesNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to fetch test cases: %w", err)
	}

	// Create container and process solution
	containerID, errorDetails, err := s.DockerClient.CreateContainer(ctx, req.Code, req.Language)
	defer func() {
		if containerID != "" {
			if err := s.DockerClient.RemoveContainer(ctx, containerID); err != nil {
				s.Logger.Error("failed to remove container", zap.String("container_id", containerID), zap.Error(err))
			}
		}
	}()

	if errors.Is(err, ErrCompilationFailed) {
		return &SubmitResult{
			Status:       StatusFailed,
			Message:      MessageCodeCompilationFailed,
			ErrorDetails: errorDetails,
		}, ErrCompilationFailed
	}
	if err != nil {
		return nil, fmt.Errorf("failed to create Docker container: %w", err)
	}

	// Execute code against test cases
	passed, failedTests, details, errorDetails, err := s.DockerClient.ExecuteCode(ctx, containerID, req.Language, testCases)
	if err != nil && !errors.Is(err, ErrExecutionFailed) {
		return nil, fmt.Errorf("failed to execute code: %w", err)
	}

	problemSolution := ProblemSolution{
		SolutionResultDetails: details,
		CreatedAt:             time.Now(),
		Code:                  req.Code,
		Language:              req.Language,
	}
	_, saveErr := s.ProblemRepo.SaveSolution(userID, problem.UUID, problemSolution, passed)
	if saveErr != nil {
		s.Logger.Error("failed to save solution", zap.Error(saveErr))
		return nil, fmt.Errorf("failed to save solution: %w", saveErr)
	}

	if errors.Is(err, ErrExecutionFailed) {
		return &SubmitResult{
			Status:       StatusFailed,
			Message:      MessageCodeExecutionFailed,
			ErrorDetails: errorDetails,
		}, ErrExecutionFailed
	}

	if !passed {
		return &SubmitResult{
			Status:      StatusFailed,
			Message:     MessageTestCasesFailed,
			FailedTests: failedTests,
			Details:     &details,
		}, nil
	}

	return &SubmitResult{
		Status:  StatusSuccess,
		Message: MessageAllTestCasesPassed,
		Details: &details,
	}, nil
}

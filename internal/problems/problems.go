package problems

import (
	"context"
	"fmt"

	"go.uber.org/zap"
)

type Problem struct {
	UUID        string `json:"uuid"`
	Name        string `json:"name"`
	Difficulty  string `json:"difficulty"`
	Description string `json:"description"`
}

type SolutionRequest struct {
	ProblemUUID string `json:"problem_uuid" binding:"required"`
	Code        string `json:"code" binding:"required"`
	Language    string `json:"language" binding:"required"`
}

type SolutionResult struct {
	Status  string                  `json:"status"`            // Status of the solution (e.g., "success", "failed")
	Message string                  `json:"message"`           // A message describing the result
	Details []SolutionResultDetails `json:"details,omitempty"` // Optional details (e.g., failed test case information)
}

type SolutionResultDetails struct {
	Input          string `json:"input"`           // Input for the test case
	ExpectedOutput string `json:"expected_output"` // Expected output for the test case
	ActualOutput   string `json:"actual_output"`   // Actual output from the solution
}

type TestCase struct {
	Name   string
	Input  string
	Output string
}

type FailedTestCase struct {
	TestCase
	ActualOutput string
}

type ProblemRepository interface {
	GetTestCasesByProblemUUID(problemUUID string) ([]TestCase, error)
}

type ProblemService struct {
	ProblemRepo  ProblemRepository
	DockerClient DockerClient
	Logger       *zap.Logger
}

func NewProblemService(repo ProblemRepository, logger *zap.Logger) *ProblemService {
	return &ProblemService{
		ProblemRepo: repo,
		Logger:      logger.Named("problem"),
	}
}

func (s *ProblemService) ProcessSolution(ctx context.Context, req SolutionRequest) (*SolutionResult, error) {
	// Fetch test cases for the problem
	testCases, err := s.ProblemRepo.GetTestCasesByProblemUUID(req.ProblemUUID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch test cases: %w", err)
	}

	// Create a Docker container to execute the solution
	containerID, err := s.DockerClient.CreateContainer(ctx, req.Code, req.Language)
	if err != nil {
		return nil, fmt.Errorf("failed to create Docker container: %w", err)
	}
	defer s.DockerClient.RemoveContainer(containerID)

	// Execute the solution against all test cases
	passed, failedTestCase, err := s.DockerClient.ExecuteCode(ctx, containerID, testCases)
	if err != nil {
		return nil, fmt.Errorf("failed to execute code: %w", err)
	}

	details := []SolutionResultDetails{}

	for _, testCase := range failedTestCase {
		details = append(details, SolutionResultDetails{
			Input:          testCase.Input,
			ExpectedOutput: testCase.Output,
			ActualOutput:   testCase.ActualOutput,
		})
	}

	// If any test case failed, return failure result
	if !passed {
		return &SolutionResult{
			Status:  "failed",
			Message: "Test case failed",
			Details: details,
		}, nil
	}

	// If all test cases passed, return success
	return &SolutionResult{
		Status:  "success",
		Message: "All test cases passed!",
	}, nil
}

package controllers

import (
	"database/sql"
	"diplom/internal/problems"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

// SubmitSolutionHandler processes code submissions for a problem
func (h *Handlers) SubmitSolutionHandler(c *gin.Context) {
	// Validate problem UUID
	problemUUID := c.Param("uuid")
	if _, err := uuid.Parse(problemUUID); err != nil {
		h.Logger.Error("invalid problem UUID", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid problem UUID"})
		return
	}

	// Parse request body
	var req problems.SolutionRequest
	req.ProblemUUID = problemUUID
	if err := c.ShouldBindJSON(&req); err != nil {
		h.Logger.Error("invalid solution request", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	userID := c.GetString("userID")
	if userID == "" {
		h.Logger.Error("user ID not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Process solution
	result, err := h.ProblemService.ProcessSolution(c.Request.Context(), req, c.GetString("userID"))

	switch {
	case errors.Is(err, problems.ErrCompilationFailed) || errors.Is(err, problems.ErrExecutionFailed):
		c.JSON(http.StatusBadRequest, result)
		return
	case errors.Is(err, problems.ErrProblemNotFound) || errors.Is(err, problems.ErrTestCasesNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	case err != nil:
		h.Logger.Error("failed to process solution", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	default:
	}

	// Get comparative statistics
	avgTime, avgMemory, timeBeatPercent, memoryBeatPercent, errStat := h.ProblemService.ProblemRepo.GetSolutionStatistics(
		problemUUID,
		userID,
		req.Language,
		result.Details.AverageTime,
		int64(result.Details.AverageMemory),
	)
	if errStat == nil {
		result.Details.AvgOtherTime = avgTime
		result.Details.AvgOtherMemory = avgMemory
		result.Details.TimeBeatPercent = timeBeatPercent
		result.Details.MemoryBeatPercent = memoryBeatPercent
	} else {
		h.Logger.Error("failed to get solution statistics", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get solution statistics"})
	}

	c.JSON(http.StatusOK, result)
}

// GetProblemHandler returns details for a specific problem
func (h *Handlers) GetProblemHandler(c *gin.Context) {
	// Validate problem UUID
	problemUUID := c.Param("uuid")
	if _, err := uuid.Parse(problemUUID); err != nil {
		h.Logger.Error("invalid problem UUID", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid problem UUID"})
		return
	}

	userID := c.GetString("userID")
	// Get problem details
	problem, err := h.ProblemService.ProblemRepo.GetProblemByUUID(problemUUID, userID)
	if err != nil {
		h.Logger.Error("failed to get problem", zap.Error(err))
		c.JSON(http.StatusNotFound, gin.H{"error": "problem not found"})
		return
	}

	if problem.Solved {
		solution, err := h.ProblemService.ProblemRepo.GetSolutionByProblemAndUser(userID, problem.UUID)
		if err != nil {
			h.Logger.Error("failed to get solution", zap.Error(err))
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get solution"})
			return
		}
		// Get comparative statistics
		avgTime, avgMemory, timeBeatPercent, memoryBeatPercent, err := h.ProblemService.ProblemRepo.GetSolutionStatistics(
			problem.UUID,
			userID,
			solution.Language,
			solution.AverageTime,
			int64(solution.AverageMemory),
		)
		if err == nil {
			solution.AvgOtherTime = avgTime
			solution.AvgOtherMemory = avgMemory
			solution.TimeBeatPercent = timeBeatPercent
			solution.MemoryBeatPercent = memoryBeatPercent
		} else {
			h.Logger.Error("failed to get solution statistics", zap.Error(err))
		}
		problem.Solution = &solution
	}

	c.JSON(http.StatusOK, problem)
}

func (h *Handlers) GetAllProblemsHandler(c *gin.Context) {
	problems, err := h.ProblemService.ProblemRepo.GetAllProblems(c.GetString("userID"))

	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		h.Logger.Error("failed to get problems", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get problems"})
		return
	}

	c.JSON(http.StatusOK, problems)
}

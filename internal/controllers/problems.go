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

	// Process solution
	result, err := h.ProblemService.ProcessSolution(c.Request.Context(), req, c.GetString("userID"))

	switch {
	case errors.Is(err, problems.ErrCompilationFailed) || errors.Is(err, problems.ErrExecutionFailed):
		c.JSON(http.StatusBadRequest, result)
	case errors.Is(err, problems.ErrProblemNotFound) || errors.Is(err, problems.ErrTestCasesNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
	case err != nil:
		h.Logger.Error("failed to process solution", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
	default:
		c.JSON(http.StatusOK, result)
	}
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

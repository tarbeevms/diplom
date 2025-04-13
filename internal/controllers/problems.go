package controllers

import (
	"diplom/internal/problems"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

// // GetProblemHandler возвращает информацию о задаче по UUID
// func (h *Handlers) GetProblemHandler(c *gin.Context) {
// 	problemUUID := c.Param("uuid")
// 	if _, err := uuid.Parse(problemUUID); err != nil {
// 		h.Logger.Error("invalid problem UUID", zap.Error(err))
// 		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid problem UUID"})
// 		return
// 	}

// 	problem, err := h.ProblemService.ProblemRepo.GetProblemByUUID(problemUUID)
// 	if err != nil {
// 		h.Logger.Error("failed to get problem", zap.Error(err))
// 		c.JSON(http.StatusNotFound, gin.H{"error": "Problem not found"})
// 		return
// 	}

// 	c.JSON(http.StatusOK, problem)
// }

// SubmitSolutionHandler processes a solution submitted for a problem
func (h *Handlers) SubmitSolutionHandler(c *gin.Context) {
	var req problems.SolutionRequest

	// Bind the request body to the struct
	if err := c.ShouldBindJSON(&req); err != nil {
		h.Logger.Error("invalid solution request", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate the problem UUID
	if _, err := uuid.Parse(req.ProblemUUID); err != nil {
		h.Logger.Error("invalid problem UUID", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid problem UUID"})
		return
	}

	// Process the solution using a separate function
	result, err := h.ProblemService.ProcessSolution(c.Request.Context(), req)
	if err != nil {
		h.Logger.Error("failed to process solution", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Return the result to the user
	c.JSON(http.StatusOK, result)
}

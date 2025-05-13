package controllers

import (
	"diplom/internal/problems"
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

// AdminDashboardHandler – пример обработчика для администраторской панели
func AdminDashboardHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Добро пожаловать в админ-панель"})
}

func (h *Handlers) CreateProblemHandler(c *gin.Context) {
	var req problems.CreateProblemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.Logger.Error("failed to bind problem request", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request payload"})
		return
	}

	problemUUID := uuid.New().String()

	err := h.ProblemService.ProblemRepo.(interface {
		AddProblem(uuid, name, difficulty, description string) error
	}).AddProblem(problemUUID, req.Name, req.Difficulty, req.Description)
	if err != nil {
		h.Logger.Error("failed to add problem", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to add problem"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "problem added successfully", "uuid": problemUUID})
}

func (h *Handlers) AddTestcaseHandler(c *gin.Context) {
	problemUUID := c.Param("uuid")
	if problemUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "problem UUID is required"})
		return
	}

	problem, err := h.ProblemService.ProblemRepo.GetProblemByUUID(problemUUID, c.GetString("userID"))
	if errors.Is(err, problems.ErrProblemNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"error": "problem not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get problem"})
		h.Logger.Error("failed to get problem", zap.Error(err))
		return
	}

	var req problems.CreateTestcaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.Logger.Error("failed to bind testcase request", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request payload"})
		return
	}

	err = h.ProblemService.ProblemRepo.AddTestcase(problem.UUID, req.Input, req.Output)
	if err != nil {
		h.Logger.Error("failed to add test case", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to add test case"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "test case added successfully"})
}

func (h *Handlers) GetProblemTestcasesHandler(c *gin.Context) {
	problemUUID := c.Param("uuid")
	if problemUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "problem UUID is required"})
		return
	}

	problem, err := h.ProblemService.ProblemRepo.GetProblemByUUID(problemUUID, c.GetString("userID"))
	if errors.Is(err, problems.ErrProblemNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"error": "problem not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get problem"})
		h.Logger.Error("failed to get problem", zap.Error(err))
		return
	}

	testcases, err := h.ProblemService.ProblemRepo.GetTestCasesByProblemUUID(problem.UUID)
	if err != nil && !errors.Is(err, problems.ErrTestCasesNotFound) {
		h.Logger.Error("failed to get test cases", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get test cases"})
		return
	}

	c.JSON(http.StatusOK, testcases)
}

func (h *Handlers) DeleteTestcaseHandler(c *gin.Context) {
	testcaseID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid testcase ID format"})
		return
	}

	err = h.ProblemService.ProblemRepo.DeleteTestcase(testcaseID)
	if err != nil {
		if err.Error() == "testcase not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "testcase not found"})
			return
		}
		h.Logger.Error("failed to delete testcase", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete testcase"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "testcase deleted successfully"})
}

func (h *Handlers) DeleteProblemHandler(c *gin.Context) {
	problemUUID := c.Param("uuid")
	if problemUUID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Problem UUID is required"})
		return
	}

	problem, err := h.ProblemService.ProblemRepo.GetProblemByUUID(problemUUID, c.GetString("userID"))
	if errors.Is(err, problems.ErrProblemNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"error": "problem not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get problem"})
		h.Logger.Error("failed to get problem", zap.Error(err))
		return
	}

	testcases, err := h.ProblemService.ProblemRepo.GetTestCasesByProblemUUID(problem.UUID)
	if errors.Is(err, problems.ErrTestCasesNotFound) {
		h.Logger.Error("test cases not found", zap.Error(err))
	} else if err != nil {
		h.Logger.Error("failed to get test cases", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get test cases"})
		return
	}

	for _, testcase := range testcases {
		err = h.ProblemService.ProblemRepo.DeleteTestcase(testcase.ID)
		if err != nil {
			h.Logger.Error("failed to delete testcase", zap.Error(err))
		}
	}

	err = h.ProblemService.ProblemRepo.DeleteProblem(problem.UUID)
	if err != nil {
		h.Logger.Error("failed to delete problem", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete problem"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Problem and all its testcases deleted successfully"})
}

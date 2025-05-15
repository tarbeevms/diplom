package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// ProfileHandler возвращает информацию о профиле пользователя с расширенной статистикой
func (h *Handlers) ProfileHandler(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "необходима авторизация"})
		return
	}
	role := c.GetString("role")
	if role == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "необходима авторизация"})
		return
	}
	username := c.GetString("username")
	if username == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "необходима авторизация"})
		return
	}

	// Получаем список всех задач для пользователя
	problems, err := h.ProblemService.ProblemRepo.GetAllProblems(userID)
	if err != nil {
		h.Logger.Error("failed to get problems", zap.Error(err))
	}

	// Подсчитываем количество задач по сложности
	easyCount := 0
	mediumCount := 0
	hardCount := 0

	for _, p := range problems {
		if p.Solved {
			switch p.Difficulty {
			case "easy":
				easyCount++
			case "medium":
				mediumCount++
			case "hard":
				hardCount++
			}
		}
	}

	// Вычисляем текущий и самый длинный стрик
	currentStreak, longestStreak, err := h.UserService.UserRepo.GetUserStreaks(userID)
	if err != nil {
		h.Logger.Error("failed to get streaks", zap.Error(err))
		currentStreak = 0
		longestStreak = 0
	}

	// Вычисляем процент успешных решений
	successRate, err := h.UserService.UserRepo.CalculateSuccessRate(userID)
	if err != nil {
		h.Logger.Error("failed to calculate success rate", zap.Error(err))
		successRate = 0
	}

	// Формируем ответ с расширенной информацией
	response := gin.H{
		"role":     role,
		"userID":   userID,
		"username": username,
		"problems": problems,
		"problemsByDifficulty": gin.H{
			"easy":   easyCount,
			"medium": mediumCount,
			"hard":   hardCount,
		},
		"streak":        currentStreak,
		"longestStreak": longestStreak,
		"successRate":   successRate,
	}

	c.JSON(http.StatusOK, response)
}

// SolutionHistoryHandler returns solution history for a user and problem
func (h *Handlers) SolutionHistoryHandler(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "необходима авторизация"})
		return
	}

	// Get problem UUID from query parameter, empty string means all problems
	problemUUID := c.Query("problem_uuid")

	solutions, err := h.UserService.UserRepo.GetUserSolutions(userID, problemUUID)
	if err != nil {
		h.Logger.Error("failed to get solution history", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "не удалось получить историю решений"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"solutions": solutions,
	})
}

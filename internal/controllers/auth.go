package controllers

import (
	"diplom/internal/auth"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// --- Пример обработчиков (handlers) ---

func (h *Handlers) LoginHandler(c *gin.Context) {
	var req auth.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad Request"})
		return
	}

	userID, role, err := h.AuthService.VerifyUserCredentials(req.Username, req.Password)
	if errors.Is(err, auth.ErrInvalidCredentials) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	token, err := h.AuthService.CreateSession(req.Username, userID, role)
	if err != nil {
		h.AuthService.Logger.Error("error in create session", zap.Error(err))
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Failed to create (rewrite) session"})
		return
	}

	h.AuthService.Logger.Info("user loggined", zap.String("username", req.Username))
	c.JSON(http.StatusOK, auth.LoginResponse{Token: token})
}

// SignupHandler обрабатывает запрос на регистрацию
func SignupHandler(c *gin.Context) {
	// Здесь должна быть логика регистрации пользователя
	c.JSON(http.StatusOK, gin.H{"message": "Регистрация успешна"})
}

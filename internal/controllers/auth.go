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
func (h *Handlers) SignupHandler(c *gin.Context) {
	var req auth.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Validate input
	if req.Username == "" || req.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username and password are required"})
		return
	}

	// Hash the password
	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		h.AuthService.Logger.Error("error hashing password", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process password"})
		return
	}

	// TODO: Add check is user already exists (maybe handle repo error)

	// Save the user to the database
	err = h.AuthService.SessionRepo.AddUser(req.Username, hashedPassword)
	if err != nil {
		h.AuthService.Logger.Error("error saving user to database", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	h.AuthService.Logger.Info("user registered successfully", zap.String("username", req.Username))
	c.JSON(http.StatusOK, gin.H{"message": "User registered successfully"})
}

package controllers

import (
	"diplom/config"
	"diplom/internal/auth"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt"
)

// ProfileHandler возвращает информацию о профиле пользователя, извлекая данные из JWT, сохранённого в cookie.
func ProfileHandler(c *gin.Context) {
	sessionToken, err := c.Cookie("session")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Session token not provided"})
		return
	}

	claims := &auth.Claims{}

	token, err := jwt.ParseWithClaims(sessionToken, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(config.CFG.SecretKey), nil
	})
	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid session token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"userID":  claims.UserID,
		"role":    claims.Role,
		"message": "Добро пожаловать в профиль",
	})
}

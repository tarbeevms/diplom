package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ProfileHandler возвращает информацию о профиле пользователя, извлекая данные из JWT, сохранённого в cookie.
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

	c.JSON(http.StatusOK, gin.H{
		"userID":  userID,
		"role":    role,
		"message": "Добро пожаловать в профиль",
	})
}

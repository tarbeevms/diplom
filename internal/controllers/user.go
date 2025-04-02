package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ProfileHandler возвращает информацию о профиле пользователя
func ProfileHandler(c *gin.Context) {
	userID, _ := c.Get("userID")
	role, _ := c.Get("role")
	c.JSON(http.StatusOK, gin.H{
		"userID":  userID,
		"role":    role,
		"message": "Добро пожаловать в профиль",
	})
}

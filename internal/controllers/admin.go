package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// AdminDashboardHandler – пример обработчика для администраторской панели
func AdminDashboardHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Добро пожаловать в админ-панель"})
}

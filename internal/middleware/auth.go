package middleware

import (
	"net/http"
	"strings"

	"diplom/internal/auth"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware проверяет наличие и валидность JWT-токена
func AuthMiddleware(a *auth.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Отсутствует токен авторизации"})
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Неверный формат токена"})
			return
		}

		tokenString := parts[1]

		// Проверяем авторизацию и существование сессии в базе данных, не просрочена ли она
		authorized, claims, err := a.IsAuthorized(tokenString)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Not authorized: " + err.Error()})
			return
		} else if !authorized {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Not authorized"})
			return
		}

		// Сохраняем данные пользователя в контекст запроса
		c.Set("userID", claims.UserID)
		c.Set("role", claims.Role)

		c.Next()
	}
}

// RoleMiddleware проверяет, что роль пользователя соответствует одному из разрешённых
func RoleMiddleware(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleInterface, exists := c.Get("role")
		if !exists {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Нет прав доступа"})
			return
		}

		userRole, ok := roleInterface.(string)
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Некорректные данные роли"})
			return
		}

		// Проверяем, содержится ли роль пользователя среди разрешённых
		for _, allowed := range allowedRoles {
			if userRole == allowed {
				c.Next()
				return
			}
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Нет прав доступа"})
	}
}

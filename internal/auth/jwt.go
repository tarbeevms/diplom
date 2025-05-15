package auth

import (
	"diplom/config"
	"time"

	"github.com/golang-jwt/jwt"
)

// Claims – кастомные данные, которые будут храниться в токене
type Claims struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.StandardClaims
}

type Session struct {
	Username string `json:"username"`
	Token    string `json:"token"`
}

// GenerateToken генерирует JWT-токен для заданного пользователя и его роли
func GenerateToken(userID string, role string, username string) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		UserID:   userID,
		Role:     role,
		Username: username,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime.Unix(),
			IssuedAt:  time.Now().Unix(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.CFG.SecretKey))
}

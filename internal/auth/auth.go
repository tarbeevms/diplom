package auth

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid username or password")
)

type SessionRepository interface {
	AddSession(sess *Session) error
	DeleteSessionByToken(token string) error
	GetSessionByToken(token string) (*Session, error)
	VerifyUsernamePassword(username, password string) (userID, role string, match bool, err error)
	AddUser(username, hashedPassword string) error
}

type AuthService struct {
	SessionRepo SessionRepository
	Logger      *zap.Logger
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
}

func NewAuthService(repo SessionRepository, logger *zap.Logger) *AuthService {
	return &AuthService{
		SessionRepo: repo,
		Logger:      logger.Named("auth"),
	}
}

func (a *AuthService) IsAuthorized(token *jwt.Token, claims *Claims) (bool, error) {
	session, err := a.SessionRepo.GetSessionByToken(token.Raw)
	if err != nil || session == nil {
		return false, err
	}

	exp := claims.ExpiresAt
	if exp == 0 {
		return false, fmt.Errorf("invalid token, missing expiration")
	}

	if time.Now().Unix() > exp {
		err := a.SessionRepo.DeleteSessionByToken(token.Raw)
		if err != nil {
			return false, fmt.Errorf("failed to delete expired session, %w", err)
		}
		return false, fmt.Errorf("session expired")
	}

	return true, nil
}

func (a *AuthService) VerifyUserCredentials(username, password string) (userID string, role string, err error) {
	// Проверяем учетные данные пользователя
	userID, role, match, err := a.SessionRepo.VerifyUsernamePassword(username, password)
	if err != nil && err != sql.ErrNoRows {
		return "", "", err
	}
	if !match {
		return "", "", ErrInvalidCredentials
	}
	return userID, role, nil
}

// CreateSession генерирует токен и добавляет сессию в базу данных.
func (a *AuthService) CreateSession(username, userID, role string) (string, error) {
	accessToken, err := GenerateToken(userID, role)
	if err != nil {
		return "", fmt.Errorf("failed to create access token, %w", err)
	}
	// Создание сессии
	newSession := &Session{
		Username: username,
		Token:    accessToken,
	}
	// Сохранение сессии в базе данных
	err = a.SessionRepo.AddSession(newSession)
	if err != nil {
		return "", fmt.Errorf("failed to write (rewrite) session, %w", err)
	}
	return accessToken, nil
}

// HashPassword hashes a plain-text password using bcrypt.
func HashPassword(password string) (string, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashed), nil
}

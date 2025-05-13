package auth

import (
	"database/sql"
	"diplom/config"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid username or password")
	ErrInvalidToken       = errors.New("invalid token")
	ErrSessionExpired     = errors.New("session expired")
)

var (
	CookieExpirationTime = time.Now().Add(5 * time.Hour)
)

type SessionRepository interface {
	AddSession(sess *Session) error
	DeleteSessionByToken(token string) error
	GetSessionByToken(token string) (*Session, error)
	VerifyUsernamePassword(username, password string) (userID, role string, match bool, err error)
	AddUser(username, hashedPassword, role string) error
	IsUserExists(username string) (bool, error)
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

func (a *AuthService) IsAuthorized(tokenString string) (bool, *Claims, error) {
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(config.CFG.SecretKey), nil
	})
	if err != nil || !token.Valid {
		return false, nil, ErrInvalidToken
	}

	session, err := a.SessionRepo.GetSessionByToken(token.Raw)
	if errors.Is(err, sql.ErrNoRows) {
		return false, nil, nil
	}
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return false, nil, err
	}

	exp := claims.ExpiresAt
	if exp == 0 {
		return false, nil, ErrInvalidToken
	}

	if time.Now().Unix() > exp {
		err := a.SessionRepo.DeleteSessionByToken(session.Token)
		if err != nil {
			return false, nil, err
		}
		return false, nil, ErrSessionExpired
	}

	return true, claims, nil
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

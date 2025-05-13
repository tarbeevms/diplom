package controllers

import (
	"diplom/internal/auth"
	"diplom/internal/problems"
	"diplom/internal/user"

	"go.uber.org/zap"
)

type Handlers struct {
	AuthService    *auth.AuthService
	ProblemService *problems.ProblemService
	UserService    *user.UserService
	Logger         *zap.Logger
}

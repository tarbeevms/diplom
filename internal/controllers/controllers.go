package controllers

import (
	"diplom/internal/auth"
	"diplom/internal/problems"

	"go.uber.org/zap"
)

type Handlers struct {
	AuthService    *auth.AuthService
	ProblemService *problems.ProblemService
	Logger         *zap.Logger
}

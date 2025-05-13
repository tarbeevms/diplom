package user

import "go.uber.org/zap"

type UserService struct {
	UserRepo UserRepository
	Logger   *zap.Logger
}

type UserRepository interface {
}

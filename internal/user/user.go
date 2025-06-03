package user

import (
	"diplom/internal/problems"

	"go.uber.org/zap"
)

type UserService struct {
	UserRepo UserRepository
	Logger   *zap.Logger
}

func NewUserService(userRepo UserRepository, logger *zap.Logger) *UserService {
	return &UserService{
		UserRepo: userRepo,
		Logger:   logger.Named("user"),
	}
}

type UserRepository interface {
	GetUserStreaks(userID string) (currentStreak int, longestStreak int, err error)
	CalculateSuccessRate(userID string) (float64, error)
	GetUserSolutions(userID string, problemUUID string) ([]problems.ProblemSolution, error)
}

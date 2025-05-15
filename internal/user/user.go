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
	// Add method for calculating success rate
	CalculateSuccessRate(userID string) (float64, error)
	// Add method to get solution history
	GetUserSolutions(userID string, problemUUID string) ([]problems.ProblemSolution, error)
}

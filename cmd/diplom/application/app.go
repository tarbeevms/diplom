package application

import (
	"diplom/config"
	"diplom/internal/auth"
	"diplom/internal/controllers"
	"diplom/internal/problems"
	"diplom/internal/repo"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type Application struct {
	Server   *gin.Engine
	Handlers controllers.Handlers
	Logger   *zap.Logger
}

func InitApplication() (*Application, error) {
	config.ConfigInit()
	pgClient, err := repo.InitPG()
	if err != nil {
		return nil, err
	}
	logger, err := zap.NewDevelopment()
	if err != nil {
		return nil, err
	}
	problemService, err := problems.NewProblemService(pgClient, logger)
	if err != nil {
		return nil, err
	}
	app := &Application{
		Handlers: controllers.Handlers{
			AuthService:    auth.NewAuthService(pgClient, logger),
			ProblemService: problemService,
			Logger:         logger.Named("handlers"),
		},
		Logger: logger,
	}
	app.InitServer()
	return app, nil
}

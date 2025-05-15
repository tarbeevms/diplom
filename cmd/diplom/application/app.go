package application

import (
	"diplom/config"
	"diplom/internal/auth"
	"diplom/internal/controllers"
	"diplom/internal/problems"
	"diplom/internal/repo"
	"diplom/internal/user"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

type Application struct {
	Server   *gin.Engine
	Handlers controllers.Handlers
	Logger   *zap.Logger
}

func InitApplication() (*Application, error) {
	gin.SetMode(gin.ReleaseMode)

	config.ConfigInit()
	pgClient, err := repo.InitPG()
	if err != nil {
		return nil, err
	}
	config := zap.NewProductionConfig()
	config.Level = zap.NewAtomicLevelAt(zapcore.DebugLevel)
	logger, err := config.Build()
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
			UserService:    user.NewUserService(pgClient, logger),
			Logger:         logger.Named("handlers"),
		},
		Logger: logger,
	}
	app.InitServer()

	return app, nil
}

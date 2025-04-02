package application

import (
	"diplom/internal/auth"
	"diplom/internal/controllers"
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
	pgClient, err := repo.InitPG()
	if err != nil {
		return nil, err
	}
	logger, err := zap.NewDevelopment()
	if err != nil {
		return nil, err
	}
	app := &Application{
		Handlers: controllers.Handlers{
			AuthService: auth.NewAuthService(pgClient, logger),
		},
		Logger: logger,
	}
	app.InitServer()
	return app, nil
}

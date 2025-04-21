package application

import (
	"diplom/internal/controllers"
	"diplom/internal/middleware"

	"github.com/gin-gonic/gin"
)

// NewRouter инициализирует маршруты и возвращает настроенный роутер
func (app *Application) InitServer() {
	router := gin.Default()

	authGroup := router.Group("/api/auth")
	{
		authGroup.POST("/login", app.Handlers.LoginHandler)
		authGroup.POST("/signup", app.Handlers.SignupHandler)
	}

	// Группа защищённых маршрутов
	protected := router.Group("/api")
	protected.Use(middleware.AuthMiddleware(app.Handlers.AuthService))
	{
		protected.GET("/profile", controllers.ProfileHandler)
		// Группа маршрутов для работы с проблемами
		problems := protected.Group("/problem")
		{
			// GET запрос для получения информации о проблеме
			problems.GET("/:uuid", app.Handlers.GetProblemHandler)

			// POST запрос для отправки решения проблемы
			problems.POST("/:uuid", app.Handlers.SubmitSolutionHandler)
		}
	}

	// Группа маршрутов для администраторов
	admin := router.Group("/api/admin")
	admin.Use(middleware.AuthMiddleware(app.Handlers.AuthService), middleware.RoleMiddleware("admin"))
	{
		admin.GET("/dashboard", controllers.AdminDashboardHandler)
	}

	// Дополнительные группы (например, для задач, сабмишенов и т.д.) можно добавить здесь

	app.Server = router
}

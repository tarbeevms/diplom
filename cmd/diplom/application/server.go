package application

import (
	"diplom/internal/controllers"
	"diplom/internal/middleware"

	"github.com/gin-gonic/gin"
)

// NewRouter инициализирует маршруты и возвращает настроенный роутер
func (app *Application) InitServer() {
	router := gin.Default()

	// Группа публичных маршрутов для аутентификации
	authGroup := router.Group("/api/auth")
	{
		authGroup.POST("/login", controllers.LoginHandler)
		authGroup.POST("/signup", controllers.SignupHandler)
	}

	// Группа защищённых маршрутов
	protected := router.Group("/api")
	protected.Use(middleware.AuthMiddleware(app.Handlers.AuthService))
	{
		protected.GET("/profile", controllers.ProfileHandler)
	}

	// Группа маршрутов для администраторов
	admin := router.Group("/api/admin")
	admin.Use(middleware.AuthMiddleware(), middleware.RoleMiddleware("admin"))
	{
		admin.GET("/dashboard", controllers.AdminDashboardHandler)
	}

	// Дополнительные группы (например, для задач, сабмишенов и т.д.) можно добавить здесь

	app.Server = router
}

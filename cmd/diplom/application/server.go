package application

import (
	"diplom/internal/controllers"
	"time"

	"github.com/gin-contrib/cors"

	"github.com/gin-gonic/gin"
)

// NewRouter инициализирует маршруты и возвращает настроенный роутер
func (app *Application) InitServer() {
	router := gin.Default()

	// Добавляем CORS middleware
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	authGroup := router.Group("/api/auth")
	{
		authGroup.POST("/login", app.Handlers.LoginHandler)
		authGroup.POST("/signup", app.Handlers.SignupHandler)
	}

	// Группа защищённых маршрутов
	protected := router.Group("/api")
	protected.Use(app.Handlers.AuthService.AuthMiddleware())
	{
		protected.GET("/profile", app.Handlers.ProfileHandler)
		protected.GET("/problems", app.Handlers.GetAllProblemsHandler)
		protected.GET("/solutions", app.Handlers.SolutionHistoryHandler)
		problems := protected.Group("/problem")
		{
			problems.GET("/:uuid", app.Handlers.GetProblemHandler)
			problems.POST("/:uuid", app.Handlers.SubmitSolutionHandler)
		}
	}

	// Группа маршрутов для администраторов
	admin := router.Group("/api/admin")
	admin.Use(app.Handlers.AuthService.AuthMiddleware(), app.Handlers.AuthService.RoleMiddleware("admin"))
	{
		admin.GET("/dashboard", controllers.AdminDashboardHandler)

		admin.POST("/problem", app.Handlers.CreateProblemHandler)
		admin.POST("/problem/:uuid/testcase", app.Handlers.AddTestcaseHandler)

		admin.GET("/problem/:uuid/testcases", app.Handlers.GetProblemTestcasesHandler)

		admin.DELETE("/testcase/:id", app.Handlers.DeleteTestcaseHandler)
		admin.DELETE("/problem/:uuid", app.Handlers.DeleteProblemHandler)
	}

	app.Server = router
}

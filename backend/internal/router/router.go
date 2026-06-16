package router

import (
	"github.com/gin-gonic/gin"
	"github.com/homematch/crm/internal/config"
	"github.com/homematch/crm/internal/handlers"
	"github.com/homematch/crm/internal/middleware"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"gorm.io/gorm"
)

func New(db *gorm.DB, cfg *config.Config) *gin.Engine {
	r := gin.Default()

	r.Use(corsMiddleware())
	r.Static("/uploads", cfg.UploadDir)

	authH := handlers.NewAuthHandler(db, cfg)
	clientsH := handlers.NewClientsHandler(db, cfg)
	propsH := handlers.NewPropertiesHandler(db, cfg)
	dealsH := handlers.NewDealsHandler(db, cfg)
	selectionsH := handlers.NewSelectionsHandler(db, cfg)
	geoH := handlers.NewGeoHandler(cfg)
	publicH := handlers.NewPublicHandler(db, cfg)
	bookingsH := handlers.NewBookingsHandler(db, cfg)
	aiH := handlers.NewAIHandler(db, cfg)
	igH := handlers.NewInstagramHandler(db, cfg)

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"status": "ok"}) })

	v1 := r.Group("/api/v1")

	auth := v1.Group("/auth")
	{
		auth.POST("/login", authH.Login)
		auth.POST("/register", authH.Register)
		auth.GET("/me", middleware.Auth(cfg), authH.Me)
	}

	protected := v1.Group("/", middleware.Auth(cfg))
	{
		clients := protected.Group("/clients")
		{
			clients.GET("", clientsH.List)
			clients.POST("", clientsH.Create)
			clients.GET("/:id", clientsH.Get)
			clients.PUT("/:id", clientsH.Update)
			clients.DELETE("/:id", clientsH.Delete)
			clients.GET("/:id/match", clientsH.Match)
			clients.POST("/:id/interactions", clientsH.AddInteraction)
		}

		props := protected.Group("/properties")
		{
			props.GET("", propsH.List)
			props.POST("", propsH.Create)
			props.GET("/:id", propsH.Get)
			props.PUT("/:id", propsH.Update)
			props.DELETE("/:id", propsH.Delete)
			props.GET("/:id/nearby", propsH.Nearby)
			props.GET("/:id/match/:client_id", propsH.MatchForClient)
			props.POST("/:id/cover", aiH.UploadCover)
			props.POST("/:id/generate", aiH.GenerateDescription)
			props.PUT("/:id/description", aiH.UpdateDescription)
		}

		deals := protected.Group("/deals")
		{
			deals.GET("", dealsH.List)
			deals.POST("", dealsH.Create)
			deals.GET("/:id", dealsH.Get)
			deals.PUT("/:id/stage", dealsH.UpdateStage)
			deals.DELETE("/:id", dealsH.Delete)
		}

		bookings := protected.Group("/bookings")
		{
			bookings.POST("", bookingsH.Create)
			bookings.DELETE("/:id", bookingsH.Delete)
		}

		sels := protected.Group("/selections")
		{
			sels.POST("", selectionsH.Create)
			sels.GET("", selectionsH.List)
			sels.GET("/:id", selectionsH.Get)
		}

		protected.GET("/geo/nearby", geoH.Nearby)
		protected.GET("/geo/suggest", geoH.Suggest)

		ig := protected.Group("/instagram")
		{
			ig.GET("", igH.GetIntegration)
			ig.POST("/connect", igH.Connect)
			ig.DELETE("/disconnect", igH.Disconnect)
			ig.GET("/stats", igH.Stats)
		}
	}

	public := v1.Group("/public", middleware.APIKey(db))
	{
		public.GET("/properties", publicH.ListProperties)
		public.GET("/properties/:id", publicH.GetProperty)
		public.POST("/leads", publicH.CreateLead)
		public.GET("/selections/:token", publicH.GetSelection)
		public.POST("/selections/:token/feedback", publicH.AddFeedback)
	}

	return r
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization, X-API-Key")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

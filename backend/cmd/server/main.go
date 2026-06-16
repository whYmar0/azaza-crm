// @title        Nearby CRM API
// @version      1.0
// @description  CRM для агентств недвижимости — подбор объектов по инфраструктуре, Match Score, воронка сделок
// @host         localhost:8080
// @BasePath     /
// @SecurityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @SecurityDefinitions.apikey ApiKeyAuth
// @in header
// @name X-API-Key

package main

import (
	"flag"
	"log"

	_ "github.com/homematch/crm/docs"
	"github.com/homematch/crm/internal/config"
	"github.com/homematch/crm/internal/database"
	"github.com/homematch/crm/internal/router"
	"github.com/homematch/crm/internal/services"
	"github.com/joho/godotenv"
)

func main() {
	seedFlag := flag.Bool("seed", false, "Force re-seed database")
	flag.Parse()

	if err := godotenv.Load(); err != nil {
		log.Println("no .env file, using environment variables")
	}

	cfg := config.Load()

	db := database.Connect(cfg)
	database.Migrate(db)
	database.Seed(db, *seedFlag)

	services.StartAutomation(db)

	r := router.New(db, cfg)
	log.Printf("Nearby CRM listening on :%s", cfg.Port)
	log.Printf("Swagger: http://localhost:%s/swagger/index.html", cfg.Port)

	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

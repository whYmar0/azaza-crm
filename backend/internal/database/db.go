package database

import (
	"log"

	"github.com/homematch/crm/internal/config"
	"github.com/homematch/crm/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect(cfg *config.Config) *gorm.DB {
	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}
	return db
}

func Migrate(db *gorm.DB) {
	err := db.AutoMigrate(
		&models.Organization{},
		&models.User{},
		&models.Client{},
		&models.Property{},
		&models.Deal{},
		&models.Booking{},
		&models.Interaction{},
		&models.Selection{},
		&models.SelectionFeedback{},
		&models.ApiKey{},
		&models.WebhookSubscription{},
		&models.AutomationRule{},
		&models.InstagramIntegration{},
		&models.WhatsAppIntegration{},
		&models.Notification{},
	)
	if err != nil {
		log.Fatalf("migration failed: %v", err)
	}
	log.Println("database migrated")
}

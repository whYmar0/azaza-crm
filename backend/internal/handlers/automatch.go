package handlers

import (
	"fmt"

	"github.com/homematch/crm/internal/config"
	"github.com/homematch/crm/internal/models"
	"github.com/homematch/crm/internal/services"
	"gorm.io/gorm"
)

const autoMatchThreshold = 80

func scanPropertyForMatches(db *gorm.DB, cfg *config.Config, prop models.Property) {
	var clients []models.Client
	if err := db.Where("organization_id = ?", prop.OrganizationID).Find(&clients).Error; err != nil || len(clients) == 0 {
		return
	}

	nearby := fetchNearby(cfg, prop.Lat, prop.Lng, 800)

	for _, client := range clients {
		result := services.Calculate(client, prop, nearby)
		if result.Score < autoMatchThreshold {
			continue
		}
		notif := models.Notification{
			OrganizationID: prop.OrganizationID,
			ClientID:       client.ID,
			PropertyID:     prop.ID,
			Score:          result.Score,
			Message:        fmt.Sprintf("Клиенту %s подходит новый объект «%s» (%d%%)", client.Name, prop.Title, result.Score),
		}
		db.Create(&notif)
	}
}

func scanClientForMatches(db *gorm.DB, cfg *config.Config, client models.Client) {
	var props []models.Property
	if err := db.Where("organization_id = ? AND status = 'free'", client.OrganizationID).Find(&props).Error; err != nil || len(props) == 0 {
		return
	}

	for _, prop := range props {
		nearby := fetchNearby(cfg, prop.Lat, prop.Lng, 800)
		result := services.Calculate(client, prop, nearby)
		if result.Score < autoMatchThreshold {
			continue
		}
		notif := models.Notification{
			OrganizationID: client.OrganizationID,
			ClientID:       client.ID,
			PropertyID:     prop.ID,
			Score:          result.Score,
			Message:        fmt.Sprintf("Новому клиенту %s подходит объект «%s» (%d%%)", client.Name, prop.Title, result.Score),
		}
		db.Create(&notif)
	}
}

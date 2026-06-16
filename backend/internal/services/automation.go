package services

import (
	"fmt"
	"log"
	"time"

	"github.com/homematch/crm/internal/models"
	"github.com/robfig/cron/v3"
	"gorm.io/gorm"
)

func StartAutomation(db *gorm.DB) {
	c := cron.New()

	c.AddFunc("@every 5m", func() {
		expireBookings(db)
	})

	c.AddFunc("@every 1h", func() {
		runAutomationRules(db)
	})

	c.Start()
	log.Println("automation scheduler started")
}

func expireBookings(db *gorm.DB) {
	var bookings []models.Booking
	db.Where("status = 'active' AND expires_at < ?", time.Now()).Find(&bookings)

	for _, b := range bookings {
		db.Model(&b).Update("status", "expired")
		db.Model(&models.Property{}).Where("id = ?", b.PropertyID).Update("status", "free")

		FireWebhook(db, getOrgByProperty(db, b.PropertyID), "booking.expired", map[string]interface{}{
			"booking_id":  b.ID,
			"property_id": b.PropertyID,
			"client_id":   b.ClientID,
		})
		log.Printf("booking %d expired, property %d freed", b.ID, b.PropertyID)
	}
}

func getOrgByProperty(db *gorm.DB, propertyID uint) uint {
	var p models.Property
	db.Select("organization_id").First(&p, propertyID)
	return p.OrganizationID
}

func runAutomationRules(db *gorm.DB) {
	var rules []models.AutomationRule
	db.Where("active = true").Find(&rules)

	for _, rule := range rules {
		switch rule.Trigger {
		case "lapsed_client":
			handleLapsedClients(db, rule)
		case "deal_stuck":
			handleStuckDeals(db, rule)
		}
	}
}

func handleLapsedClients(db *gorm.DB, rule models.AutomationRule) {
	threshold := time.Now().AddDate(0, 0, -rule.ParamDays)
	var clients []models.Client
	db.Where("organization_id = ? AND (last_contact_at IS NULL OR last_contact_at < ?)", rule.OrganizationID, threshold).Find(&clients)

	for _, client := range clients {
		note := models.Interaction{
			ClientID:  client.ID,
			Channel:   "auto",
			Direction: "out",
			Text:      fmt.Sprintf("Автонапоминание: давно без контакта (%d дней)", rule.ParamDays),
		}
		db.Create(&note)
		log.Printf("automation: lapsed_client interaction created for client %d", client.ID)
	}
}

func handleStuckDeals(db *gorm.DB, rule models.AutomationRule) {
	threshold := time.Now().AddDate(0, 0, -rule.ParamDays)
	var deals []models.Deal
	db.Where("organization_id = ? AND stage NOT IN ('paid','lost') AND updated_at < ?", rule.OrganizationID, threshold).Find(&deals)

	for _, deal := range deals {
		note := models.Interaction{
			ClientID:  deal.ClientID,
			Channel:   "auto",
			Direction: "out",
			Text:      fmt.Sprintf("Автонапоминание: сделка #%d в стадии «%s» уже %d дней без движения", deal.ID, deal.Stage, rule.ParamDays),
		}
		db.Create(&note)
		log.Printf("automation: stuck deal interaction for deal %d", deal.ID)
	}
}

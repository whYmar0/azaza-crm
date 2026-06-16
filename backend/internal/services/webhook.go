package services

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/homematch/crm/internal/models"
	"gorm.io/gorm"
)

type WebhookPayload struct {
	Event     string      `json:"event"`
	Timestamp time.Time   `json:"timestamp"`
	Data      interface{} `json:"data"`
}

func FireWebhook(db *gorm.DB, orgID uint, event string, data interface{}) {
	go func() {
		var subs []models.WebhookSubscription
		db.Where("organization_id = ? AND active = true", orgID).Find(&subs)

		payload := WebhookPayload{
			Event:     event,
			Timestamp: time.Now(),
			Data:      data,
		}
		body, err := json.Marshal(payload)
		if err != nil {
			return
		}

		for _, sub := range subs {
			hasEvent := false
			for _, e := range sub.Events {
				if e == event {
					hasEvent = true
					break
				}
			}
			if !hasEvent {
				continue
			}
			sendWebhook(sub.URL, body)
		}
	}()
}

func sendWebhook(url string, body []byte) {
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Post(url, "application/json", bytes.NewReader(body))
	if err != nil {
		log.Printf("webhook error to %s: %v — retrying", url, err)
		time.Sleep(2 * time.Second)
		resp, err = client.Post(url, "application/json", bytes.NewReader(body))
		if err != nil {
			log.Printf("webhook retry failed to %s: %v", url, err)
			return
		}
	}
	defer resp.Body.Close()
	log.Printf("webhook sent to %s: %d", url, resp.StatusCode)
}

package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/homematch/crm/internal/config"
	"github.com/homematch/crm/internal/models"
	"gorm.io/gorm"
)

type WhatsAppHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewWhatsAppHandler(db *gorm.DB, cfg *config.Config) *WhatsAppHandler {
	return &WhatsAppHandler{db: db, cfg: cfg}
}

func (h *WhatsAppHandler) GetIntegration(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)
	var wa models.WhatsAppIntegration
	if err := h.db.Where("organization_id = ?", orgID).First(&wa).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"connected": false})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"connected":     true,
		"display_phone": wa.DisplayPhone,
		"verified_name": wa.VerifiedName,
	})
}

func (h *WhatsAppHandler) Connect(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)

	var body struct {
		AccessToken   string `json:"access_token"`
		PhoneNumberID string `json:"phone_number_id"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.AccessToken == "" || body.PhoneNumberID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "access_token and phone_number_id required"})
		return
	}

	url := fmt.Sprintf(
		"https://graph.facebook.com/v19.0/%s?fields=display_phone_number,verified_name&access_token=%s",
		body.PhoneNumberID, body.AccessToken,
	)
	resp, err := http.Get(url)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "cannot reach WhatsApp API"})
		return
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var info struct {
		DisplayPhone string `json:"display_phone_number"`
		VerifiedName string `json:"verified_name"`
		Error        *struct {
			Message string `json:"message"`
		} `json:"error"`
	}
	json.Unmarshal(respBody, &info)

	if info.Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": info.Error.Message})
		return
	}
	if info.DisplayPhone == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid token or phone_number_id"})
		return
	}

	wa := models.WhatsAppIntegration{OrganizationID: orgID}
	h.db.Where("organization_id = ?", orgID).FirstOrCreate(&wa)
	h.db.Model(&wa).Updates(map[string]interface{}{
		"access_token":    body.AccessToken,
		"phone_number_id": body.PhoneNumberID,
		"display_phone":   info.DisplayPhone,
		"verified_name":   info.VerifiedName,
		"updated_at":      time.Now(),
	})

	c.JSON(http.StatusOK, gin.H{"connected": true, "display_phone": info.DisplayPhone, "verified_name": info.VerifiedName})
}

func (h *WhatsAppHandler) Disconnect(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)
	h.db.Where("organization_id = ?", orgID).Delete(&models.WhatsAppIntegration{})
	c.JSON(http.StatusOK, gin.H{"connected": false})
}

func (h *WhatsAppHandler) SendMessage(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)

	var wa models.WhatsAppIntegration
	if err := h.db.Where("organization_id = ?", orgID).First(&wa).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "WhatsApp not connected"})
		return
	}

	var body struct {
		To      string `json:"to"`
		Message string `json:"message"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.To == "" || body.Message == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "to and message required"})
		return
	}

	payload, _ := json.Marshal(map[string]interface{}{
		"messaging_product": "whatsapp",
		"to":                body.To,
		"type":              "text",
		"text":              map[string]string{"body": body.Message},
	})

	url := fmt.Sprintf("https://graph.facebook.com/v19.0/%s/messages", wa.PhoneNumberID)
	req, _ := http.NewRequest(http.MethodPost, url, bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+wa.AccessToken)

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("whatsapp send error: %v", err)
		c.JSON(http.StatusBadGateway, gin.H{"error": "cannot reach WhatsApp API: " + err.Error()})
		return
	}
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	var result map[string]interface{}
	json.Unmarshal(respBody, &result)

	if errObj, ok := result["error"]; ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": errObj})
		return
	}
	c.JSON(http.StatusOK, gin.H{"sent": true, "result": result})
}

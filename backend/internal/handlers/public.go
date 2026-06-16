package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/homematch/crm/internal/config"
	"github.com/homematch/crm/internal/models"
	"github.com/homematch/crm/internal/services"
	"gorm.io/gorm"
)

type PublicHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewPublicHandler(db *gorm.DB, cfg *config.Config) *PublicHandler {
	return &PublicHandler{db: db, cfg: cfg}
}

func (h *PublicHandler) ListProperties(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)
	var props []models.Property
	h.db.Where("organization_id = ? AND status = 'free'", orgID).Order("created_at DESC").Find(&props)
	c.JSON(http.StatusOK, props)
}

func (h *PublicHandler) GetProperty(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)
	var prop models.Property
	if err := h.db.Where("id = ? AND organization_id = ? AND status = 'free'", c.Param("id"), orgID).First(&prop).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, prop)
}

func (h *PublicHandler) CreateLead(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)

	var body struct {
		Name      string  `json:"name" binding:"required"`
		Phone     string  `json:"phone"`
		Email     string  `json:"email"`
		BudgetMax float64 `json:"budget_max"`
		Notes     string  `json:"notes"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	now := time.Now()
	client := models.Client{
		OrganizationID: orgID,
		Name:           body.Name,
		Phone:          body.Phone,
		Email:          body.Email,
		BudgetMax:      body.BudgetMax,
		Status:         "new",
		LastContactAt:  &now,
	}
	h.db.Create(&client)

	note := models.Interaction{
		ClientID:  client.ID,
		Channel:   "api",
		Direction: "in",
		Text: "Лид создан через публичный API" + func() string {
			if body.Notes != "" {
				return ": " + body.Notes
			}
			return ""
		}(),
	}
	h.db.Create(&note)

	services.FireWebhook(h.db, orgID, "lead.created", map[string]interface{}{
		"client_id": client.ID,
		"name":      client.Name,
		"phone":     client.Phone,
	})

	c.JSON(http.StatusCreated, client)
}

type importResult struct {
	Index int    `json:"index"`
	ID    uint   `json:"id,omitempty"`
	Error string `json:"error,omitempty"`
}

func (h *PublicHandler) ImportProperties(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)

	body, err := c.GetRawData()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot read body"})
		return
	}

	var items []models.Property
	if err := json.Unmarshal(body, &items); err != nil {
		var single models.Property
		if err2 := json.Unmarshal(body, &single); err2 != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid JSON: expected a property object or an array of properties"})
			return
		}
		items = []models.Property{single}
	}

	results := make([]importResult, 0, len(items))
	for i, prop := range items {
		prop.ID = 0
		prop.OrganizationID = orgID
		if prop.Title == "" || prop.Type == "" {
			results = append(results, importResult{Index: i, Error: "title and type are required"})
			continue
		}
		if prop.Status == "" {
			prop.Status = "free"
		}
		if prop.Area > 0 && prop.Price > 0 {
			prop.PricePerM2 = prop.Price / prop.Area
		}
		if err := h.db.Create(&prop).Error; err != nil {
			results = append(results, importResult{Index: i, Error: err.Error()})
			continue
		}
		go scanPropertyForMatches(h.db, h.cfg, prop)
		results = append(results, importResult{Index: i, ID: prop.ID})
	}

	c.JSON(http.StatusOK, gin.H{"imported": results})
}

func (h *PublicHandler) GetSelection(c *gin.Context) {
	var sel models.Selection
	if err := h.db.Preload("Feedbacks").Where("public_token = ?", c.Param("token")).First(&sel).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	var props []models.Property
	if len(sel.PropertyIDs) > 0 {
		h.db.Where("id IN ?", sel.PropertyIDs).Find(&props)
	}

	c.JSON(http.StatusOK, gin.H{
		"selection":  sel,
		"properties": props,
	})
}

func (h *PublicHandler) AddFeedback(c *gin.Context) {
	var sel models.Selection
	if err := h.db.Where("public_token = ?", c.Param("token")).First(&sel).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	var fb models.SelectionFeedback
	if err := c.ShouldBindJSON(&fb); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	fb.SelectionID = sel.ID
	h.db.Create(&fb)

	var client models.Client
	h.db.First(&client, sel.ClientID)

	services.FireWebhook(h.db, client.OrganizationID, "selection.feedback", map[string]interface{}{
		"selection_id": sel.ID,
		"property_id":  fb.PropertyID,
		"reaction":     fb.Reaction,
		"comment":      fb.Comment,
	})

	c.JSON(http.StatusCreated, fb)
}

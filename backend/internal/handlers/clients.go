package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/homematch/crm/internal/config"
	"github.com/homematch/crm/internal/models"
	"github.com/homematch/crm/internal/services"
	"gorm.io/gorm"
)

type ClientsHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewClientsHandler(db *gorm.DB, cfg *config.Config) *ClientsHandler {
	return &ClientsHandler{db: db, cfg: cfg}
}

func (h *ClientsHandler) List(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)
	q := h.db.Where("organization_id = ?", orgID).Order("created_at DESC")

	if status := c.Query("status"); status != "" {
		q = q.Where("status = ?", status)
	}
	if search := c.Query("search"); search != "" {
		like := "%" + search + "%"
		q = q.Where("name ILIKE ? OR phone ILIKE ?", like, like)
	}

	var clients []models.Client
	q.Find(&clients)
	c.JSON(http.StatusOK, clients)
}

func (h *ClientsHandler) Create(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)
	var client models.Client
	if err := c.ShouldBindJSON(&client); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	client.OrganizationID = orgID
	if client.Status == "" {
		client.Status = "new"
	}
	h.db.Create(&client)
	go scanClientForMatches(h.db, h.cfg, client)
	c.JSON(http.StatusCreated, client)
}

func (h *ClientsHandler) Get(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)
	var client models.Client
	if err := h.db.Preload("Interactions").Where("id = ? AND organization_id = ?", c.Param("id"), orgID).First(&client).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, client)
}

func (h *ClientsHandler) Update(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)
	var client models.Client
	if err := h.db.Where("id = ? AND organization_id = ?", c.Param("id"), orgID).First(&client).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	if err := c.ShouldBindJSON(&client); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	client.OrganizationID = orgID
	now := time.Now()
	client.LastContactAt = &now
	h.db.Save(&client)
	c.JSON(http.StatusOK, client)
}

func (h *ClientsHandler) Delete(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)
	var client models.Client
	if err := h.db.Where("id = ? AND organization_id = ?", c.Param("id"), orgID).First(&client).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	var selIDs []uint
	h.db.Model(&models.Selection{}).Where("client_id = ?", client.ID).Pluck("id", &selIDs)
	if len(selIDs) > 0 {
		h.db.Where("selection_id IN ?", selIDs).Delete(&models.SelectionFeedback{})
		h.db.Where("id IN ?", selIDs).Delete(&models.Selection{})
	}
	h.db.Where("client_id = ?", client.ID).Delete(&models.Interaction{})
	h.db.Where("client_id = ? AND organization_id = ?", client.ID, orgID).Delete(&models.Deal{})
	h.db.Where("client_id = ?", client.ID).Delete(&models.Notification{})

	if err := h.db.Delete(&client).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot delete client: " + err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *ClientsHandler) Match(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)

	var client models.Client
	if err := h.db.Where("id = ? AND organization_id = ?", c.Param("id"), orgID).First(&client).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	var properties []models.Property
	h.db.Where("organization_id = ? AND status = 'free'", orgID).Find(&properties)

	type matchItem struct {
		Property models.Property      `json:"property"`
		Match    services.MatchResult `json:"match"`
	}

	results := make([]matchItem, 0, len(properties))
	for _, p := range properties {
		nearby := fetchNearby(h.cfg, p.Lat, p.Lng, 800)
		match := services.Calculate(client, p, nearby)
		results = append(results, matchItem{Property: p, Match: match})
	}

	c.JSON(http.StatusOK, results)
}

func (h *ClientsHandler) AddInteraction(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)

	var client models.Client
	if err := h.db.Where("id = ? AND organization_id = ?", c.Param("id"), orgID).First(&client).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	var interaction models.Interaction
	if err := c.ShouldBindJSON(&interaction); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	interaction.ClientID = client.ID
	h.db.Create(&interaction)

	now := time.Now()
	h.db.Model(&client).Update("last_contact_at", now)

	c.JSON(http.StatusCreated, interaction)
}

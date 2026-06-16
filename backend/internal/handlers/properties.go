package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/homematch/crm/internal/config"
	"github.com/homematch/crm/internal/models"
	"github.com/homematch/crm/internal/services"
	"gorm.io/gorm"
)

type PropertiesHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewPropertiesHandler(db *gorm.DB, cfg *config.Config) *PropertiesHandler {
	return &PropertiesHandler{db: db, cfg: cfg}
}

func (h *PropertiesHandler) List(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)
	q := h.db.Where("organization_id = ?", orgID).Order("created_at DESC")

	if status := c.Query("status"); status != "" {
		q = q.Where("status = ?", status)
	}
	if rooms := c.Query("rooms"); rooms != "" {
		q = q.Where("rooms = ?", rooms)
	}
	if pType := c.Query("type"); pType != "" {
		q = q.Where("type = ?", pType)
	}
	if priceMin := c.Query("price_min"); priceMin != "" {
		q = q.Where("price >= ?", priceMin)
	}
	if priceMax := c.Query("price_max"); priceMax != "" {
		q = q.Where("price <= ?", priceMax)
	}

	var props []models.Property
	q.Find(&props)
	c.JSON(http.StatusOK, props)
}

func (h *PropertiesHandler) Create(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)
	var prop models.Property
	if err := c.ShouldBindJSON(&prop); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	prop.OrganizationID = orgID
	if prop.Area > 0 && prop.Price > 0 {
		prop.PricePerM2 = prop.Price / prop.Area
	}
	h.db.Create(&prop)
	c.JSON(http.StatusCreated, prop)
}

func (h *PropertiesHandler) Get(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)
	var prop models.Property
	if err := h.db.Where("id = ? AND organization_id = ?", c.Param("id"), orgID).First(&prop).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, prop)
}

func (h *PropertiesHandler) Update(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)
	var prop models.Property
	if err := h.db.Where("id = ? AND organization_id = ?", c.Param("id"), orgID).First(&prop).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	if err := c.ShouldBindJSON(&prop); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	prop.OrganizationID = orgID
	if prop.Area > 0 && prop.Price > 0 {
		prop.PricePerM2 = prop.Price / prop.Area
	}
	h.db.Save(&prop)
	c.JSON(http.StatusOK, prop)
}

func (h *PropertiesHandler) Delete(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)
	result := h.db.Where("id = ? AND organization_id = ?", c.Param("id"), orgID).Delete(&models.Property{})
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *PropertiesHandler) Nearby(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)
	var prop models.Property
	if err := h.db.Where("id = ? AND organization_id = ?", c.Param("id"), orgID).First(&prop).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	places := fetchNearby(h.cfg, prop.Lat, prop.Lng, 800)
	c.JSON(http.StatusOK, places)
}

func (h *PropertiesHandler) MatchForClient(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)

	var prop models.Property
	if err := h.db.Where("id = ? AND organization_id = ?", c.Param("id"), orgID).First(&prop).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "property not found"})
		return
	}

	clientID, err := strconv.Atoi(c.Param("client_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid client_id"})
		return
	}

	var client models.Client
	if err := h.db.Where("id = ? AND organization_id = ?", clientID, orgID).First(&client).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "client not found"})
		return
	}

	nearby := fetchNearby(h.cfg, prop.Lat, prop.Lng, 800)
	result := services.Calculate(client, prop, nearby)
	c.JSON(http.StatusOK, result)
}

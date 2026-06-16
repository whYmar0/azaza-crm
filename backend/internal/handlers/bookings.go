package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/homematch/crm/internal/config"
	"github.com/homematch/crm/internal/models"
	"gorm.io/gorm"
)

type BookingsHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewBookingsHandler(db *gorm.DB, cfg *config.Config) *BookingsHandler {
	return &BookingsHandler{db: db, cfg: cfg}
}

func (h *BookingsHandler) Create(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)

	var body struct {
		PropertyID uint    `json:"property_id" binding:"required"`
		ClientID   uint    `json:"client_id" binding:"required"`
		Hours      float64 `json:"hours"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var prop models.Property
	if err := h.db.Where("id = ? AND organization_id = ?", body.PropertyID, orgID).First(&prop).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "property not found"})
		return
	}
	if prop.Status != "free" {
		c.JSON(http.StatusConflict, gin.H{"error": "property is not free"})
		return
	}

	hours := body.Hours
	if hours <= 0 {
		hours = 24
	}

	booking := models.Booking{
		PropertyID: body.PropertyID,
		ClientID:   body.ClientID,
		ExpiresAt:  time.Now().Add(time.Duration(hours * float64(time.Hour))),
		Status:     "active",
	}
	h.db.Create(&booking)
	h.db.Model(&prop).Update("status", "booked")

	c.JSON(http.StatusCreated, booking)
}

func (h *BookingsHandler) Delete(c *gin.Context) {
	var booking models.Booking
	if err := h.db.First(&booking, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	h.db.Model(&booking).Update("status", "expired")
	h.db.Model(&models.Property{}).Where("id = ?", booking.PropertyID).Update("status", "free")
	c.Status(http.StatusNoContent)
}

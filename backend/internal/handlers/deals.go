package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/homematch/crm/internal/config"
	"github.com/homematch/crm/internal/models"
	"github.com/homematch/crm/internal/services"
	"gorm.io/gorm"
)

type DealsHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewDealsHandler(db *gorm.DB, cfg *config.Config) *DealsHandler {
	return &DealsHandler{db: db, cfg: cfg}
}

func (h *DealsHandler) List(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)
	var deals []models.Deal
	h.db.Where("organization_id = ?", orgID).
		Preload("Client").
		Preload("Property").
		Order("created_at DESC").
		Find(&deals)
	c.JSON(http.StatusOK, deals)
}

func (h *DealsHandler) Create(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)
	userID := c.MustGet("user_id").(uint)

	var deal models.Deal
	if err := c.ShouldBindJSON(&deal); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	deal.OrganizationID = orgID
	deal.ManagerID = userID
	if deal.Stage == "" {
		deal.Stage = "new"
	}
	h.db.Create(&deal)
	h.db.Preload("Client").Preload("Property").First(&deal, deal.ID)
	c.JSON(http.StatusCreated, deal)
}

func (h *DealsHandler) Get(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)
	var deal models.Deal
	if err := h.db.Preload("Client").Preload("Property").
		Where("id = ? AND organization_id = ?", c.Param("id"), orgID).First(&deal).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, deal)
}

func (h *DealsHandler) UpdateStage(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)

	var deal models.Deal
	if err := h.db.Where("id = ? AND organization_id = ?", c.Param("id"), orgID).First(&deal).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	var body struct {
		Stage string `json:"stage" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	oldStage := deal.Stage
	deal.Stage = body.Stage
	h.db.Save(&deal)
	h.db.Preload("Client").Preload("Property").First(&deal, deal.ID)

	services.FireWebhook(h.db, orgID, "deal.stage_changed", map[string]interface{}{
		"deal_id":   deal.ID,
		"old_stage": oldStage,
		"new_stage": deal.Stage,
		"client":    deal.Client.Name,
		"property":  deal.Property.Title,
	})

	c.JSON(http.StatusOK, deal)
}

func (h *DealsHandler) Delete(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)
	result := h.db.Where("id = ? AND organization_id = ?", c.Param("id"), orgID).Delete(&models.Deal{})
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.Status(http.StatusNoContent)
}

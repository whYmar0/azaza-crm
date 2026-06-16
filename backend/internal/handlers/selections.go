package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/homematch/crm/internal/config"
	"github.com/homematch/crm/internal/models"
	"gorm.io/gorm"
)

type SelectionsHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewSelectionsHandler(db *gorm.DB, cfg *config.Config) *SelectionsHandler {
	return &SelectionsHandler{db: db, cfg: cfg}
}

func (h *SelectionsHandler) Create(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)

	var sel models.Selection
	if err := c.ShouldBindJSON(&sel); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var client models.Client
	if err := h.db.Where("id = ? AND organization_id = ?", sel.ClientID, orgID).First(&client).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "client not found"})
		return
	}

	sel.PublicToken = uuid.New().String()
	h.db.Create(&sel)
	c.JSON(http.StatusCreated, sel)
}

func (h *SelectionsHandler) List(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)

	var clients []models.Client
	h.db.Select("id").Where("organization_id = ?", orgID).Find(&clients)

	if len(clients) == 0 {
		c.JSON(http.StatusOK, []models.Selection{})
		return
	}

	ids := make([]uint, 0, len(clients))
	for _, cl := range clients {
		ids = append(ids, cl.ID)
	}

	var selections []models.Selection
	h.db.Where("client_id IN ?", ids).Preload("Feedbacks").Order("created_at DESC").Find(&selections)
	c.JSON(http.StatusOK, selections)
}

func (h *SelectionsHandler) Get(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)

	var sel models.Selection
	if err := h.db.Preload("Feedbacks").First(&sel, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	var client models.Client
	if err := h.db.Where("id = ? AND organization_id = ?", sel.ClientID, orgID).First(&client).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	c.JSON(http.StatusOK, sel)
}

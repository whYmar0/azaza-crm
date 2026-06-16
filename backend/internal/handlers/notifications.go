package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/homematch/crm/internal/config"
	"github.com/homematch/crm/internal/models"
	"gorm.io/gorm"
)

type NotificationsHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewNotificationsHandler(db *gorm.DB, cfg *config.Config) *NotificationsHandler {
	return &NotificationsHandler{db: db, cfg: cfg}
}

func (h *NotificationsHandler) List(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)
	var notifications []models.Notification
	h.db.Preload("Client").Preload("Property").
		Where("organization_id = ?", orgID).
		Order("created_at DESC").Limit(50).Find(&notifications)
	c.JSON(http.StatusOK, notifications)
}

func (h *NotificationsHandler) MarkRead(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)
	h.db.Model(&models.Notification{}).
		Where("id = ? AND organization_id = ?", c.Param("id"), orgID).
		Update("read", true)
	c.Status(http.StatusNoContent)
}

func (h *NotificationsHandler) MarkAllRead(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)
	h.db.Model(&models.Notification{}).
		Where("organization_id = ? AND read = ?", orgID, false).
		Update("read", true)
	c.Status(http.StatusNoContent)
}

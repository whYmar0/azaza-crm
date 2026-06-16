package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/homematch/crm/internal/config"
	"github.com/homematch/crm/internal/models"
	"gorm.io/gorm"
)

type InstagramHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewInstagramHandler(db *gorm.DB, cfg *config.Config) *InstagramHandler {
	return &InstagramHandler{db: db, cfg: cfg}
}

func (h *InstagramHandler) GetIntegration(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)
	var ig models.InstagramIntegration
	if err := h.db.Where("organization_id = ?", orgID).First(&ig).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"connected": false})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"connected": true,
		"username":  ig.Username,
		"user_id":   ig.UserID,
	})
}

func (h *InstagramHandler) Connect(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)

	var body struct {
		AccessToken string `json:"access_token"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.AccessToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "access_token required"})
		return
	}

	url := fmt.Sprintf("https://graph.instagram.com/me?fields=id,username&access_token=%s", body.AccessToken)
	resp, err := http.Get(url)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "cannot reach Instagram API"})
		return
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var igUser struct {
		ID       string `json:"id"`
		Username string `json:"username"`
		Error    *struct {
			Message string `json:"message"`
		} `json:"error"`
	}
	json.Unmarshal(respBody, &igUser)

	if igUser.Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": igUser.Error.Message})
		return
	}
	if igUser.ID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid token"})
		return
	}

	ig := models.InstagramIntegration{
		OrganizationID: orgID,
		AccessToken:    body.AccessToken,
		UserID:         igUser.ID,
		Username:       igUser.Username,
		UpdatedAt:      time.Now(),
	}
	h.db.Where("organization_id = ?", orgID).FirstOrCreate(&ig)
	h.db.Model(&ig).Updates(map[string]interface{}{
		"access_token": body.AccessToken,
		"user_id":      igUser.ID,
		"username":     igUser.Username,
		"updated_at":   time.Now(),
	})

	c.JSON(http.StatusOK, gin.H{"connected": true, "username": igUser.Username, "user_id": igUser.ID})
}

func (h *InstagramHandler) Disconnect(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)
	h.db.Where("organization_id = ?", orgID).Delete(&models.InstagramIntegration{})
	c.JSON(http.StatusOK, gin.H{"connected": false})
}

func (h *InstagramHandler) Stats(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)

	var ig models.InstagramIntegration
	if err := h.db.Where("organization_id = ?", orgID).First(&ig).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Instagram not connected"})
		return
	}

	url := fmt.Sprintf(
		"https://graph.instagram.com/%s?fields=id,username,media_count,followers_count,follows_count,biography,profile_picture_url&access_token=%s",
		ig.UserID, ig.AccessToken,
	)
	resp, err := http.Get(url)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "cannot reach Instagram API"})
		return
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)

	var profile map[string]interface{}
	json.Unmarshal(body, &profile)

	mediaURL := fmt.Sprintf(
		"https://graph.instagram.com/%s/media?fields=id,caption,media_type,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=9&access_token=%s",
		ig.UserID, ig.AccessToken,
	)
	mediaResp, err := http.Get(mediaURL)
	var media map[string]interface{}
	if err == nil {
		defer mediaResp.Body.Close()
		mediaBody, _ := io.ReadAll(mediaResp.Body)
		json.Unmarshal(mediaBody, &media)
	}

	c.JSON(http.StatusOK, gin.H{
		"profile":  profile,
		"media":    media,
		"username": ig.Username,
	})
}

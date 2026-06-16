package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

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
	go scanPropertyForMatches(h.db, h.cfg, prop)
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

	var prop models.Property
	if err := h.db.Where("id = ? AND organization_id = ?", c.Param("id"), orgID).First(&prop).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	h.db.Where("property_id = ? AND organization_id = ?", prop.ID, orgID).Delete(&models.Deal{})
	h.db.Where("property_id = ?", prop.ID).Delete(&models.Booking{})
	h.db.Where("property_id = ?", prop.ID).Delete(&models.Notification{})

	if err := h.db.Delete(&prop).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot delete property: " + err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *PropertiesHandler) UploadPhotos(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)
	var prop models.Property
	if err := h.db.Where("id = ? AND organization_id = ?", c.Param("id"), orgID).First(&prop).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	form, err := c.MultipartForm()
	if err != nil || len(form.File["photos"]) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no files"})
		return
	}

	if err := os.MkdirAll(h.cfg.UploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot create upload dir"})
		return
	}

	for _, header := range form.File["photos"] {
		file, err := header.Open()
		if err != nil {
			continue
		}
		ext := strings.ToLower(filepath.Ext(header.Filename))
		if ext == "" {
			ext = ".jpg"
		}
		filename := fmt.Sprintf("prop_%d_%d%s", prop.ID, time.Now().UnixNano(), ext)
		dst, err := os.Create(filepath.Join(h.cfg.UploadDir, filename))
		if err != nil {
			file.Close()
			continue
		}
		io.Copy(dst, file)
		file.Close()
		dst.Close()
		prop.Photos = append(prop.Photos, "/uploads/"+filename)
	}

	h.db.Save(&prop)
	c.JSON(http.StatusOK, gin.H{"photos": prop.Photos})
}

func (h *PropertiesHandler) DeletePhoto(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)
	var prop models.Property
	if err := h.db.Where("id = ? AND organization_id = ?", c.Param("id"), orgID).First(&prop).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	var body struct {
		URL string `json:"url"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.URL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "url required"})
		return
	}

	updated := make([]string, 0, len(prop.Photos))
	for _, p := range prop.Photos {
		if p != body.URL {
			updated = append(updated, p)
		}
	}
	prop.Photos = updated
	h.db.Save(&prop)

	if strings.HasPrefix(body.URL, "/uploads/") {
		os.Remove(filepath.Join(h.cfg.UploadDir, strings.TrimPrefix(body.URL, "/uploads/")))
	}

	c.JSON(http.StatusOK, gin.H{"photos": prop.Photos})
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

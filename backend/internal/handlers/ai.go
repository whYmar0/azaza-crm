package handlers

import (
	"bytes"
	"encoding/json"
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
	"gorm.io/gorm"
)

type AIHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewAIHandler(db *gorm.DB, cfg *config.Config) *AIHandler {
	return &AIHandler{db: db, cfg: cfg}
}

func (h *AIHandler) UploadCover(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)

	var prop models.Property
	if err := h.db.Where("id = ? AND organization_id = ?", c.Param("id"), orgID).First(&prop).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	file, header, err := c.Request.FormFile("cover")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no file"})
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext == "" {
		ext = ".jpg"
	}
	filename := fmt.Sprintf("prop_%d_%d%s", prop.ID, time.Now().UnixMilli(), ext)

	if err := os.MkdirAll(h.cfg.UploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot create upload dir"})
		return
	}

	dst, err := os.Create(filepath.Join(h.cfg.UploadDir, filename))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot save file"})
		return
	}
	defer dst.Close()
	io.Copy(dst, file)

	coverURL := "/uploads/" + filename
	h.db.Model(&prop).Update("cover_url", coverURL)

	c.JSON(http.StatusOK, gin.H{"cover_url": coverURL})
}

func (h *AIHandler) GenerateDescription(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)

	var prop models.Property
	if err := h.db.Where("id = ? AND organization_id = ?", c.Param("id"), orgID).First(&prop).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	if h.cfg.GroqKey == "" {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Groq API key not configured"})
		return
	}

	propType := "продажа"
	if prop.Type == "rent" {
		propType = "аренда"
	}
	prompt := fmt.Sprintf(
		"Ты риелтор в Грозном (Чечня). Напиши продающее описание объекта недвижимости для CRM. "+
			"Объект: %s. Адрес: %s. Площадь: %.0f м². Комнат: %d. Цена: %.0f руб. Тип: %s. "+
			"Ответ строго в JSON без markdown: {\"description\": \"...\", \"tags\": [\"тег1\",\"тег2\"]}. "+
			"Описание — 2-3 предложения на русском, теги — 3-5 коротких слов/фраз.",
		prop.Title, prop.Address, prop.Area, prop.Rooms, prop.Price, propType,
	)

	type dsMsg struct {
		Role    string `json:"role"`
		Content string `json:"content"`
	}
	reqBody, _ := json.Marshal(map[string]interface{}{
		"model":       "llama-3.3-70b-versatile",
		"messages":    []dsMsg{{Role: "user", Content: prompt}},
		"temperature": 0.7,
	})

	req, _ := http.NewRequest("POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+h.cfg.GroqKey)

	httpClient := &http.Client{Timeout: 30 * time.Second}
	resp, err := httpClient.Do(req)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "Groq unavailable"})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var dsErr struct {
		Error *struct {
			Message string `json:"message"`
			Type    string `json:"type"`
		} `json:"error"`
	}
	json.Unmarshal(body, &dsErr)
	if dsErr.Error != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "Groq: " + dsErr.Error.Message})
		return
	}

	var dsResp struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(body, &dsResp); err != nil || len(dsResp.Choices) == 0 {
		c.JSON(http.StatusBadGateway, gin.H{"error": "invalid Groq response: " + string(body[:min(200, len(body))])})
		return
	}

	content := stripMarkdownJSON(dsResp.Choices[0].Message.Content)
	var result struct {
		Description string   `json:"description"`
		Tags        []string `json:"tags"`
	}
	if err := json.Unmarshal([]byte(content), &result); err != nil {
		result.Description = content
		result.Tags = []string{}
	}

	prop.Description = result.Description
	prop.Tags = result.Tags
	h.db.Save(&prop)

	c.JSON(http.StatusOK, result)
}

func (h *AIHandler) UpdateDescription(c *gin.Context) {
	orgID := c.MustGet("organization_id").(uint)
	propID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var prop models.Property
	if err := h.db.Where("id = ? AND organization_id = ?", propID, orgID).First(&prop).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	var body struct {
		Description string   `json:"description"`
		Tags        []string `json:"tags"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	prop.Description = body.Description
	prop.Tags = body.Tags
	h.db.Save(&prop)
	c.JSON(http.StatusOK, body)
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func stripMarkdownJSON(s string) string {
	s = strings.TrimSpace(s)
	if strings.HasPrefix(s, "```json") {
		s = strings.TrimPrefix(s, "```json")
	} else if strings.HasPrefix(s, "```") {
		s = strings.TrimPrefix(s, "```")
	}
	s = strings.TrimSuffix(s, "```")
	return strings.TrimSpace(s)
}

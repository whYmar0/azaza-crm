package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/homematch/crm/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func APIKey(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		key := c.GetHeader("X-API-Key")
		if key == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing API key"})
			return
		}

		var keys []models.ApiKey
		db.Find(&keys)

		var matched *models.ApiKey
		for i := range keys {
			if err := bcrypt.CompareHashAndPassword([]byte(keys[i].KeyHash), []byte(key)); err == nil {
				matched = &keys[i]
				break
			}
		}

		if matched == nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid API key"})
			return
		}

		c.Set("organization_id", matched.OrganizationID)
		c.Set("api_key_id", matched.ID)
		c.Next()
	}
}

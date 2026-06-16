package models

import "time"

type Organization struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"not null" json:"name"`
	CreatedAt time.Time `json:"created_at"`
	Users     []User    `json:"-"`
}

type User struct {
	ID             uint         `gorm:"primaryKey" json:"id"`
	OrganizationID uint         `gorm:"not null;index" json:"organization_id"`
	Name           string       `gorm:"not null" json:"name"`
	Email          string       `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash   string       `gorm:"not null" json:"-"`
	Role           string       `gorm:"not null;default:'agent'" json:"role"`
	CreatedAt      time.Time    `json:"created_at"`
	Organization   Organization `gorm:"foreignKey:OrganizationID" json:"-"`
}

type Client struct {
	ID             uint          `gorm:"primaryKey" json:"id"`
	OrganizationID uint          `gorm:"not null;index" json:"organization_id"`
	Name           string        `gorm:"not null" json:"name"`
	Phone          string        `json:"phone"`
	Email          string        `json:"email"`
	BudgetMin      float64       `json:"budget_min"`
	BudgetMax      float64       `json:"budget_max"`
	RoomsWanted    int           `json:"rooms_wanted"`
	AreaWanted     float64       `json:"area_wanted"`
	PrefLat        float64       `json:"pref_lat"`
	PrefLng        float64       `json:"pref_lng"`
	WishesTags     []string      `gorm:"serializer:json" json:"wishes_tags"`
	PurchasePower  string        `json:"purchase_power"`
	Status         string        `gorm:"default:'new'" json:"status"`
	LastContactAt  *time.Time    `json:"last_contact_at"`
	CreatedAt      time.Time     `json:"created_at"`
	Interactions   []Interaction `gorm:"foreignKey:ClientID" json:"interactions,omitempty"`
}

type Property struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	OrganizationID uint      `gorm:"not null;index" json:"organization_id"`
	Title          string    `gorm:"not null" json:"title"`
	Type           string    `gorm:"not null" json:"type"`
	Address        string    `json:"address"`
	Lat            float64   `json:"lat"`
	Lng            float64   `json:"lng"`
	Area           float64   `json:"area"`
	Rooms          int       `json:"rooms"`
	Price          float64   `json:"price"`
	PricePerM2     float64   `json:"price_per_m2"`
	ReadyDate      string    `json:"ready_date"`
	Installment    bool      `json:"installment"`
	Promo          string    `json:"promo"`
	Status         string    `gorm:"default:'free'" json:"status"`
	CoverURL       string    `json:"cover_url"`
	Photos         []string  `gorm:"serializer:json" json:"photos"`
	Description    string    `json:"description"`
	Tags           []string  `gorm:"serializer:json" json:"tags"`
	CreatedAt      time.Time `json:"created_at"`
}

type Deal struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	OrganizationID uint      `gorm:"not null;index" json:"organization_id"`
	ClientID       uint      `gorm:"not null;index" json:"client_id"`
	PropertyID     uint      `gorm:"not null;index" json:"property_id"`
	ManagerID      uint      `gorm:"not null;index" json:"manager_id"`
	Type           string    `json:"type"`
	Stage          string    `gorm:"default:'new';index" json:"stage"`
	Amount         float64   `json:"amount"`
	Notes          string    `json:"notes"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
	Client         Client    `gorm:"foreignKey:ClientID" json:"client,omitempty"`
	Property       Property  `gorm:"foreignKey:PropertyID" json:"property,omitempty"`
}

type Booking struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	PropertyID uint      `gorm:"not null;uniqueIndex" json:"property_id"`
	ClientID   uint      `gorm:"not null" json:"client_id"`
	ExpiresAt  time.Time `gorm:"index" json:"expires_at"`
	Status     string    `gorm:"default:'active'" json:"status"`
	CreatedAt  time.Time `json:"created_at"`
}

type Interaction struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	ClientID  uint      `gorm:"not null;index" json:"client_id"`
	Channel   string    `json:"channel"`
	Direction string    `json:"direction"`
	Text      string    `json:"text"`
	CreatedAt time.Time `json:"created_at"`
}

type Selection struct {
	ID          uint                `gorm:"primaryKey" json:"id"`
	ClientID    uint                `gorm:"not null;index" json:"client_id"`
	PropertyIDs []uint              `gorm:"serializer:json" json:"property_ids"`
	PublicToken string              `gorm:"uniqueIndex;not null" json:"public_token"`
	CreatedAt   time.Time           `json:"created_at"`
	Feedbacks   []SelectionFeedback `gorm:"foreignKey:SelectionID" json:"feedbacks,omitempty"`
}

type SelectionFeedback struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	SelectionID uint      `gorm:"not null;index" json:"selection_id"`
	PropertyID  uint      `gorm:"not null" json:"property_id"`
	Reaction    string    `json:"reaction"`
	Comment     string    `json:"comment"`
	CreatedAt   time.Time `json:"created_at"`
}

type InstagramIntegration struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	OrganizationID uint      `gorm:"not null;uniqueIndex" json:"organization_id"`
	AccessToken    string    `json:"access_token"`
	UserID         string    `json:"user_id"`
	Username       string    `json:"username"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type WhatsAppIntegration struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	OrganizationID uint      `gorm:"not null;uniqueIndex" json:"organization_id"`
	AccessToken    string    `json:"access_token"`
	PhoneNumberID  string    `json:"phone_number_id"`
	DisplayPhone   string    `json:"display_phone"`
	VerifiedName   string    `json:"verified_name"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type ApiKey struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	OrganizationID uint      `gorm:"not null;index" json:"organization_id"`
	Name           string    `json:"name"`
	KeyHash        string    `gorm:"uniqueIndex;not null" json:"-"`
	KeyPrefix      string    `json:"key_prefix"`
	Scopes         []string  `gorm:"serializer:json" json:"scopes"`
	CreatedAt      time.Time `json:"created_at"`
}

type WebhookSubscription struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	OrganizationID uint      `gorm:"not null;index" json:"organization_id"`
	URL            string    `gorm:"not null" json:"url"`
	Events         []string  `gorm:"serializer:json" json:"events"`
	Active         bool      `gorm:"default:true" json:"active"`
	CreatedAt      time.Time `json:"created_at"`
}

type Notification struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	OrganizationID uint      `gorm:"not null;index" json:"organization_id"`
	ClientID       uint      `json:"client_id"`
	PropertyID     uint      `json:"property_id"`
	Score          int       `json:"score"`
	Message        string    `json:"message"`
	Read           bool      `gorm:"default:false;index" json:"read"`
	CreatedAt      time.Time `json:"created_at"`
	Client         Client    `gorm:"foreignKey:ClientID" json:"client,omitempty"`
	Property       Property  `gorm:"foreignKey:PropertyID" json:"property,omitempty"`
}

type AutomationRule struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	OrganizationID uint      `gorm:"not null;index" json:"organization_id"`
	Trigger        string    `json:"trigger"`
	ParamDays      int       `json:"param_days"`
	Action         string    `json:"action"`
	Active         bool      `gorm:"default:true" json:"active"`
	CreatedAt      time.Time `json:"created_at"`
}

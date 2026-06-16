package database

import (
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/homematch/crm/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func Seed(db *gorm.DB, force bool) {
	var count int64
	db.Model(&models.Organization{}).Count(&count)
	if count > 0 && !force {
		return
	}

	log.Println("seeding database...")

	org := models.Organization{Name: "АН «Грозный-Недвижимость»"}
	db.Create(&org)

	adminHash, _ := bcrypt.GenerateFromPassword([]byte("Admin1234!"), bcrypt.DefaultCost)
	agentHash, _ := bcrypt.GenerateFromPassword([]byte("Agent1234!"), bcrypt.DefaultCost)
	headHash, _ := bcrypt.GenerateFromPassword([]byte("Head1234!"), bcrypt.DefaultCost)

	users := []models.User{
		{OrganizationID: org.ID, Name: "Администратор", Email: "admin@homematch.dev", PasswordHash: string(adminHash), Role: "admin"},
		{OrganizationID: org.ID, Name: "Магомед Агент", Email: "agent1@homematch.dev", PasswordHash: string(agentHash), Role: "agent"},
		{OrganizationID: org.ID, Name: "Рустам Руководитель", Email: "head@homematch.dev", PasswordHash: string(headHash), Role: "head"},
	}
	db.Create(&users)

	rawKey := "hm_" + uuid.New().String()[:8] + uuid.New().String()[:8]
	keyHash, _ := bcrypt.GenerateFromPassword([]byte(rawKey), bcrypt.DefaultCost)
	apiKey := models.ApiKey{
		OrganizationID: org.ID,
		Name:           "Публичный API",
		KeyHash:        string(keyHash),
		KeyPrefix:      rawKey[:11],
		Scopes:         []string{"public"},
	}
	db.Create(&apiKey)
	log.Printf("=== PUBLIC API KEY: %s ===", rawKey)

	properties := []models.Property{
		{
			OrganizationID: org.ID,
			Title:          "3-комн. кв. на пр. Путина",
			Type:           "sale",
			Address:        "пр. Путина, 1, Грозный",
			Lat:            43.3177,
			Lng:            45.6988,
			Area:           82,
			Rooms:          3,
			Price:          6500000,
			PricePerM2:     79268,
			ReadyDate:      "сдан",
			Installment:    true,
			Promo:          "Скидка 5% при 100% оплате",
			Status:         "free",
		},
		{
			OrganizationID: org.ID,
			Title:          "2-комн. кв. ул. Маяковского",
			Type:           "sale",
			Address:        "ул. Маяковского, 15, Грозный",
			Lat:            43.3156,
			Lng:            45.7021,
			Area:           58,
			Rooms:          2,
			Price:          4200000,
			PricePerM2:     72413,
			ReadyDate:      "Q2 2025",
			Installment:    true,
			Promo:          "",
			Status:         "free",
		},
		{
			OrganizationID: org.ID,
			Title:          "1-комн. студия пр. Кадырова",
			Type:           "sale",
			Address:        "пр. Кадырова, 32, Грозный",
			Lat:            43.3201,
			Lng:            45.6912,
			Area:           38,
			Rooms:          1,
			Price:          2800000,
			PricePerM2:     73684,
			ReadyDate:      "сдан",
			Installment:    false,
			Promo:          "Первый взнос от 10%",
			Status:         "booked",
		},
		{
			OrganizationID: org.ID,
			Title:          "4-комн. кв. ул. Первомайская",
			Type:           "sale",
			Address:        "ул. Первомайская, 7, Грозный",
			Lat:            43.3123,
			Lng:            45.6854,
			Area:           110,
			Rooms:          4,
			Price:          9800000,
			PricePerM2:     89090,
			ReadyDate:      "Q4 2025",
			Installment:    true,
			Promo:          "",
			Status:         "free",
		},
		{
			OrganizationID: org.ID,
			Title:          "2-комн. кв. мкр. Ипподромный",
			Type:           "rent",
			Address:        "мкр. Ипподромный, 12, Грозный",
			Lat:            43.3089,
			Lng:            45.7134,
			Area:           55,
			Rooms:          2,
			Price:          25000,
			PricePerM2:     454,
			ReadyDate:      "сдан",
			Installment:    false,
			Promo:          "Первый месяц бесплатно",
			Status:         "free",
		},
		{
			OrganizationID: org.ID,
			Title:          "3-комн. кв. ул. Ш. А. Митаева",
			Type:           "sale",
			Address:        "ул. Шейха Али Митаева, 5, Грозный",
			Lat:            43.3245,
			Lng:            45.7056,
			Area:           76,
			Rooms:          3,
			Price:          5900000,
			PricePerM2:     77631,
			ReadyDate:      "сдан",
			Installment:    true,
			Promo:          "",
			Status:         "sold",
		},
	}
	db.Create(&properties)

	t25dAgo := time.Now().Add(-25 * 24 * time.Hour)
	t3dAgo := time.Now().Add(-3 * 24 * time.Hour)

	clients := []models.Client{
		{
			OrganizationID: org.ID,
			Name:           "Ахмад Исаев",
			Phone:          "+7 928 100-01-01",
			Email:          "ahmadisaev@mail.ru",
			BudgetMin:      5000000,
			BudgetMax:      7000000,
			RoomsWanted:    3,
			AreaWanted:     80,
			PrefLat:        43.3177,
			PrefLng:        45.6988,
			WishesTags:     []string{"школа", "парк"},
			PurchasePower:  "Высокая",
			Status:         "hot",
			LastContactAt:  &t3dAgo,
		},
		{
			OrganizationID: org.ID,
			Name:           "Зарина Дудаева",
			Phone:          "+7 928 100-02-02",
			Email:          "zarina.dudaeva@gmail.com",
			BudgetMin:      3500000,
			BudgetMax:      4500000,
			RoomsWanted:    2,
			AreaWanted:     55,
			PrefLat:        43.3156,
			PrefLng:        45.7021,
			WishesTags:     []string{"магазин", "транспорт"},
			PurchasePower:  "Средняя",
			Status:         "warm",
			LastContactAt:  &t3dAgo,
		},
		{
			OrganizationID: org.ID,
			Name:           "Руслан Мусаев",
			Phone:          "+7 928 100-03-03",
			Email:          "",
			BudgetMin:      2000000,
			BudgetMax:      3000000,
			RoomsWanted:    1,
			AreaWanted:     35,
			PrefLat:        43.3201,
			PrefLng:        45.6912,
			WishesTags:     []string{"транспорт"},
			PurchasePower:  "Низкая",
			Status:         "new",
			LastContactAt:  &t25dAgo,
		},
		{
			OrganizationID: org.ID,
			Name:           "Хеда Яндарова",
			Phone:          "+7 928 100-04-04",
			Email:          "kheda@yandex.ru",
			BudgetMin:      8000000,
			BudgetMax:      11000000,
			RoomsWanted:    4,
			AreaWanted:     110,
			PrefLat:        43.3123,
			PrefLng:        45.6854,
			WishesTags:     []string{"школа", "детский сад", "парк"},
			PurchasePower:  "Высокая",
			Status:         "hot",
			LastContactAt:  &t3dAgo,
		},
		{
			OrganizationID: org.ID,
			Name:           "Адам Гайтаев",
			Phone:          "+7 928 100-05-05",
			Email:          "",
			BudgetMin:      20000,
			BudgetMax:      30000,
			RoomsWanted:    2,
			AreaWanted:     50,
			PrefLat:        43.3089,
			PrefLng:        45.7134,
			WishesTags:     []string{"магазин"},
			PurchasePower:  "Средняя",
			Status:         "warm",
			LastContactAt:  &t3dAgo,
		},
		{
			OrganizationID: org.ID,
			Name:           "Малика Тимирбулатова",
			Phone:          "+7 928 100-06-06",
			Email:          "malika@mail.ru",
			BudgetMin:      4500000,
			BudgetMax:      6500000,
			RoomsWanted:    3,
			AreaWanted:     75,
			PrefLat:        43.3245,
			PrefLng:        45.7056,
			WishesTags:     []string{"детский сад", "магазин"},
			PurchasePower:  "Средняя",
			Status:         "new",
			LastContactAt:  nil,
		},
		{
			OrganizationID: org.ID,
			Name:           "Ибрагим Сулейманов",
			Phone:          "+7 928 100-07-07",
			Email:          "ibr@gmail.com",
			BudgetMin:      6000000,
			BudgetMax:      8000000,
			RoomsWanted:    3,
			AreaWanted:     85,
			PrefLat:        43.3177,
			PrefLng:        45.6988,
			WishesTags:     []string{"школа", "транспорт"},
			PurchasePower:  "Высокая",
			Status:         "cold",
			LastContactAt:  &t25dAgo,
		},
		{
			OrganizationID: org.ID,
			Name:           "Петр Кузнецов",
			Phone:          "+7 928 100-08-08",
			Email:          "petr.kuz@mail.ru",
			BudgetMin:      3000000,
			BudgetMax:      5000000,
			RoomsWanted:    2,
			AreaWanted:     60,
			PrefLat:        43.3156,
			PrefLng:        45.7021,
			WishesTags:     []string{"парк", "транспорт"},
			PurchasePower:  "Средняя",
			Status:         "warm",
			LastContactAt:  &t3dAgo,
		},
	}
	db.Create(&clients)

	managerID := users[1].ID

	deals := []models.Deal{
		{OrganizationID: org.ID, ClientID: clients[0].ID, PropertyID: properties[0].ID, ManagerID: managerID, Type: "sale", Stage: "view", Amount: 6500000},
		{OrganizationID: org.ID, ClientID: clients[1].ID, PropertyID: properties[1].ID, ManagerID: managerID, Type: "sale", Stage: "booking", Amount: 4200000},
		{OrganizationID: org.ID, ClientID: clients[3].ID, PropertyID: properties[3].ID, ManagerID: managerID, Type: "sale", Stage: "contract", Amount: 9800000},
		{OrganizationID: org.ID, ClientID: clients[4].ID, PropertyID: properties[4].ID, ManagerID: managerID, Type: "rent", Stage: "paid", Amount: 25000},
		{OrganizationID: org.ID, ClientID: clients[2].ID, PropertyID: properties[2].ID, ManagerID: managerID, Type: "sale", Stage: "lost", Amount: 2800000},
		{OrganizationID: org.ID, ClientID: clients[5].ID, PropertyID: properties[0].ID, ManagerID: managerID, Type: "sale", Stage: "new", Amount: 6500000},
		{OrganizationID: org.ID, ClientID: clients[6].ID, PropertyID: properties[1].ID, ManagerID: managerID, Type: "sale", Stage: "view", Amount: 4200000},
		{OrganizationID: org.ID, ClientID: clients[7].ID, PropertyID: properties[3].ID, ManagerID: managerID, Type: "sale", Stage: "new", Amount: 9800000},
		{OrganizationID: org.ID, ClientID: clients[0].ID, PropertyID: properties[4].ID, ManagerID: managerID, Type: "rent", Stage: "booking", Amount: 25000},
		{OrganizationID: org.ID, ClientID: clients[3].ID, PropertyID: properties[0].ID, ManagerID: managerID, Type: "sale", Stage: "contract", Amount: 6500000},
	}
	db.Create(&deals)

	interactions := []models.Interaction{
		{ClientID: clients[0].ID, Channel: "call", Direction: "out", Text: "Позвонили, договорились на просмотр"},
		{ClientID: clients[0].ID, Channel: "visit", Direction: "in", Text: "Просмотрел квартиру на пр. Путина, понравилась"},
		{ClientID: clients[1].ID, Channel: "whatsapp", Direction: "in", Text: "Написал в WhatsApp, спрашивает об ипотеке"},
		{ClientID: clients[2].ID, Channel: "call", Direction: "out", Text: "Не берёт трубку"},
	}
	db.Create(&interactions)

	now := time.Now()
	demoExpiry := now.Add(2 * time.Minute)
	booking := models.Booking{
		PropertyID: properties[2].ID,
		ClientID:   clients[2].ID,
		ExpiresAt:  demoExpiry,
		Status:     "active",
	}
	db.Create(&booking)

	sel1 := models.Selection{
		ClientID:    clients[0].ID,
		PropertyIDs: []uint{properties[0].ID, properties[1].ID, properties[3].ID},
		PublicToken: uuid.New().String(),
	}
	sel2 := models.Selection{
		ClientID:    clients[3].ID,
		PropertyIDs: []uint{properties[3].ID, properties[5].ID},
		PublicToken: uuid.New().String(),
	}
	db.Create(&sel1)
	db.Create(&sel2)

	rules := []models.AutomationRule{
		{OrganizationID: org.ID, Trigger: "lapsed_client", ParamDays: 20, Action: "log", Active: true},
		{OrganizationID: org.ID, Trigger: "booking_expiring", ParamDays: 1, Action: "notify", Active: true},
		{OrganizationID: org.ID, Trigger: "deal_stuck", ParamDays: 14, Action: "log", Active: true},
	}
	db.Create(&rules)

	fmt.Println("=== SEED COMPLETE ===")
	fmt.Printf("Admin: admin@homematch.dev / Admin1234!\n")
	fmt.Printf("Agent: agent1@homematch.dev / Agent1234!\n")
	fmt.Printf("Head:  head@homematch.dev / Head1234!\n")
	fmt.Printf("API Key: %s\n", rawKey)
	log.Println("seed complete")
}

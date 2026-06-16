package services

import (
	"fmt"
	"math"

	"github.com/homematch/crm/internal/models"
)

type MatchResult struct {
	Score int        `json:"score"`
	Rows  []MatchRow `json:"rows"`
}

type MatchRow struct {
	Status string `json:"status"`
	Text   string `json:"text"`
}

type NearbyPlace struct {
	Type string  `json:"type"`
	Name string  `json:"name"`
	Dist int     `json:"dist"`
	Lat  float64 `json:"lat"`
	Lng  float64 `json:"lng"`
}

var tagToType = map[string]string{
	"школа":       "school",
	"детский сад": "kinder",
	"магазин":     "shop",
	"транспорт":   "transport",
	"парк":        "park",
}

func Calculate(client models.Client, property models.Property, nearby []NearbyPlace) MatchResult {
	var total float64
	var rows []MatchRow

	// Budget weight 30
	budgetScore := calcBudget(client, property, &rows)
	total += budgetScore

	// Rooms weight 20
	roomScore := calcRooms(client, property, &rows)
	total += roomScore

	// Area weight 15
	areaScore := calcArea(client, property, &rows)
	total += areaScore

	// Surrounding weight 35
	surScore := calcSurrounding(client, nearby, &rows)
	total += surScore

	return MatchResult{
		Score: int(math.Round(total)),
		Rows:  rows,
	}
}

func calcBudget(c models.Client, p models.Property, rows *[]MatchRow) float64 {
	if c.BudgetMax == 0 {
		*rows = append(*rows, MatchRow{Status: "ok", Text: fmt.Sprintf("Цена %.0f ₽", p.Price)})
		return 15
	}
	if p.Price >= c.BudgetMin && p.Price <= c.BudgetMax {
		*rows = append(*rows, MatchRow{Status: "ok", Text: fmt.Sprintf("Цена %.0f ₽ в бюджете %.0f–%.0f ₽", p.Price, c.BudgetMin, c.BudgetMax)})
		return 30
	}
	if p.Price < c.BudgetMin*0.8 {
		*rows = append(*rows, MatchRow{Status: "ok", Text: fmt.Sprintf("Цена %.0f ₽ ниже вашего бюджета — выгодно", p.Price)})
		return 25
	}
	if p.Price <= c.BudgetMax*1.15 {
		*rows = append(*rows, MatchRow{Status: "warn", Text: fmt.Sprintf("Цена %.0f ₽ немного выше бюджета %.0f ₽", p.Price, c.BudgetMax)})
		return 14
	}
	*rows = append(*rows, MatchRow{Status: "bad", Text: fmt.Sprintf("Цена %.0f ₽ превышает бюджет %.0f ₽", p.Price, c.BudgetMax)})
	return 0
}

func calcRooms(c models.Client, p models.Property, rows *[]MatchRow) float64 {
	if c.RoomsWanted == 0 {
		*rows = append(*rows, MatchRow{Status: "ok", Text: fmt.Sprintf("%d комнат", p.Rooms)})
		return 10
	}
	diff := p.Rooms - c.RoomsWanted
	if diff < 0 {
		diff = -diff
	}
	switch diff {
	case 0:
		*rows = append(*rows, MatchRow{Status: "ok", Text: fmt.Sprintf("%d комнат — точное совпадение", p.Rooms)})
		return 20
	case 1:
		*rows = append(*rows, MatchRow{Status: "warn", Text: fmt.Sprintf("%d комнат, хотел %d", p.Rooms, c.RoomsWanted)})
		return 10
	default:
		*rows = append(*rows, MatchRow{Status: "bad", Text: fmt.Sprintf("%d комнат не совпадает с желаемым %d", p.Rooms, c.RoomsWanted)})
		return 0
	}
}

func calcArea(c models.Client, p models.Property, rows *[]MatchRow) float64 {
	if c.AreaWanted == 0 {
		*rows = append(*rows, MatchRow{Status: "ok", Text: fmt.Sprintf("Площадь %.0f м²", p.Area)})
		return 7.5
	}
	ratio := p.Area / c.AreaWanted
	if ratio >= 0.9 && ratio <= 1.25 {
		*rows = append(*rows, MatchRow{Status: "ok", Text: fmt.Sprintf("Площадь %.0f м² подходит (хотел %.0f м²)", p.Area, c.AreaWanted)})
		return 15
	}
	if ratio >= 0.75 && ratio <= 1.45 {
		*rows = append(*rows, MatchRow{Status: "warn", Text: fmt.Sprintf("Площадь %.0f м², хотел %.0f м²", p.Area, c.AreaWanted)})
		return 8
	}
	*rows = append(*rows, MatchRow{Status: "bad", Text: fmt.Sprintf("Площадь %.0f м² не подходит (хотел %.0f м²)", p.Area, c.AreaWanted)})
	return 0
}

func calcSurrounding(c models.Client, nearby []NearbyPlace, rows *[]MatchRow) float64 {
	if len(c.WishesTags) == 0 {
		*rows = append(*rows, MatchRow{Status: "ok", Text: "Нет особых требований к инфраструктуре"})
		return 17.5
	}

	weightPerTag := 35.0 / float64(len(c.WishesTags))
	var total float64

	for _, tag := range c.WishesTags {
		poiType := tagToType[tag]
		if poiType == "" {
			poiType = tag
		}
		found := false
		for _, place := range nearby {
			if place.Type == poiType && place.Dist <= 500 {
				*rows = append(*rows, MatchRow{Status: "ok", Text: fmt.Sprintf("%s рядом: %s (%d м)", tag, place.Name, place.Dist)})
				total += weightPerTag
				found = true
				break
			}
		}
		if !found {
			// check within 1000m for partial
			for _, place := range nearby {
				if place.Type == poiType && place.Dist <= 1000 {
					*rows = append(*rows, MatchRow{Status: "warn", Text: fmt.Sprintf("%s: %s (%d м)", tag, place.Name, place.Dist)})
					total += weightPerTag * 0.5
					found = true
					break
				}
			}
			if !found {
				*rows = append(*rows, MatchRow{Status: "bad", Text: fmt.Sprintf("%s — не найдено рядом", tag)})
			}
		}
	}

	return total
}

func absInt(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

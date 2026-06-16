package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"net/url"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/homematch/crm/internal/config"
	"github.com/homematch/crm/internal/services"
)

type GeoHandler struct {
	cfg *config.Config
}

func NewGeoHandler(cfg *config.Config) *GeoHandler {
	return &GeoHandler{cfg: cfg}
}

func (h *GeoHandler) Suggest(c *gin.Context) {
	q := c.Query("q")
	if len(q) < 2 {
		c.JSON(http.StatusOK, gin.H{"items": []interface{}{}})
		return
	}

	endpoint := fmt.Sprintf(
		"https://catalog.api.2gis.com/3.0/suggests?q=%s&key=%s&fields=items.point,items.full_name,items.address_name&viewpoint1=45.5,43.4&viewpoint2=45.9,43.2&page_size=7",
		url.QueryEscape(q), h.cfg.TwoGISKey,
	)

	resp, err := http.Get(endpoint)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"items": []interface{}{}})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	type suggestItem struct {
		ID       string `json:"id"`
		Name     string `json:"name"`
		FullName string `json:"full_name"`
		Point    *struct {
			Lat float64 `json:"lat"`
			Lon float64 `json:"lon"`
		} `json:"point"`
	}
	var result struct {
		Result struct {
			Items []suggestItem `json:"items"`
		} `json:"result"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		c.JSON(http.StatusOK, gin.H{"items": []interface{}{}})
		return
	}

	type outItem struct {
		ID       string  `json:"id"`
		Name     string  `json:"name"`
		FullName string  `json:"full_name"`
		Lat      float64 `json:"lat"`
		Lon      float64 `json:"lon"`
	}
	out := make([]outItem, 0)
	for _, item := range result.Result.Items {
		if item.Point == nil {
			continue
		}
		name := item.Name
		if name == "" {
			name = item.FullName
		}
		out = append(out, outItem{
			ID:       item.ID,
			Name:     name,
			FullName: item.FullName,
			Lat:      item.Point.Lat,
			Lon:      item.Point.Lon,
		})
	}
	c.JSON(http.StatusOK, gin.H{"items": out})
}

func (h *GeoHandler) Nearby(c *gin.Context) {
	latStr := c.Query("lat")
	lngStr := c.Query("lng")
	radiusStr := c.DefaultQuery("radius", "800")

	lat, err := strconv.ParseFloat(latStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid lat"})
		return
	}
	lng, err := strconv.ParseFloat(lngStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid lng"})
		return
	}
	radius, err := strconv.Atoi(radiusStr)
	if err != nil {
		radius = 800
	}

	places := fetchNearby(h.cfg, lat, lng, radius)
	c.JSON(http.StatusOK, places)
}

type twoGISItem struct {
	Name     string `json:"name"`
	FullName string `json:"full_name"`
	Point    *struct {
		Lat float64 `json:"lat"`
		Lon float64 `json:"lon"`
	} `json:"point"`
}

type twoGISResponse struct {
	Result struct {
		Items []twoGISItem `json:"items"`
	} `json:"result"`
}

type poiType struct {
	query   string
	typeKey string
}

var poiTypes = []poiType{
	{"школа", "school"},
	{"детский сад", "kinder"},
	{"продукты", "shop"},
	{"остановка", "transport"},
	{"парк", "park"},
}

func fetchNearby(cfg *config.Config, lat, lng float64, radius int) []services.NearbyPlace {
	var places []services.NearbyPlace
	seen := map[string]bool{}

	for _, t := range poiTypes {
		items := queryTwoGIS(cfg.TwoGISKey, t.query, lat, lng, radius)
		for _, item := range items {
			key := fmt.Sprintf("%s_%s", t.typeKey, item.Name)
			if seen[key] {
				continue
			}
			seen[key] = true

			dist := 0
			pLat, pLng := lat, lng
			if item.Point != nil {
				dist = int(haversineDist(lat, lng, item.Point.Lat, item.Point.Lon))
				pLat = item.Point.Lat
				pLng = item.Point.Lon
			}
			name := item.Name
			if name == "" {
				name = item.FullName
			}
			places = append(places, services.NearbyPlace{
				Type: t.typeKey,
				Name: name,
				Dist: dist,
				Lat:  pLat,
				Lng:  pLng,
			})
		}
	}
	return places
}

func queryTwoGIS(apiKey, query string, lat, lng float64, radius int) []twoGISItem {
	if apiKey == "" || apiKey == "demo_key" || apiKey == "your_2gis_demo_key_here" {
		return mockItems(query, lat, lng)
	}

	endpoint := fmt.Sprintf(
		"https://catalog.api.2gis.com/3.0/items?q=%s&location=%f,%f&radius=%d&key=%s&page_size=5&fields=items.point",
		url.QueryEscape(query), lng, lat, radius, apiKey,
	)

	resp, err := http.Get(endpoint)
	if err != nil {
		return mockItems(query, lat, lng)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return mockItems(query, lat, lng)
	}

	var result twoGISResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return mockItems(query, lat, lng)
	}
	return result.Result.Items
}

var mockData = map[string][]struct {
	name    string
	dLat    float64
	dLng    float64
}{
	"школа":       {{"СОШ №1 им. Пушкина", 0.003, 0.001}, {"Гимназия №2", 0.006, -0.002}},
	"детский сад": {{"ДС «Солнышко»", 0.002, 0.002}, {"ДС «Радуга»", -0.005, 0.003}},
	"продукты":    {{"Магнит", 0.001, 0.001}, {"Пятёрочка", -0.004, 0.002}},
	"остановка":   {{"Остановка «Центр»", 0.0005, 0.0005}, {"Остановка «Рынок»", 0.003, -0.003}},
	"парк":        {{"Парк культуры", 0.004, 0.004}, {"Сквер победы", -0.007, 0.005}},
}

func mockItems(query string, lat, lng float64) []twoGISItem {
	data := mockData[query]
	items := make([]twoGISItem, 0, len(data))
	for _, d := range data {
		pLat := lat + d.dLat
		pLng := lng + d.dLng
		items = append(items, twoGISItem{
			Name: d.name,
			Point: &struct {
				Lat float64 `json:"lat"`
				Lon float64 `json:"lon"`
			}{Lat: pLat, Lon: pLng},
		})
	}
	return items
}

func haversineDist(lat1, lng1, lat2, lng2 float64) float64 {
	const R = 6371000.0
	phi1 := lat1 * math.Pi / 180
	phi2 := lat2 * math.Pi / 180
	dPhi := (lat2 - lat1) * math.Pi / 180
	dLambda := (lng2 - lng1) * math.Pi / 180
	a := math.Sin(dPhi/2)*math.Sin(dPhi/2) +
		math.Cos(phi1)*math.Cos(phi2)*math.Sin(dLambda/2)*math.Sin(dLambda/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return R * c
}

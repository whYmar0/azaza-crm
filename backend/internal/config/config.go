package config

import "os"

type Config struct {
	DatabaseURL   string
	JWTSecret     string
	TwoGISKey     string
	Port          string
	GroqKey       string
	UploadDir     string
}

func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	uploadDir := os.Getenv("UPLOAD_DIR")
	if uploadDir == "" {
		uploadDir = "/app/uploads"
	}
	return &Config{
		DatabaseURL: os.Getenv("DATABASE_URL"),
		JWTSecret:   os.Getenv("JWT_SECRET"),
		TwoGISKey:   os.Getenv("TWOGIS_API_KEY"),
		Port:        port,
		GroqKey:     os.Getenv("GROQ_API_KEY"),
		UploadDir:   uploadDir,
	}
}

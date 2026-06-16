up:
	docker compose up --build -d

down:
	docker compose down

logs:
	docker compose logs -f

seed:
	docker compose exec backend ./server -seed

migrate:
	docker compose exec backend ./server -migrate

swag:
	cd backend && swag init -g cmd/server/main.go -o docs

.PHONY: up down logs seed migrate swag

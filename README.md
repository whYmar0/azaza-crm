# Nearby CRM

> «CRM, которая подбирает не квартиру, а образ жизни»

Hackathon MVP — CRM для агентств недвижимости с Match Score по инфраструктуре 2ГИС, воронкой сделок и публичными подборками.

## Быстрый старт

Нужен только Docker — Go-код собирается прямо внутри сборки контейнера.

1. Получи ключ 2ГИС: https://dev.2gis.ru → Create Demo Key, и ключ Groq: https://console.groq.com
2. Скопируй `.env.example` → `.env`, вставь `TWOGIS_API_KEY` и `GROQ_API_KEY`
3. `make up`
4. Открой http://localhost:3000

Любое изменение кода backend подхватывается автоматически при следующем `make up` — пересобирать бинарник руками больше не нужно.

**Логин:** `admin@homematch.dev` / `Admin1234!`

**Swagger:** http://localhost:8080/swagger/index.html

## Демо-аккаунты

| Email | Пароль | Роль |
|-------|--------|------|
| admin@homematch.dev | Admin1234! | Администратор |
| agent1@homematch.dev | Agent1234! | Агент |
| head@homematch.dev | Head1234! | Руководитель |

## Публичный API

API-ключ выводится в логах бэкенда при первом старте (`make logs`).

```bash
# Список свободных объектов
GET http://localhost:8080/api/v1/public/properties
    -H "X-API-Key: hm_xxxxxxxxxxxx"

# Создать лид
POST http://localhost:8080/api/v1/public/leads
     -H "X-API-Key: hm_xxxxxxxxxxxx"
     -H "Content-Type: application/json"
     -d '{"name":"Иван","phone":"+7 900 000-00-00","budget_max":8000000}'

# Публичная подборка (без ключа)
GET http://localhost:8080/api/v1/public/selections/{token}

# Оставить реакцию
POST http://localhost:8080/api/v1/public/selections/{token}/feedback
     -H "Content-Type: application/json"
     -d '{"property_id":1,"reaction":"up","comment":"Отличный вариант!"}'
```

## Команды

```bash
make up       # запустить всё
make down     # остановить
make logs     # логи в реальном времени
make seed     # пересеять данные
make migrate  # применить миграции
```

## Стек

- **Backend:** Go 1.22, Gin, GORM, PostgreSQL 16
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Карты:** 2ГИС MapGL JS API
- **Деплой:** Docker Compose

## Функции

- **Match Score** — прозрачная формула (бюджет 30%, комнаты 20%, площадь 15%, инфраструктура 35%)
- **2ГИС** — поиск школ, садов, магазинов, остановок, парков рядом
- **Kanban** — воронка сделок с drag-and-drop
- **Подборки** — публичные ссылки с реакциями 👍/👎
- **Вебхуки** — оповещения при изменении стадии, новых лидах
- **Автоматизация** — напоминания о клиентах без контакта и зависших сделках
- **Ипотечный калькулятор** — аннуитетный платёж с ползунками

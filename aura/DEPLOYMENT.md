# AURA — Инструкция по развёртыванию

> **Стек:** Next.js 14 · PostgreSQL · Redis (BullMQ) · Cloudflare R2 · два процесса (web + worker)

---

## Содержание

1. [Требования](#1-требования)
2. [Инфраструктура](#2-инфраструктура)
3. [Переменные окружения](#3-переменные-окружения)
4. [Миграция базы данных](#4-миграция-базы-данных)
5. [Вариант A — Vercel + Railway](#5-вариант-a--vercel--railway-рекомендуется)
6. [Вариант B — Docker на VPS](#6-вариант-b--docker-на-vps)
7. [Вариант C — Render](#7-вариант-c--render)
8. [Проверка после деплоя](#8-проверка-после-деплоя)

---

## 1. Требования

| Сервис | Минимум | Назначение |
|--------|---------|-----------|
| Node.js | 20+ | Runtime |
| PostgreSQL | 15+ | Основная БД |
| Redis | 7+ | Очередь BullMQ |
| S3-совместимое хранилище | — | Cloudflare R2 (результаты генераций) |
| Twilio | — | SMS OTP |
| Resend | — | Email (верификация) |
| Google OAuth | — | Авторизация |
| AI-провайдеры | — | NANOBANANA / OpenAI / Kling / Veo / Seedance |

---

## 2. Инфраструктура

### PostgreSQL

Рекомендуемые managed-сервисы (с поддержкой connection pooling для Prisma):

- **[Neon](https://neon.tech)** — бесплатный tier, serverless, connection pooling встроен
- **[Supabase](https://supabase.com)** — бесплатный tier, есть pgBouncer
- **[Railway](https://railway.app)** — простой деплой в один клик

> Для Neon/Supabase: `DATABASE_URL` — строка с пулером (`pgbouncer=true`),
> `DIRECT_URL` — прямое соединение (нужно Prisma для миграций).

### Redis

- **[Upstash](https://upstash.com)** — serverless Redis с REST API, бесплатный tier.
  BullMQ требует `ioredis`, поэтому нужен **режим совместимости** (Upstash поддерживает).
- **[Railway Redis](https://railway.app)** — стандартный Redis, рекомендуется для воркера.

### Cloudflare R2

1. Создайте bucket в [Cloudflare Dashboard → R2](https://dash.cloudflare.com)
2. Создайте API-токен с правами `Object Read & Write` для конкретного bucket
3. Включите **Public Access** (или настройте custom domain) — нужен для `R2_PUBLIC_URL`

### Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Создайте OAuth 2.0 Client ID (тип: Web application)
3. В **Authorized redirect URIs** добавьте:
   ```
   https://your-domain.com/api/auth/callback/google
   ```

---

## 3. Переменные окружения

Скопируйте `.env.example` в `.env.production` и заполните все поля:

```bash
cp .env.example .env.production
```

```env
# ── Auth ──────────────────────────────────────────────────────────
AUTH_SECRET=<64-символьная hex-строка>     # openssl rand -hex 32
GOOGLE_CLIENT_ID=<из Google Cloud Console>
GOOGLE_CLIENT_SECRET=<из Google Cloud Console>
NEXTAUTH_URL=https://your-domain.com

# ── База данных ────────────────────────────────────────────────────
DATABASE_URL=postgresql://user:pass@host:5432/aura?sslmode=require&pgbouncer=true
DIRECT_URL=postgresql://user:pass@host:5432/aura?sslmode=require

# ── Redis ──────────────────────────────────────────────────────────
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=<токен>

# ── Cloudflare R2 ──────────────────────────────────────────────────
R2_ACCOUNT_ID=<account id>
R2_ACCESS_KEY_ID=<access key>
R2_SECRET_ACCESS_KEY=<secret key>
R2_BUCKET_NAME=aura-generations
R2_PUBLIC_URL=https://pub-xxxx.r2.dev     # или ваш custom domain

# ── Twilio (SMS OTP) ───────────────────────────────────────────────
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=<токен>
TWILIO_VERIFY_SERVICE_SID=VAxxxx

# ── Email ──────────────────────────────────────────────────────────
RESEND_API_KEY=re_xxxx

# ── AI-провайдеры ──────────────────────────────────────────────────
NANOBANANA_API_KEY=<ключ>
OPENAI_API_KEY=sk-xxxx
KLING_API_KEY=<ключ>
VEO_API_KEY=<ключ>
SEEDANCE_API_KEY=<ключ>

# ── Безопасность ───────────────────────────────────────────────────
WORKFLOW_SECRET=<32-байт hex>              # openssl rand -hex 32
MODERATION_API_KEY=<ключ>

# ── Observability (опционально) ────────────────────────────────────
SENTRY_DSN=https://xxxx@sentry.io/xxxx
AXIOM_TOKEN=<токен>
POSTHOG_KEY=<ключ>
```

Сгенерировать секреты:

```bash
openssl rand -hex 32   # AUTH_SECRET, WORKFLOW_SECRET
```

---

## 4. Миграция базы данных

Выполните **один раз** перед первым деплоем (и при каждом изменении схемы):

```bash
cd aura

# Установить зависимости
npm install

# Применить миграции к production-БД
DATABASE_URL="<ваша строка>" DIRECT_URL="<прямая строка>" npx prisma migrate deploy

# Проверить схему (опционально)
DATABASE_URL="<ваша строка>" npx prisma db pull
```

---

## 5. Вариант A — Vercel + Railway (рекомендуется)

Это оптимальная связка: Vercel для Next.js-приложения, Railway для фонового воркера.

### 5.1 Деплой Next.js на Vercel

```bash
# Установить Vercel CLI
npm i -g vercel

# Деплой из папки aura
cd aura
vercel --prod
```

При первом деплое Vercel запросит:
- **Framework**: Next.js (определяется автоматически)
- **Build command**: `npm run build`
- **Output directory**: `.next`
- **Root directory**: `aura` (если деплоите из корня монорепо)

Добавьте все переменные окружения в **Vercel Dashboard → Settings → Environment Variables**.

> ⚠️ **Vercel Serverless не поддерживает** долгоживущие процессы.
> Воркер (`workers/generation.worker.ts`) **должен работать отдельно**.

### 5.2 Деплой воркера на Railway

1. Создайте новый проект на [Railway](https://railway.app)
2. Подключите репозиторий (или используйте Railway CLI)
3. Укажите **Start Command**:
   ```
   cd aura && npm install && npx tsx workers/generation.worker.ts
   ```
4. Добавьте все переменные окружения (те же, что и для Vercel)
5. В Railway настройте **Replicas: 1** — воркер должен быть singleton

```bash
# Альтернативно — Railway CLI
npm i -g @railway/cli
railway login
railway link
railway up
```

---

## 6. Вариант B — Docker на VPS

### 6.1 Dockerfile для веб-приложения

Создайте `aura/Dockerfile`:

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]
```

### 6.2 docker-compose.yml

Создайте `docker-compose.yml` в корне проекта:

```yaml
version: "3.9"

services:
  web:
    build:
      context: ./aura
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    env_file: ./aura/.env.production
    depends_on:
      - redis
    restart: unless-stopped

  worker:
    build:
      context: ./aura
      dockerfile: Dockerfile
    command: npx tsx workers/generation.worker.ts
    env_file: ./aura/.env.production
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  redis_data:
```

### 6.3 Запуск

```bash
# Собрать и запустить
docker compose up -d --build

# Применить миграции (один раз)
docker compose exec web npx prisma migrate deploy

# Просмотр логов
docker compose logs -f web
docker compose logs -f worker
```

### 6.4 Nginx (reverse proxy)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Получить TLS-сертификат:

```bash
certbot --nginx -d your-domain.com
```

---

## 7. Вариант C — Render

1. Создайте `render.yaml` в папке `aura`:

```yaml
services:
  - type: web
    name: aura-web
    runtime: node
    buildCommand: npm install && npx prisma generate && npm run build
    startCommand: npm start
    envVars:
      - fromGroup: aura-env

  - type: worker
    name: aura-worker
    runtime: node
    buildCommand: npm install && npx prisma generate
    startCommand: npx tsx workers/generation.worker.ts
    envVars:
      - fromGroup: aura-env
```

2. В Render Dashboard создайте **Environment Group** `aura-env` и добавьте все переменные.

---

## 8. Проверка после деплоя

```bash
# 1. Главная страница отвечает
curl -I https://your-domain.com

# 2. Health-check API
curl https://your-domain.com/api/health

# 3. Проверить статус воркера — через очередь BullMQ
# (проверьте логи воркера на наличие "Worker started")

# 4. Тестовая генерация
# Войдите в аккаунт → выберите стиль → запустите генерацию
# Убедитесь, что статус меняется: PENDING → QUEUED → PROCESSING → COMPLETED
```

### Частые проблемы

| Симптом | Причина | Решение |
|---------|---------|---------|
| `PrismaClientInitializationError` | Неверный `DATABASE_URL` | Проверьте строку подключения |
| Генерации застревают в `QUEUED` | Воркер не запущен | Запустите `worker:start` |
| Ошибка `401` при загрузке в R2 | Неверные R2-ключи | Проверьте `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` |
| Google OAuth не работает | Redirect URI не совпадает | Добавьте `https://your-domain.com/api/auth/callback/google` в Google Console |
| `NEXTAUTH_URL` warning | Переменная не задана | Установите `NEXTAUTH_URL=https://your-domain.com` |
| BullMQ ошибки подключения | Redis недоступен | Проверьте `UPSTASH_REDIS_REST_URL` или сетевой доступ к Redis |

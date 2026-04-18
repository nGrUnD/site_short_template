# TG Proxy Gateway

`TG Proxy Gateway` — self-hosted сайт-прослойка для раздачи `MTProto` proxy через короткие страницы вида `https://your-domain.tld/slug`.

Сервис умеет:

- пускать в админку только через Telegram и allowlist по `ADMIN_TELEGRAM_IDS`;
- хранить `Proxy Config` с `server`, `port`, `secret`;
- создавать публичные slug-страницы под разные каналы, боты и кампании;
- открывать `tg://proxy` с fallback на `https://t.me/proxy`;
- выдавать внутренние короткие ссылки на своём домене;
- подключать внешние short-link провайдеры `Kutt` и `YOURLS`;
- собирать базовую аналитику по просмотрам и кликам;
- загружать аватарки для лендингов.

## Стек

- `Next.js 16`
- `TypeScript`
- `Prisma 7`
- `PostgreSQL 16`
- Docker / Docker Compose

## Минимальные требования к серверу

Для старта обычно достаточно:

- `2 vCPU`
- `2-4 GB RAM`
- `20-40 GB SSD`

Если на том же сервере будет ещё и `MTProxy`, комфортнее брать:

- `2 vCPU`
- `4 GB RAM`
- `30-40 GB SSD`

## Что понадобится до запуска

Перед установкой подготовьте:

1. `VPS` с Ubuntu 22.04 / 24.04.
2. Домен или поддомен, например `go.example.com`.
3. Telegram-бота и его токен через `@BotFather`.
4. Telegram ID администратора.
5. Значения `server`, `port`, `secret` для вашего `MTProto proxy`.

## Как узнать свой Telegram ID

Самый простой способ:

1. Откройте в Telegram любого бота типа `@userinfobot` или аналог.
2. Получите свой числовой `id`.
3. Впишите его в `ADMIN_TELEGRAM_IDS`.

Если админов несколько, перечисляйте через запятую:

```env
ADMIN_TELEGRAM_IDS=123456789,987654321
```

## Подготовка DNS

Ниже пример для домена `go.example.com`.

### Что нужно сделать у регистратора или DNS-провайдера

Создайте `A`-запись:

- `Type`: `A`
- `Name`: `go`
- `Value`: `IP_ВАШЕГО_СЕРВЕРА`
- `TTL`: `300` или `Auto`

Если нужен корневой домен, например `example.com`, тогда:

- `Type`: `A`
- `Name`: `@`
- `Value`: `IP_ВАШЕГО_СЕРВЕРА`

### Как проверить, что DNS применился

Локально или на сервере:

```bash
nslookup go.example.com
```

или:

```bash
dig go.example.com +short
```

В ответе должен быть IP вашего VPS.

## Подготовка сервера Ubuntu

Подключитесь к серверу:

```bash
ssh root@YOUR_SERVER_IP
```

Обновите пакеты:

```bash
apt update && apt upgrade -y
```

Установите базовые утилиты:

```bash
apt install -y curl git ca-certificates gnupg lsb-release ufw
```

### Настройка firewall

Откройте нужные порты:

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status
```

## Установка Docker и Docker Compose

Установите Docker официальным способом:

```bash
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
```

```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null
```

```bash
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Проверьте установку:

```bash
docker --version
docker compose version
```

Включите автозапуск Docker:

```bash
systemctl enable docker
systemctl start docker
```

## Клонирование проекта на сервер

Перейдите в директорию, где будете хранить проект:

```bash
mkdir -p /opt/apps
cd /opt/apps
```

Склонируйте репозиторий:

```bash
git clone YOUR_REPOSITORY_URL tg-proxy-gateway
```

Перейдите в папку проекта:

```bash
cd /opt/apps/tg-proxy-gateway
```

## Как скопировать `.env.example` в `.env`

На Linux:

```bash
cp .env.example .env
```

Проверьте, что файл появился:

```bash
ls -la .env .env.example
```

Откройте `.env` в редакторе:

```bash
nano .env
```

## Пример production `.env`

Ниже пример для боевого сервера. Замените значения на свои:

```env
APP_URL=https://go.example.com
DATABASE_URL=postgresql://postgres:strong_password_here@db:5432/tg_proxy_gateway?schema=public
POSTGRES_DB=tg_proxy_gateway
POSTGRES_USER=postgres
POSTGRES_PASSWORD=strong_password_here
TELEGRAM_BOT_TOKEN=123456789:AAEXAMPLE_REPLACE_ME
TELEGRAM_BOT_USERNAME=my_proxy_gateway_bot
SESSION_SECRET=replace_with_a_long_random_random_string_32_chars_or_more
ADMIN_TELEGRAM_IDS=123456789
```

## Что означает каждая переменная `.env`

- `APP_URL` — публичный URL сайта, обязательно с `https://`
- `DATABASE_URL` — строка подключения приложения к PostgreSQL
- `POSTGRES_DB` — имя базы данных
- `POSTGRES_USER` — пользователь PostgreSQL
- `POSTGRES_PASSWORD` — пароль PostgreSQL
- `TELEGRAM_BOT_TOKEN` — токен Telegram-бота
- `TELEGRAM_BOT_USERNAME` — username бота без `@`
- `SESSION_SECRET` — длинная случайная строка для подписи сессий
- `ADMIN_TELEGRAM_IDS` — список Telegram ID админов через запятую

### Как быстро сгенерировать `SESSION_SECRET`

Вариант 1:

```bash
openssl rand -hex 32
```

Вариант 2:

```bash
python3 - <<'PY'
import secrets
print(secrets.token_hex(32))
PY
```

## Первый запуск приложения

### 1. Соберите и поднимите контейнеры

Из корня проекта:

```bash
docker compose up --build -d
```

### 2. Проверьте, что контейнеры запустились

```bash
docker compose ps
```

Ожидаемо должны быть сервисы:

- `app`
- `db`

### 3. Примените схему Prisma к базе

После первого запуска:

```bash
docker compose exec app npm run db:push
```

### 4. Посмотрите логи приложения

```bash
docker compose logs -f app
```

### 5. Посмотрите логи базы

```bash
docker compose logs -f db
```

На этом этапе приложение уже должно отвечать на `http://SERVER_IP:3000`.

Проверка:

```bash
curl http://127.0.0.1:3000
```

## Настройка reverse proxy через Nginx

Приложение внутри Docker слушает `3000`, а наружу лучше отдавать его через `Nginx` с HTTPS.

### Установка Nginx

```bash
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

### Создайте конфиг сайта

```bash
nano /etc/nginx/sites-available/tg-proxy-gateway
```

Вставьте:

```nginx
server {
    listen 80;
    server_name go.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Активируйте конфиг:

```bash
ln -s /etc/nginx/sites-available/tg-proxy-gateway /etc/nginx/sites-enabled/tg-proxy-gateway
```

Удалите дефолтный конфиг, если он мешает:

```bash
rm -f /etc/nginx/sites-enabled/default
```

Проверьте конфигурацию:

```bash
nginx -t
```

Перезапустите Nginx:

```bash
systemctl reload nginx
```

## Выпуск HTTPS через Certbot

Установите Certbot:

```bash
apt install -y certbot python3-certbot-nginx
```

Получите сертификат:

```bash
certbot --nginx -d go.example.com
```

Проверьте автообновление:

```bash
systemctl status certbot.timer
```

После этого сайт должен открываться по:

```text
https://go.example.com
```

## Проверка Telegram-входа

После запуска:

1. Откройте `https://go.example.com/admin/login`
2. Убедитесь, что у бота корректный `TELEGRAM_BOT_USERNAME`
3. Нажмите вход через Telegram
4. Убедитесь, что ваш Telegram ID есть в `ADMIN_TELEGRAM_IDS`

Схема авторизации:

1. Telegram widget отправляет подписанный payload на `/api/auth/telegram`
2. Сервер проверяет подпись и дату авторизации
3. Сервер проверяет allowlist
4. После успеха создаётся `HTTP-only` cookie сессии

Если `ADMIN_TELEGRAM_IDS` пуст, вход будет заблокирован.

## Первая настройка в админке

После входа:

### 1. Создайте `Proxy Config`

Заполните:

- `label`
- `server`
- `port`
- `secret`
- `notes` при необходимости

### 2. Создайте slug-страницу

Заполните:

- название страницы
- `slug`
- описание
- предупреждение
- текст кнопки шага 1
- текст кнопки шага 2
- `@username` или `https://t.me/...`
- нужный `Proxy Config`

### 3. Откройте публичный URL

Пример:

```text
https://go.example.com/my-slug
```

## Как работает публичная страница

Пользователь видит:

1. карточку с описанием и предупреждением;
2. шаг 1: кнопка открытия `tg://proxy?...`;
3. fallback на `https://t.me/proxy?...`, если приложение не открылось;
4. шаг 2: переход к вашему каналу или боту;
5. ручной fallback: копирование proxy-ссылки.

## Внешние short-link провайдеры

Поддерживаются:

- `Kutt`
- `YOURLS`

Даже если внешний shortener не работает, внутренний URL продолжает работать:

```text
https://go.example.com/your-slug
```

## Если MTProxy и сайт на одном сервере

Нужно помнить:

- сайт обычно использует `80/443`;
- `MTProxy` часто удобнее держать на другом порту;
- этот порт нужно указать в `Proxy Config`;
- для устойчивой схемы лучше потом вынести `MTProxy` на отдельный IP или отдельный сервер.

## Локальный запуск для разработки

Если вы запускаете проект локально, а не на VPS:

### 1. Установите зависимости

```bash
npm install
```

### 2. Поднимите только Postgres

```bash
docker compose up -d db
```

### 3. Скопируйте `.env.example` в `.env`

```bash
cp .env.example .env
```

### 4. Примените схему

```bash
npm run db:push
```

### 5. Запустите dev-сервер

```bash
npm run dev
```

Откройте:

- `http://localhost:3000`
- `http://localhost:3000/admin/login`

## Обновление приложения на сервере

Когда в репозитории появились изменения:

```bash
cd /opt/apps/tg-proxy-gateway
git pull
docker compose up --build -d
docker compose exec app npm run db:push
```

## Резервное копирование

### Бэкап базы PostgreSQL

```bash
docker compose exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backup.sql
```

### Восстановление базы

```bash
cat backup.sql | docker compose exec -T db psql -U "$POSTGRES_USER" "$POSTGRES_DB"
```

### Бэкап загруженных файлов

Аватарки лежат в:

```text
public/uploads
```

В `docker-compose.yml` эта директория смонтирована так:

```yaml
volumes:
  - ./public/uploads:/app/public/uploads
```

Поэтому достаточно сохранять:

- дамп базы;
- папку `public/uploads`;
- ваш `.env`.

## Полезные команды

### Запуск и остановка

```bash
docker compose up --build -d
docker compose down
docker compose restart app
```

### Просмотр состояния

```bash
docker compose ps
docker compose logs -f app
docker compose logs -f db
```

### Работа с Prisma

```bash
npm run db:generate
npm run db:push
docker compose exec app npm run db:push
```

### Проверка кода

```bash
npm install
npm run lint
npm run build
```

### Подключение внутрь контейнера приложения

```bash
docker compose exec app sh
```

### Подключение внутрь PostgreSQL

```bash
docker compose exec db psql -U "$POSTGRES_USER" "$POSTGRES_DB"
```

## Типовые проблемы

### Сайт не открывается по домену

Проверьте:

```bash
nslookup go.example.com
docker compose ps
systemctl status nginx
nginx -t
```

### Не работает вход через Telegram

Проверьте:

- корректный `TELEGRAM_BOT_TOKEN`
- корректный `TELEGRAM_BOT_USERNAME`
- ваш ID в `ADMIN_TELEGRAM_IDS`
- совпадение `APP_URL` с реальным доменом

### Ошибка подключения к базе

Проверьте:

```bash
docker compose logs -f db
docker compose exec app npm run db:push
```

### После обновления схема базы не применилась

Выполните вручную:

```bash
docker compose exec app npm run db:push
```

## Рекомендуемый порядок запуска с нуля

Если кратко, то весь путь такой:

1. Купить VPS
2. Привязать домен к IP через `A`-запись
3. Подключиться по `SSH`
4. Установить Docker
5. Склонировать проект
6. Скопировать `.env.example` в `.env`
7. Заполнить `.env`
8. Выполнить `docker compose up --build -d`
9. Выполнить `docker compose exec app npm run db:push`
10. Поставить `Nginx`
11. Выпустить HTTPS через `certbot`
12. Открыть `/admin/login`
13. Создать `Proxy Config`
14. Создать первую slug-страницу

## Полезно знать

- Для MVP допустимо держать сайт и `MTProxy` на одном сервере.
- Для более стабильной прод-схемы `MTProxy` лучше вынести отдельно.
- Внешний shortener — это опция, внутренний slug уже даёт рабочую короткую ссылку.

@echo off
echo 🎬 Starting Personaliz Video Application...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Check if .env file exists
if not exist .env (
    echo ⚠️  .env file not found. Creating from template...
    copy env.example .env
    echo 📝 Please edit .env file with your API keys before continuing.
    echo    Required: SYNC_API_KEY, TWILIO_SID, TWILIO_TOKEN, ORIGINAL_VIDEO_ID
    exit /b 1
)

REM Build and start services
echo 🏗️  Building and starting services...
docker-compose up --build -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check service health
echo 🔍 Checking service health...

REM Check Backend
curl -f http://localhost:4000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is ready
) else (
    echo ❌ Backend is not ready
    exit /b 1
)

REM Check Frontend
curl -f http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is ready
) else (
    echo ❌ Frontend is not ready
    exit /b 1
)

REM Run database migrations
echo 🗄️  Running database migrations...
docker-compose exec backend npx prisma migrate dev --name init

REM Generate Prisma client
echo 🔧 Generating Prisma client...
docker-compose exec backend npx prisma generate

echo.
echo 🎉 Application is ready!
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:4000
echo 📊 Health Check: http://localhost:4000/health
echo 🗄️  Database Studio: docker-compose exec backend npx prisma studio
echo.
echo 📋 Useful commands:
echo    View logs: docker-compose logs -f
echo    Stop services: docker-compose down
echo    Restart services: docker-compose restart
echo.
echo 🔗 Webhook URLs for external services:
echo    WhatsApp: http://localhost:4000/api/webhook/whatsapp
echo    SyncLabs: http://localhost:4000/api/webhook/sync
echo.
echo ⚠️  For production, use ngrok or similar to expose webhook endpoints
echo    ngrok http 4000
echo.
pause

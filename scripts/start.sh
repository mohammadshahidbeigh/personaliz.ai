#!/bin/bash

# Personaliz Video Application Startup Script

set -e

echo "🎬 Starting Personaliz Video Application..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp env.example .env
    echo "📝 Please edit .env file with your API keys before continuing."
    echo "   Required: SYNC_API_KEY, TWILIO_SID, TWILIO_TOKEN, ORIGINAL_VIDEO_ID"
    exit 1
fi

# Build and start services
echo "🏗️  Building and starting services..."
docker-compose up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

# Check PostgreSQL
if docker-compose exec postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready"
else
    echo "❌ PostgreSQL is not ready"
    exit 1
fi

# Check Backend
if curl -f http://localhost:4000/health > /dev/null 2>&1; then
    echo "✅ Backend is ready"
else
    echo "❌ Backend is not ready"
    exit 1
fi

# Check Frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is ready"
else
    echo "❌ Frontend is not ready"
    exit 1
fi

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose exec backend npx prisma migrate dev --name init

# Generate Prisma client
echo "🔧 Generating Prisma client..."
docker-compose exec backend npx prisma generate

# Seed initial data
echo "🌱 Seeding initial data..."
docker-compose exec backend npx prisma db seed || echo "No seed script found, skipping..."

echo ""
echo "🎉 Application is ready!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:4000"
echo "📊 Health Check: http://localhost:4000/health"
echo "🗄️  Database Studio: docker-compose exec backend npx prisma studio"
echo ""
echo "📋 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart services: docker-compose restart"
echo ""
echo "🔗 Webhook URLs for external services:"
echo "   WhatsApp: http://localhost:4000/api/webhook/whatsapp"
echo "   SyncLabs: http://localhost:4000/api/webhook/sync"
echo ""
echo "⚠️  For production, use ngrok or similar to expose webhook endpoints"
echo "   ngrok http 4000"
echo ""

# 🚀 Personaliz Video Application - Setup Instructions

## Quick Start (5 minutes)

### 1. Prerequisites
- Docker Desktop installed and running
- Git (optional, for version control)

### 2. Environment Setup
```bash
# Copy environment template
cp env.example .env

# Edit .env with your API keys (required for full functionality)
notepad .env  # Windows
# or
nano .env     # Linux/Mac
```

### 3. Start Application
```bash
# Windows
scripts\start.bat

# Linux/Mac
chmod +x scripts/start.sh
./scripts/start.sh

# Or manually
docker-compose up --build -d
```

### 4. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Health Check**: http://localhost:4000/health

## Required API Keys

### SyncLabs API (Required)
1. Sign up at [sync.so](https://sync.so)
2. Get your API key
3. Upload a base video and get video ID
4. Add to `.env`:
```env
SYNC_API_KEY=sk_your_key_here
ORIGINAL_VIDEO_ID=your_video_id_here
```

### WhatsApp API (Required)
Choose one:

#### Option A: Twilio (Recommended)
1. Sign up at [twilio.com](https://twilio.com)
2. Get WhatsApp Business API access
3. Add to `.env`:
```env
TWILIO_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=+14155238886
```

#### Option B: WATI
1. Sign up at [wati.io](https://wati.io)
2. Get API credentials
3. Add to `.env`:
```env
WATI_API_KEY=your_wati_key_here
WATI_BASE_URL=https://live-server-109810.wati.io
```

## Testing Without API Keys

The application will start and run, but:
- Video generation will fail (no SyncLabs API)
- WhatsApp delivery will fail (no WhatsApp API)
- You can still test the UI and database functionality

## Development Commands

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart specific service
docker-compose restart backend

# Access database
docker-compose exec postgres psql -U postgres -d personaliz

# Run Prisma commands
docker-compose exec backend npx prisma studio
docker-compose exec backend npx prisma migrate dev
```

## Troubleshooting

### Services won't start
```bash
# Check Docker is running
docker info

# Check logs
docker-compose logs

# Rebuild everything
docker-compose down
docker-compose up --build
```

### Database issues
```bash
# Reset database
docker-compose down -v
docker-compose up --build
```

### Port conflicts
If ports 3000, 4000, or 5432 are in use:
1. Stop conflicting services
2. Or modify ports in `docker-compose.yml`

## Production Deployment

1. Set production environment variables
2. Use a reverse proxy (nginx)
3. Set up SSL certificates
4. Configure webhook URLs
5. Use production database
6. Set up monitoring and logging

## Support

- Check README.md for detailed documentation
- Review ai-prompts-history.md for development insights
- Contact: support@personaliz.ai

# 🎬 Personaliz Video Creation & WhatsApp Delivery

A full-stack application that creates personalized videos using AI voice cloning and lip-sync technology, then delivers them via WhatsApp.

## 🚀 Features

- **AI Voice Cloning**: Uses SyncLabs API to clone actor voices and generate personalized speech
- **Lip-Sync Technology**: Synchronizes generated audio with actor lip movements
- **WhatsApp Integration**: Sends personalized videos directly to users via WhatsApp Business API
- **Real-time Tracking**: Monitors video generation and delivery status
- **Modern UI**: Beautiful React/Next.js frontend with real-time progress updates
- **Database Logging**: Comprehensive tracking of all requests and events

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (Express.js)  │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   External APIs │
                    │ • SyncLabs      │
                    │ • Twilio/WATI   │
                    └─────────────────┘
```

## 🛠️ Tech Stack

### Backend
- **Express.js** with TypeScript
- **Prisma ORM** with PostgreSQL
- **SyncLabs API** for voice cloning and lip-sync
- **Twilio/WATI** for WhatsApp delivery
- **Docker** containerization

### Frontend
- **Next.js 15** with React 19
- **Tailwind CSS** for styling
- **TypeScript** for type safety

### Infrastructure
- **Docker Compose** for local development
- **PostgreSQL** for data persistence
- **Webhook handling** for status updates

## 📋 Prerequisites

Before running the application, ensure you have:

1. **Docker & Docker Compose** installed
2. **SyncLabs API Key** - Sign up at [sync.so](https://sync.so)
3. **Twilio Account** - For WhatsApp Business API
4. **Original Video** - Base video file for personalization

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd personaliz
```

### 2. Environment Setup
```bash
# Copy environment template
cp env.example .env

# Edit .env with your API keys
nano .env
```

### 3. Configure Environment Variables

Edit `.env` file with your credentials:

```env
# SyncLabs API Configuration
SYNC_API_KEY=sk_your_sync_labs_api_key_here
ORIGINAL_VIDEO_ID=your_original_video_id_here

# Twilio WhatsApp Configuration
TWILIO_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_TOKEN=your_twilio_auth_token_here
TWILIO_WHATSAPP_NUMBER=+14155238886

# Webhook Configuration (for production)
WEBHOOK_BASE_URL=https://your-domain.com
```

### 4. Start the Application
```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

### 5. Initialize Database
```bash
# Run database migrations
docker-compose exec backend npx prisma migrate dev

# Or generate Prisma client
docker-compose exec backend npx prisma generate
```

### 6. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Health Check**: http://localhost:4000/health

## 📱 Usage

### 1. Fill Personalization Form
- Enter your **name** and **city**
- Provide your **WhatsApp number** (with country code)
- Select an **actor** from the dropdown
- Click "Generate & Send Video"

### 2. Monitor Progress
- Watch real-time logs in the frontend
- Track video generation status
- Monitor WhatsApp delivery status

### 3. Receive Video
- Check your WhatsApp for the personalized video
- Video will be delivered automatically once generated

## 🔧 API Endpoints

### Generate Video
```http
POST /api/generate
Content-Type: application/json

{
  "name": "John Doe",
  "city": "New York",
  "phone": "+1234567890",
  "actorId": "actor_1"
}
```

### Get Personalization Status
```http
GET /api/generate/:id
```

### List Available Actors
```http
GET /api/actors
```

### Webhook Endpoints
```http
POST /api/webhook/whatsapp  # WhatsApp status updates
POST /api/webhook/sync      # SyncLabs job updates
```

## 🗄️ Database Schema

### Personalization
- Tracks each video generation request
- Stores user data and processing status
- Links to generated video URLs

### Event
- Logs all processing steps
- Tracks API calls and responses
- Monitors delivery status

### Actor
- Manages available voice actors
- Stores actor metadata and descriptions

## 🔄 Development Workflow

### Backend Development
```bash
# Enter backend container
docker-compose exec backend bash

# Install new dependencies
npm install package-name

# Run Prisma commands
npx prisma migrate dev
npx prisma generate
npx prisma studio

# View logs
docker-compose logs -f backend
```

### Frontend Development
```bash
# Enter frontend container
docker-compose exec frontend bash

# Install new dependencies
npm install package-name

# View logs
docker-compose logs -f frontend
```

### Database Management
```bash
# Access PostgreSQL
docker-compose exec postgres psql -U postgres -d personaliz

# Backup database
docker-compose exec postgres pg_dump -U postgres personaliz > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres personaliz < backup.sql
```

## 🌐 Production Deployment

### 1. Environment Configuration
- Set production environment variables
- Configure webhook URLs for your domain
- Set up SSL certificates

### 2. Database Setup
```bash
# Run production migrations
docker-compose exec backend npx prisma migrate deploy
```

### 3. Webhook Configuration
- Configure Twilio webhook URL: `https://your-domain.com/api/webhook/whatsapp`
- Set up SyncLabs webhook (if supported): `https://your-domain.com/api/webhook/sync`

### 4. Monitoring
- Set up health checks
- Monitor application logs
- Track API usage and costs

## 🧪 Testing

### Manual Testing
1. Start the application with `docker-compose up`
2. Access frontend at http://localhost:3000
3. Fill form with test data
4. Monitor backend logs for API calls
5. Check WhatsApp delivery

### API Testing
```bash
# Test health endpoint
curl http://localhost:4000/health

# Test actors endpoint
curl http://localhost:4000/api/actors

# Test generate endpoint
curl -X POST http://localhost:4000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","city":"Test City","phone":"+1234567890","actorId":"actor_1"}'
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

#### 2. SyncLabs API Errors
- Verify API key is correct
- Check API quota and limits
- Ensure original video ID is valid

#### 3. WhatsApp Delivery Failed
- Verify Twilio credentials
- Check phone number format
- Ensure webhook URL is accessible

#### 4. Frontend Not Loading
```bash
# Restart frontend container
docker-compose restart frontend

# Check for build errors
docker-compose logs frontend
```

### Debug Mode
```bash
# Run with debug logs
DEBUG=* docker-compose up

# Check specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

## 📊 Monitoring & Analytics

### Application Metrics
- Video generation success rate
- Average processing time
- WhatsApp delivery status
- API usage and costs

### Log Analysis
```bash
# View all logs
docker-compose logs

# Filter by service
docker-compose logs backend | grep ERROR

# Real-time monitoring
docker-compose logs -f --tail=100
```

## 🔐 Security Considerations

1. **API Key Protection**: Never commit API keys to version control
2. **Input Validation**: All user inputs are validated and sanitized
3. **Rate Limiting**: Consider implementing rate limiting for production
4. **Webhook Security**: Validate webhook signatures from external services
5. **Database Security**: Use strong passwords and network isolation

## 📈 Performance Optimization

1. **Async Processing**: Video generation runs asynchronously
2. **Caching**: Consider caching actor data and API responses
3. **Database Indexing**: Optimize queries with proper indexes
4. **CDN**: Use CDN for serving generated videos
5. **Load Balancing**: Scale horizontally for high traffic


## 🙏 Acknowledgments

- **SyncLabs** for voice cloning and lip-sync technology
- **Twilio** for WhatsApp Business API
- **Prisma** for database ORM
- **Next.js** and **Express.js** communities

---

**Built with ❤️ for personalized video experiences**

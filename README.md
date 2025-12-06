# 🌬️ DELHI BREATHES

> **Real-Time Air Intelligence for a Healthier Delhi**

A production-grade AQI monitoring, prediction, and decision-support platform for Delhi NCR region.

![Delhi Breathes](https://img.shields.io/badge/Status-Production%20Ready-green)
![License](https://img.shields.io/badge/License-MIT-blue)
![Node](https://img.shields.io/badge/Node-18+-brightgreen)
![React](https://img.shields.io/badge/React-18-blue)

## 🎯 Features

### For Citizens (User Mode)
- **Live AQI Monitoring** - Real-time air quality data from 6+ Delhi NCR regions
- **Health Advisory** - Personalized recommendations based on user category (child, elderly, asthmatic, pregnant, outdoor worker)
- **Safe Route Finder** - Find the least polluted route between locations
- **6hr/24hr Predictions** - ML-based AQI forecasting
- **AI Insights** - Pollution source analysis and prevention tips
- **Interactive Map** - Visual representation of AQI across Delhi NCR

### For Policy Makers (Policy Mode)
- **GRAP Status Dashboard** - Current Graded Response Action Plan stage
- **Zone Severity Analysis** - Priority ranking of all regions
- **Hotspot Detection** - Satellite-based fire/pollution hotspot mapping
- **Early Warning System** - Predictive alerts for pollution spikes
- **Action Cards** - Prioritized intervention recommendations
- **Resource Allocation** - Data-driven deployment suggestions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd delhi-breathes/backend

# Install dependencies
npm install

# Copy environment file and add your API keys
# See "API Keys Required" section below
copy env.example.txt .env

# Start development server
npm run dev
```

Server runs at: `http://localhost:5000`

### Frontend Setup

```bash
cd delhi-breathes/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at: `http://localhost:3000`

## 🔑 API Keys Required

Get free API keys from these providers:

| Provider | Purpose | Get Key |
|----------|---------|---------|
| WAQI | Real-time AQI data | [aqicn.org/data-platform/token](https://aqicn.org/data-platform/token/) |
| OpenWeather | Backup AQI + Weather | [openweathermap.org/api](https://openweathermap.org/api) |
| NASA FIRMS | Fire hotspots | [firms.modaps.eosdis.nasa.gov](https://firms.modaps.eosdis.nasa.gov/api/area/) |
| OpenRouteService | Route planning | [openrouteservice.org](https://openrouteservice.org/dev/#/signup) |

**Note:** The system works with fallback/sample data if API keys are not configured.

## 📡 API Endpoints

### AQI Data
- `GET /api/aqi?lat=28.61&lon=77.20` - Get AQI by coordinates
- `GET /api/aqi/ncr` - Get all Delhi NCR regions AQI
- `GET /api/aqi/health?lat=&lon=&category=` - Health recommendations

### Hotspots
- `GET /api/hotspots` - Get fire/pollution hotspots
- `GET /api/hotspots/clusters` - Get clustered hotspots

### Routes
- `GET /api/routes/safe?originLat=&originLon=&destLat=&destLon=&mode=` - Safe route
- `GET /api/routes/compare` - Compare routes by transport mode

### Predictions
- `GET /api/predictions` - Full prediction data
- `GET /api/predictions/6h` - 6-hour forecast
- `GET /api/predictions/24h` - 24-hour forecast

### AI Insights
- `GET /api/insights` - Comprehensive AI analysis
- `GET /api/insights/policy` - Policy maker insights
- `GET /api/insights/actions` - Action recommendations

## 🏗️ Tech Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Caching:** node-cache (120s TTL)
- **Security:** Helmet, CORS, Rate Limiting
- **Logging:** Winston

### Frontend
- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Maps:** Leaflet.js + React-Leaflet
- **Animations:** Framer Motion
- **Icons:** Lucide React

## 📁 Project Structure

```
delhi-breathes/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration
│   │   ├── controllers/     # Route handlers
│   │   ├── services/        # Business logic
│   │   │   ├── aqiService.js        # AQI data fetching
│   │   │   ├── hotspotService.js    # NASA FIRMS integration
│   │   │   ├── routeService.js      # Safe route calculation
│   │   │   ├── predictionService.js # ML predictions
│   │   │   └── aiInsightsService.js # AI analysis
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Express middleware
│   │   ├── utils/           # Helpers & utilities
│   │   └── server.js        # Entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/      # Header, Footer, Loading
│   │   │   ├── dashboard/   # Main dashboard components
│   │   │   ├── charts/      # Recharts visualizations
│   │   │   ├── map/         # Leaflet map components
│   │   │   ├── health/      # Health advisory panel
│   │   │   ├── routes/      # Safe route finder
│   │   │   ├── policy/      # Policy maker components
│   │   │   └── ai/          # AI insights panel
│   │   ├── context/         # React context
│   │   ├── services/        # API client
│   │   ├── utils/           # Helper functions
│   │   └── styles/          # CSS/Tailwind
│   └── package.json
│
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── README.md
```

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Build and run all services
docker-compose up --build

# Run in background
docker-compose up -d
```

### Individual Containers

```bash
# Backend
docker build -f Dockerfile.backend -t delhi-breathes-api ./backend
docker run -p 5000:5000 --env-file ./backend/.env delhi-breathes-api

# Frontend
docker build -f Dockerfile.frontend -t delhi-breathes-web ./frontend
docker run -p 3000:80 delhi-breathes-web
```

## ☁️ Cloud Deployment

### Backend (Render/Railway/Fly.io)

1. Connect your repository
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Add environment variables from `.env`

### Frontend (Netlify/Vercel)

1. Connect your repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variable:
   - `VITE_API_URL`: Your backend API URL

## 🔒 Security Features

- ✅ Helmet.js security headers
- ✅ CORS protection
- ✅ Rate limiting (100 req/min)
- ✅ Input validation
- ✅ No exposed API keys (server-side only)
- ✅ Environment variable configuration

## 📊 AQI Standards

Using US EPA AQI standards:

| AQI | Level | Color | Health Implications |
|-----|-------|-------|---------------------|
| 0-50 | Good | Green | Minimal impact |
| 51-100 | Moderate | Yellow | Sensitive groups may experience symptoms |
| 101-150 | Unhealthy for Sensitive | Orange | Sensitive groups should reduce outdoor activities |
| 151-200 | Unhealthy | Red | Everyone may experience health effects |
| 201-300 | Very Unhealthy | Purple | Health alert - significant effects |
| 301-500 | Hazardous | Maroon | Emergency conditions |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details.

## 🙏 Data Sources & Credits

- **WAQI** - World Air Quality Index Project
- **OpenWeatherMap** - Weather and pollution data
- **NASA FIRMS** - Fire Information for Resource Management
- **OpenRouteService** - Routing and navigation
- **CPCB** - Central Pollution Control Board standards

---

Built with ❤️ for Delhi NCR | **#DelhiBreathe**


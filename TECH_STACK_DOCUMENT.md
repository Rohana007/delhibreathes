# Tech Stack & System Architecture Document

## Citizen App – User System

---

## 📋 Table of Contents

1. [Introduction](#1-introduction)
2. [System Overview Diagram](#2-system-overview-diagram)
3. [Technology Stack Breakdown](#3-technology-stack-breakdown)
4. [Module-Level Architecture](#4-module-level-architecture)
5. [Frontend Structure Tree](#5-frontend-structure-tree)
6. [Backend Structure Tree](#6-backend-structure-tree)
7. [API Specifications Table](#7-api-specifications-table)
8. [Authentication Flow Diagram](#8-authentication-flow-diagram)
9. [Database Schema Diagram](#9-database-schema-diagram)
10. [Environment Variables](#10-environment-variables)
11. [Hostinger Deployment](#11-hostinger-deployment)
12. [Testing & Validation](#12-testing--validation)
13. [Future Development](#13-future-development)

---

## 1. Introduction

### 1.1 Project Overview

**Citizen App – User System** is a web application designed for citizens to monitor air quality, manage their health, and engage with environmental data through a gamified point system. The application provides secure email-based authentication, personalized dashboards, and real-time air quality intelligence.

### 1.2 Core Features

- **User Authentication**: Secure email + password login system
- **Personal Dashboard**: Real-time AQI data, forecasts, and health recommendations
- **Green Points System**: Gamified rewards for environmental engagement
- **Profile Management**: Update user information and preferences
- **Alerts System**: Personalized air quality alerts based on health category
- **Report Pollution**: Submit pollution reports to authorities

### 1.3 System Requirements

- **Frontend**: Modern React SPA with Vite build tool
- **Backend**: RESTful API with Node.js + Express
- **Database**: MongoDB (Cloud) for data persistence
- **Authentication**: JWT-based token system
- **Deployment**: Hostinger hosting with separated frontend/backend

---

## 2. System Overview Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React SPA (Vite)                                        │  │
│  │  - Login/Signup Pages                                     │  │
│  │  - User Dashboard                                        │  │
│  │  - Profile Management                                     │  │
│  │  - Green Points Display                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/REST API
                              │ JWT Token Auth
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Node.js + Express Server                                │  │
│  │  - Auth Controller (JWT)                                 │  │
│  │  - User Controller                                       │  │
│  │  - Gamification Controller                               │  │
│  │  - Profile Controller                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  FastAPI Gamification Engine (Port 8000)                 │  │
│  │  - Points Service                                        │  │
│  │  - Badges Service                                        │  │
│  │  - Rewards Service                                       │  │
│  │  - Alerts Service                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ MongoDB Driver (Mongoose)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  MongoDB Cloud Database                                  │  │
│  │  - users (User profiles)                                 │  │
│  │  - gamification_profiles (GP data)                      │  │
│  │  - user_settings (Alert preferences)                     │  │
│  │  - points_transactions (GP history)                       │  │
│  │  - user_badges (Achievements)                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack Breakdown

### 3.1 Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2.0 | UI library for building component-based interfaces |
| **Vite** | 7.2.4 | Fast build tool and development server |
| **React Router DOM** | 7.9.6 | Client-side routing and navigation |
| **Axios** | 1.6.2 | HTTP client for API communication |
| **Framer Motion** | 10.16.16 | Animation library for smooth UI transitions |
| **Tailwind CSS** | 3.4.0 | Utility-first CSS framework |
| **Lucide React** | 0.303.0 | Icon library |
| **Recharts** | 2.10.3 | Chart library for data visualization |
| **React Leaflet** | 4.2.1 | Map integration for route visualization |

### 3.2 Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | >=18.0.0 | JavaScript runtime environment |
| **Express** | 4.18.2 | Web application framework |
| **Mongoose** | 8.0.0 | MongoDB ODM (Object Document Mapper) |
| **JSON Web Token** | 9.0.2 | Authentication token generation/verification |
| **Bcrypt** | 6.0.0 | Password hashing library |
| **CORS** | 2.8.5 | Cross-Origin Resource Sharing middleware |
| **Helmet** | 7.1.0 | Security headers middleware |
| **Express Rate Limit** | 7.1.5 | API rate limiting protection |
| **Winston** | 3.11.0 | Logging library |
| **Dotenv** | 16.3.1 | Environment variable management |

### 3.3 Database Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **MongoDB** | Cloud | NoSQL document database |
| **Mongoose** | 8.0.0 | Schema modeling and validation |

### 3.4 Additional Services

| Service | Purpose |
|---------|---------|
| **FastAPI (Python)** | Gamification engine microservice (Port 8000) |
| **Motor (Async MongoDB)** | Async MongoDB driver for FastAPI |
| **PyJWT** | JWT token verification in Python service |

### 3.5 Deployment Tools

| Tool | Purpose |
|------|---------|
| **Hostinger** | Web hosting for frontend (public_html) and backend |
| **PM2** (Optional) | Process manager for Node.js backend |
| **Nginx** (Optional) | Reverse proxy for API routing |

### 3.6 Security Libraries

| Library | Purpose |
|---------|---------|
| **Bcrypt** | Password hashing (10 salt rounds) |
| **JWT** | Stateless authentication tokens |
| **Helmet** | Security headers (XSS, CSRF protection) |
| **Express Rate Limit** | DDoS protection and API throttling |

---

## 4. Module-Level Architecture

### 4.1 Auth Module

**Purpose**: Handle user registration, login, and session management.

**Components**:
- `authController.js` - Business logic for signup/login
- `jwtAuth.js` - JWT token verification middleware
- `auth.js` routes - API endpoint definitions

**Flow**:
```
User Registration → Email Validation → Password Hashing (bcrypt) → 
User Creation in MongoDB → JWT Token Generation → Token Returned to Client
```

**Key Functions**:
- `signup()` - Create new user account
- `login()` - Authenticate user and return JWT
- `getMe()` - Get current user profile (protected)
- `changePassword()` - Update user password (protected)

### 4.2 Dashboard Module

**Purpose**: Display real-time air quality data and user-specific information.

**Components**:
- `UserDashboard.jsx` - Main dashboard component
- `AQICard.jsx` - Air Quality Index display
- `RegionCards.jsx` - Regional AQI cards
- `HistoricAirQuality.jsx` - Historical data charts

**Data Flow**:
```
Dashboard Load → Fetch AQI Data (API) → Fetch User Profile → 
Fetch Green Points → Render Components
```

### 4.3 Green Points Module

**Purpose**: Gamification system for user engagement.

**Components**:
- **Frontend**: `GreenPointsPage.jsx`, `PointsWidget.jsx`, `RewardsBadges.jsx`
- **Backend**: `gamificationController.js` (Node.js), `gamification_engine/` (FastAPI)
- **Database**: `gamification_profiles`, `points_transactions`, `user_badges`

**Architecture**:
```
User Action → Node.js Backend → FastAPI Gamification Engine → 
MongoDB Update → Points Awarded → Badge Evaluation → Response to Frontend
```

**Key Features**:
- Points awarded for actions (report pollution, daily login, etc.)
- Level calculation: `level = 1 + floor(total_points / 100)`
- Badge unlocking based on achievements
- Rewards redemption system

---

## 5. Frontend Structure Tree

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── main.jsx                    # Application entry point
│   ├── App.jsx                      # Root component with routing
│   │
│   ├── pages/                       # Page components
│   │   ├── StartPage.jsx            # Landing page with login options
│   │   ├── Login.jsx                # User login page
│   │   ├── Signup.jsx               # User registration page
│   │   ├── Profile.jsx               # User profile view
│   │   ├── ProfileEdit.jsx           # Edit profile page
│   │   ├── GreenPointsPage.jsx      # Green Points display page
│   │   ├── MyReports.jsx            # User's pollution reports
│   │   ├── SafeRouteMap.jsx         # Route visualization
│   │   └── AchievementsPage.jsx     # User achievements
│   │
│   ├── components/                  # Reusable components
│   │   ├── common/
│   │   │   ├── Header.jsx            # Navigation bar
│   │   │   ├── Footer.jsx            # Footer component
│   │   │   ├── ErrorBoundary.jsx    # Error handling
│   │   │   └── LoadingSpinner.jsx   # Loading states
│   │   │
│   │   ├── dashboard/
│   │   │   ├── UserDashboard.jsx     # Main dashboard
│   │   │   ├── AQICard.jsx          # AQI display card
│   │   │   ├── RegionCards.jsx      # Regional AQI cards
│   │   │   └── HistoricAirQuality.jsx
│   │   │
│   │   ├── ProfileDropdown/
│   │   │   └── ProfileDropdown.jsx  # User menu dropdown
│   │   │
│   │   ├── RewardsBadges/
│   │   │   └── RewardsBadges.jsx    # Badges and rewards display
│   │   │
│   │   ├── PointsWidget.jsx         # Floating GP widget
│   │   ├── FloatingTranslator.jsx   # Language translator
│   │   ├── GoogleTranslateLoader.jsx
│   │   └── ProtectedRoute.jsx       # Route protection
│   │
│   ├── context/                     # React Context providers
│   │   ├── AppContext.jsx           # Global app state
│   │   └── ThemeContext.jsx         # Theme management
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useAuth.js               # Authentication hook
│   │   └── useAqiForecast.js        # AQI forecast data hook
│   │
│   ├── services/                    # API service layer
│   │   └── api.js                   # Axios client and API functions
│   │
│   ├── utils/                       # Utility functions
│   │   ├── pointsEngine.js          # Points calculation logic
│   │   ├── achievementsEngine.js    # Achievement checking
│   │   └── helpers.js               # General helpers
│   │
│   ├── styles/                      # Global styles
│   │   └── index.css                # Tailwind + custom CSS
│   │
│   └── assets/                      # Static assets (images, icons)
│
├── package.json                     # Dependencies and scripts
├── vite.config.js                   # Vite configuration
└── .env                             # Environment variables
```

---

## 6. Backend Structure Tree

```
backend/
├── src/
│   ├── server.js                    # Express server entry point
│   │
│   ├── config/                      # Configuration files
│   │   ├── db.js                    # MongoDB connection
│   │   └── index.js                 # Config exports
│   │
│   ├── controllers/                 # Business logic layer
│   │   ├── authController.js        # Authentication logic
│   │   │   ├── signup()
│   │   │   ├── login()
│   │   │   ├── getMe()
│   │   │   └── changePassword()
│   │   │
│   │   ├── profileController.js     # User profile management
│   │   ├── gamificationController.js # Green Points logic
│   │   ├── reportController.js      # Pollution reports
│   │   └── alertsController.js      # Alert preferences
│   │
│   ├── models/                      # Mongoose schemas
│   │   ├── User.js                  # User model
│   │   │   - name, email, passwordHash
│   │   │   - greenPoints, region, healthCategory
│   │   │   - alertsEnabled, profilePhoto
│   │   │
│   │   ├── GamificationProfile.js   # GP profile model
│   │   ├── Report.js                # Pollution report model
│   │   └── AlertSubscription.js     # Alert preferences model
│   │
│   ├── routes/                      # API route definitions
│   │   ├── index.js                 # Main router
│   │   ├── auth.js                  # Auth routes
│   │   │   POST /api/auth/signup
│   │   │   POST /api/auth/login
│   │   │   GET  /api/auth/me
│   │   │   POST /api/auth/change-password
│   │   │
│   │   ├── profileRoutes.js         # Profile routes
│   │   ├── gamificationRoutes.js    # GP routes
│   │   ├── reportRoutes.js          # Report routes
│   │   └── alerts.js                # Alert routes
│   │
│   ├── middleware/                  # Express middleware
│   │   ├── jwtAuth.js               # JWT verification
│   │   ├── dbCheck.js               # Database connection check
│   │   ├── errorHandler.js          # Global error handler
│   │   ├── rateLimit.js             # Rate limiting
│   │   └── upload.js                # File upload handling
│   │
│   ├── services/                    # Service layer
│   │   ├── airQualityService.js     # AQI data fetching
│   │   ├── predictionService.js     # AQI predictions
│   │   └── userReportService.js     # Report processing
│   │
│   ├── utils/                       # Utility functions
│   │   ├── greenPoints.js           # GP calculation
│   │   ├── logger.js                # Winston logger
│   │   └── mongoHelper.js           # DB connection helpers
│   │
│   └── cron/                        # Scheduled tasks
│       └── alertEngine.js           # Alert sending jobs
│
├── package.json                     # Dependencies
└── .env                             # Environment variables
```

### 6.1 FastAPI Gamification Engine Structure

```
api/
├── gamification_routes.py           # GP API endpoints
├── alerts_routes.py                 # Alerts API endpoints
│
gamification_engine/
├── config.py                        # Points, badges, rewards config
├── models.py                        # Pydantic models
├── schemas.py                       # API request/response schemas
├── points_service.py                # Points awarding logic
├── badges_service.py                # Badge evaluation
├── rewards_service.py                # Rewards management
├── leaderboard_service.py            # Leaderboard computation
└── events_processor.py               # Event orchestration
│
gamification_server.py                # FastAPI application
```

---

## 7. API Specifications Table

### 7.1 Authentication Endpoints

| Method | Endpoint | Description | Auth Required | Request Body | Response Example |
|--------|----------|-------------|---------------|--------------|-------------------|
| POST | `/api/auth/signup` | Register new user | No | `{ name, email, password }` | `{ success: true, user: {...}, token: "..." }` |
| POST | `/api/auth/login` | User login | No | `{ email, password }` | `{ success: true, user: {...}, token: "..." }` |
| GET | `/api/auth/me` | Get current user | Yes (JWT) | None | `{ success: true, user: {...} }` |
| POST | `/api/auth/change-password` | Change password | Yes (JWT) | `{ currentPassword, newPassword }` | `{ success: true, message: "..." }` |

### 7.2 Profile Endpoints

| Method | Endpoint | Description | Auth Required | Request Body | Response Example |
|--------|----------|-------------|---------------|--------------|-------------------|
| GET | `/api/profile` | Get user profile | Yes (JWT) | None | `{ success: true, user: {...} }` |
| PUT | `/api/profile/edit` | Update profile | Yes (JWT) | `FormData: { name, photo? }` | `{ success: true, user: {...} }` |

### 7.3 Green Points Endpoints

| Method | Endpoint | Description | Auth Required | Request Body | Response Example |
|--------|----------|-------------|---------------|--------------|-------------------|
| GET | `/user/gamification/summary` | Get GP summary | Yes (JWT) | None | `{ gp: 150, level: 2, badges: [...], rewards: [...] }` |
| GET | `/user/badges` | Get user badges | Yes (JWT) | None | `{ success: true, badges: [...] }` |
| GET | `/user/rewards` | Get unlocked rewards | Yes (JWT) | None | `{ success: true, rewards: [...] }` |

### 7.4 Alerts Endpoints

| Method | Endpoint | Description | Auth Required | Request Body | Response Example |
|--------|----------|-------------|---------------|--------------|-------------------|
| GET | `/user/alerts/status` | Get alert status | Yes (JWT) | None | `{ alerts_enabled: true, region: "Delhi", health_category: "pregnant" }` |
| POST | `/user/alerts/enable` | Enable alerts | Yes (JWT) | `{ region, health_category }` | `{ success: true, alerts_enabled: true }` |
| POST | `/user/alerts/disable` | Disable alerts | Yes (JWT) | None | `{ success: true, alerts_enabled: false }` |

### 7.5 Reports Endpoints

| Method | Endpoint | Description | Auth Required | Request Body | Response Example |
|--------|----------|-------------|---------------|--------------|-------------------|
| POST | `/api/reports/submit` | Submit pollution report | Yes (JWT) | `{ type, description, location, ... }` | `{ success: true, report: {...} }` |
| GET | `/api/reports/my-reports` | Get user reports | Yes (JWT) | None | `{ success: true, reports: [...] }` |

---

## 8. Authentication Flow Diagram

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       │ 1. POST /api/auth/login
       │    { email, password }
       ▼
┌─────────────────────┐
│  Express Server     │
│  authController     │
└──────┬──────────────┘
       │
       │ 2. Validate email/password
       │    Query MongoDB: User.findOne({ email })
       ▼
┌─────────────────────┐
│  MongoDB            │
│  users collection   │
└──────┬──────────────┘
       │
       │ 3. Compare password (bcrypt)
       │    bcrypt.compare(password, user.passwordHash)
       ▼
┌─────────────────────┐
│  JWT Generation     │
│  jwt.sign({         │
│    userId, email    │
│  }, JWT_SECRET)     │
└──────┬──────────────┘
       │
       │ 4. Return token to client
       │    { success: true, token: "..." }
       ▼
┌─────────────────────┐
│  Frontend           │
│  localStorage.setItem│
│  ('authToken', token)│
└──────┬──────────────┘
       │
       │ 5. Subsequent requests
       │    Header: Authorization: Bearer <token>
       ▼
┌─────────────────────┐
│  Protected Routes   │
│  verifyJWT()        │
│  middleware         │
└──────┬──────────────┘
       │
       │ 6. Verify token
       │    jwt.verify(token, JWT_SECRET)
       ▼
┌─────────────────────┐
│  Attach to request  │
│  req.userId         │
│  req.userEmail      │
└─────────────────────┘
```

### 8.1 Logout Flow

```
User clicks Logout
    │
    ▼
Clear localStorage
    │
    ├── localStorage.removeItem('authToken')
    ├── localStorage.removeItem('user')
    └── localStorage.removeItem('policyAccess')
    │
    ▼
Redirect to /start
    │
    ▼
Token invalidated (client-side)
(No server-side token blacklist needed)
```

---

## 9. Database Schema Diagram

### 9.1 Users Collection

```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique, indexed),
  passwordHash: String (required, bcrypt hashed),
  profilePhoto: String (optional, URL),
  greenPoints: Number (default: 0),
  region: String (enum: ['Delhi', 'Noida', ...]),
  healthCategory: String (enum: ['normal', 'asthma', 'pregnant', ...]),
  alertsEnabled: Boolean (default: false, indexed),
  whatsappEnabled: Boolean (default: false),
  lastAlertAQI: Number (optional),
  lastAlertTime: Date (optional),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes**:
- `email: 1` (unique)
- `alertsEnabled: 1`
- `alertsEnabled: 1, region: 1` (compound)

### 9.2 Gamification Profiles Collection

```javascript
{
  _id: ObjectId,
  user_key: String (required, unique, indexed), // email or userId
  total_points: Number (default: 0),
  current_points_balance: Number (default: 0),
  level: Number (default: 1),
  badges: [String], // Array of badge codes
  rewards_unlocked: [String], // Array of reward codes
  created_at: Date,
  updated_at: Date
}
```

**Indexes**:
- `user_key: 1` (unique)

### 9.3 User Settings Collection

```javascript
{
  _id: ObjectId,
  user_key: String (required, unique, indexed), // email or userId
  alerts_enabled: Boolean (default: false),
  region: String,
  health_category: String,
  created_at: Date,
  updated_at: Date
}
```

**Indexes**:
- `user_key: 1` (unique)

### 9.4 Points Transactions Collection

```javascript
{
  _id: ObjectId,
  user_key: String (required, indexed),
  event_type: String (e.g., 'REPORT_POLLUTION', 'DAILY_LOGIN'),
  points_delta: Number,
  metadata: Object,
  idempotency_key: String (optional, for duplicate prevention),
  created_at: Date
}
```

**Indexes**:
- `user_key: 1, created_at: -1`
- `idempotency_key: 1, user_key: 1` (compound, unique)

### 9.5 User Badges Collection

```javascript
{
  _id: ObjectId,
  user_key: String (required, indexed),
  badge_code: String (required),
  earned_at: Date
}
```

**Indexes**:
- `user_key: 1, badge_code: 1` (compound, unique)

---

## 10. Environment Variables

### 10.1 Frontend (.env)

```bash
# API Base URL
VITE_API_URL=http://localhost:5000/api

# FastAPI Gamification Engine URL
VITE_FASTAPI_URL=http://localhost:8000

# Google Maps API Key (for route visualization)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**Why `.env` for Frontend?**
- Vite uses `import.meta.env.VITE_*` for environment variables
- Variables prefixed with `VITE_` are exposed to client-side code
- Allows different API URLs for development vs production
- **Note**: Never expose secrets in frontend `.env` (they're bundled into client code)

### 10.2 Backend (.env)

```bash
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/delhi_breathes

# JWT Secret (for token signing/verification)
JWT_SECRET=your_super_secret_jwt_key_min_32_chars

# Alternative JWT Secret (fallback)
VERIFICATION_TOKEN_SECRET=your_verification_secret

# Server Port
PORT=5000

# Node Environment
NODE_ENV=production

# CORS Origins (comma-separated)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**Why `.env` for Backend?**
- **Security**: Secrets never committed to version control
- **Flexibility**: Different configs for dev/staging/production
- **Separation**: Keeps sensitive data out of code
- **Best Practice**: Industry standard for configuration management

### 10.3 FastAPI Gamification Engine (.env)

```bash
# MongoDB Connection (same as backend)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/delhi_breathes

# JWT Secret (must match backend)
JWT_SECRET=your_super_secret_jwt_key_min_32_chars

# FastAPI Server Port
GAMIFICATION_PORT=8000
GAMIFICATION_HOST=0.0.0.0
```

---

## 11. Hostinger Deployment

### 11.1 Frontend Deployment

#### Step 1: Build Frontend

```bash
cd frontend
npm install
npm run build
```

This creates a `dist/` folder with optimized production files.

#### Step 2: Upload to Hostinger

1. **Access Hostinger File Manager** or use FTP (FileZilla)
2. **Navigate to `public_html/`** (or your domain's root)
3. **Upload all files from `frontend/dist/`** to `public_html/`
4. **Ensure `index.html` is in the root** of `public_html/`

#### Step 3: Configure Environment Variables

Create `.env` file in `public_html/` (or configure via Hostinger panel):

```bash
VITE_API_URL=https://yourdomain.com/api
VITE_FASTAPI_URL=https://yourdomain.com:8000
```

**Note**: Since Vite bundles env vars at build time, you may need to rebuild after setting production URLs.

### 11.2 Backend Deployment

#### Step 1: Prepare Backend

```bash
cd backend
npm install --production
```

#### Step 2: Upload Backend

1. **Create folder**: `public_html/backend/` (or separate subdomain)
2. **Upload backend files**:
   - `src/` directory
   - `package.json`
   - `.env` file (with production values)
   - `node_modules/` (or run `npm install` on server)

#### Step 3: Configure Node.js on Hostinger

1. **Access Node.js Manager** in Hostinger control panel
2. **Create Node.js App**:
   - App Name: `delhi-breathes-api`
   - App Root: `/backend`
   - App URL: `https://yourdomain.com/api` (or subdomain)
   - Startup File: `src/server.js`
   - Node Version: `18.x` or higher

3. **Set Environment Variables** in Node.js Manager:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5000
   NODE_ENV=production
   ```

#### Step 4: Start Backend

```bash
# Via Hostinger Node.js Manager
# Or via SSH:
cd backend
pm2 start src/server.js --name "delhi-breathes-api"
# Or:
node src/server.js
```

### 11.3 FastAPI Deployment (Optional)

If running FastAPI on Hostinger:

1. **Install Python 3.9+** via Hostinger Python Manager
2. **Upload FastAPI files** to `public_html/gamification/`
3. **Install dependencies**:
   ```bash
   pip install -r requirements_gamification.txt
   ```
4. **Run with Gunicorn/Uvicorn**:
   ```bash
   uvicorn gamification_server:app --host 0.0.0.0 --port 8000
   ```

### 11.4 Reverse Proxy Configuration (Nginx)

If using Nginx on Hostinger, configure reverse proxy:

```nginx
# API Backend
location /api {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

# FastAPI Gamification
location /gamification {
    proxy_pass http://localhost:8000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
}
```

### 11.5 Domain Configuration Example

```
Frontend:  https://yourdomain.com
Backend:   https://yourdomain.com/api
FastAPI:   https://yourdomain.com:8000
           OR
           https://api.yourdomain.com
```

---

## 12. Testing & Validation

### 12.1 Local Development Commands

#### Frontend

```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm run dev
# Runs on http://localhost:3000

# Build for production
npm run build

# Preview production build
npm run preview
```

#### Backend

```bash
# Install dependencies
cd backend
npm install

# Start development server (with auto-reload)
npm run dev
# Runs on http://localhost:5000

# Start production server
npm start
```

#### FastAPI Gamification Engine

```bash
# Install dependencies
pip install -r requirements_gamification.txt

# Run server
python gamification_server.py
# Runs on http://localhost:8000
```

### 12.2 Postman Test Examples

#### 1. User Signup

```http
POST http://localhost:5000/api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Expected Response**:
```json
{
  "success": true,
  "user": {
    "name": "John Doe",
    "email": "john@example.com",
    "greenPoints": 10
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 2. User Login

```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Expected Response**:
```json
{
  "success": true,
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 3. Get User Profile (Protected)

```http
GET http://localhost:5000/api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Expected Response**:
```json
{
  "success": true,
  "user": {
    "name": "John Doe",
    "email": "john@example.com",
    "greenPoints": 150,
    "level": 2
  }
}
```

#### 4. Get Green Points Summary

```http
GET http://localhost:8000/user/gamification/summary
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Expected Response**:
```json
{
  "gp": 150,
  "level": 2,
  "badges": ["NEW_USER", "FIRST_REPORT"],
  "rewards": ["METRO10"],
  "nextLevelPoints": 50,
  "totalPoints": 150
}
```

#### 5. Enable Alerts

```http
POST http://localhost:8000/user/alerts/enable
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "region": "Delhi",
  "health_category": "Pregnant"
}
```

**Expected Response**:
```json
{
  "success": true,
  "alerts_enabled": true,
  "region": "Delhi",
  "health_category": "Pregnant"
}
```

### 12.3 Browser Session Validation

#### Test Checklist

1. **Registration Flow**:
   - ✅ Navigate to `/start`
   - ✅ Click "Citizen Login" → `/login`
   - ✅ Click "Sign Up" → Fill form → Submit
   - ✅ Verify redirect to `/dashboard`
   - ✅ Check `localStorage` for `authToken`

2. **Login Flow**:
   - ✅ Navigate to `/login`
   - ✅ Enter email/password → Submit
   - ✅ Verify redirect to `/dashboard`
   - ✅ Check JWT token in `localStorage`

3. **Protected Routes**:
   - ✅ Try accessing `/dashboard` without login → Should redirect to `/login`
   - ✅ Login → Access `/dashboard` → Should work
   - ✅ Check navbar shows user name and profile dropdown

4. **Green Points Display**:
   - ✅ Check GP widget in navbar (should show points)
   - ✅ Navigate to `/green-points` → Verify GP, level, badges displayed
   - ✅ Check profile dropdown shows GP

5. **Logout Flow**:
   - ✅ Click profile dropdown → "Logout"
   - ✅ Verify redirect to `/start`
   - ✅ Verify `localStorage` cleared
   - ✅ Try accessing `/dashboard` → Should redirect to login

---

## 13. Future Development

### 13.1 Safe Route Map Feature Integration

**Current Status**: Basic route visualization exists

**Future Enhancements**:
- Real-time traffic integration
- Multiple route options with AQI comparison
- Route sharing functionality
- Offline route caching

**Integration Points**:
- `SafeRouteMap.jsx` - Frontend component
- `safeRouteController.js` - Backend API
- `routing_engine/` - Python route calculation service

### 13.2 Progressive Web App (PWA) → Android APK

**Roadmap**:
1. **PWA Configuration**:
   - Add `manifest.json` for app metadata
   - Implement service worker for offline support
   - Add app icons and splash screens

2. **WebView Wrapper**:
   - Create Android WebView app
   - Package React app as APK
   - Native features: Push notifications, GPS access

3. **APK Distribution**:
   - Build signed APK
   - Publish to Google Play Store (optional)
   - Direct APK download from website

**Files to Create**:
- `frontend/public/manifest.json`
- `frontend/public/service-worker.js`
- Android WebView project (separate repository)

### 13.3 Language Selector Enhancement

**Current Status**: Google Translate widget integrated

**Future Enhancements**:
- Persistent language preference (save to user profile)
- Server-side content translation
- RTL (Right-to-Left) support for Urdu/Arabic
- Language-specific date/number formatting

**Integration Points**:
- `FloatingTranslator.jsx` - Language selector UI
- `User.js` model - Add `preferredLanguage` field
- Backend API - Save language preference

### 13.4 Green Points Gamification Expansion

**Current Features**:
- Points for actions (reports, daily login)
- Badge system
- Level progression
- Rewards redemption

**Future Enhancements**:
- **Challenges**: Weekly/monthly challenges
- **Leaderboards**: Global and regional rankings
- **Streaks**: Daily login streaks with bonuses
- **Social Features**: Share achievements, friend comparisons
- **Tiered Rewards**: Level-based unlock system

**Integration Points**:
- `gamification_engine/challenges_service.py` - Challenge logic
- `gamification_engine/leaderboard_service.py` - Ranking system
- `gamification_engine/streaks_service.py` - Streak tracking

### 13.5 Additional Features Roadmap

| Feature | Priority | Status | Estimated Effort |
|---------|----------|--------|------------------|
| Push Notifications | High | Planned | 2 weeks |
| Offline Mode (PWA) | Medium | Planned | 3 weeks |
| Social Sharing | Low | Planned | 1 week |
| Advanced Analytics | Medium | Planned | 2 weeks |
| Multi-language Content | High | In Progress | 1 week |
| Mobile App (React Native) | Low | Future | 8 weeks |

---

## 📝 Document Version

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Author**: Delhi Breathes Development Team  
**Status**: Production Ready

---

## 🔗 Additional Resources

- **API Documentation**: Available at `http://localhost:5000/api/docs` (if Swagger enabled)
- **FastAPI Docs**: Available at `http://localhost:8000/docs`
- **GitHub Repository**: [Repository URL]
- **Deployment Guide**: See Section 11

---

## ✅ Conclusion

This document provides a comprehensive overview of the Citizen App architecture, covering frontend, backend, database, and deployment strategies. The system is designed with scalability, security, and maintainability in mind, using modern web technologies and best practices.

For questions or updates to this document, please contact the development team.

---

**End of Document**


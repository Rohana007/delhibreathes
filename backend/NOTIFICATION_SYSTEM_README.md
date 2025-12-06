# Delhi Breathes - Backend Notification System

## Overview

Complete backend notification system built with Node.js, Express, MongoDB, and Twilio. This system replaces Firebase OTP with Twilio Verify and provides automated AQI alerts via SMS and WhatsApp.

## ✅ What Has Been Built

### 1. **User Model** (`models/User.js`)
- Updated with all required fields:
  - `phone` (unique, indexed)
  - `region` (enum: Delhi, Noida, etc.)
  - `healthCategory` (enum: normal, asthma, child, etc.)
  - `alertsEnabled` (boolean, indexed)
  - `whatsappEnabled` (boolean)
  - `lastAlertAQI` (number)
  - `lastAlertTime` (date)

### 2. **Twilio Utilities** (`utils/twilio.js`)
- `sendOTP(phone)` - Send OTP via Twilio Verify Service
- `verifyOTP(phone, code)` - Verify OTP code
- `sendSMS(phone, message)` - Send SMS via Twilio
- `sendWhatsApp(phone, message)` - Send WhatsApp via Twilio
- `normalizePhone(phone)` - Normalize phone to E.164 format

### 3. **Alert Formatter** (`utils/alertFormatter.js`)
- `formatAQIAlert({ region, aqi, healthCategory, pollutants })` - Format alert messages
- `getAQICategory(aqi)` - Get AQI category label and emoji
- `getHealthRecommendations(healthCategory, aqi)` - Get health-specific recommendations

### 4. **Authentication APIs** (`routes/authRoutes.js` + `controllers/authController.js`)
- **POST** `/api/auth/send-otp` - Send OTP to phone
- **POST** `/api/auth/verify-otp` - Verify OTP and get JWT token

### 5. **Alerts APIs** (`routes/alerts.routes.js` + `controllers/alertsController.js`)
- **POST** `/api/alerts/enable` - Enable alerts with region, health category, WhatsApp preference
- **POST** `/api/alerts/disable` - Disable alerts
- **GET** `/api/alerts/status/:phone` - Get alerts status
- **POST** `/api/alerts/test` - Send test alert (SMS + WhatsApp)
- **GET** `/api/user/:phone` - Get user data

### 6. **Alert Engine Cron Job** (`cron/alertEngine.js`)
- Runs every **15 minutes**
- Fetches AQI for all regions with enabled users
- Checks thresholds based on health category:
  - Asthma → > 100
  - Elderly → > 120
  - Pregnant → > 90
  - Child → > 75
  - Normal → > 150
  - Heart Patient → > 90
- Sends SMS to all enabled users
- Sends WhatsApp to users with `whatsappEnabled: true`
- Updates `lastAlertAQI` and `lastAlertTime`
- Prevents duplicate alerts within 2 hours (unless AQI increases significantly)

### 7. **Server Integration** (`server.js`)
- Alert engine initialized on server start
- All routes registered and working

## 📁 File Structure

```
backend/
├── src/
│   ├── models/
│   │   └── User.js (✅ Updated)
│   ├── utils/
│   │   ├── twilio.js (✅ New)
│   │   └── alertFormatter.js (✅ New)
│   ├── controllers/
│   │   ├── authController.js (✅ Updated)
│   │   └── alertsController.js (✅ Updated)
│   ├── routes/
│   │   ├── authRoutes.js (✅ Updated)
│   │   ├── alerts.routes.js (✅ Updated)
│   │   └── index.js (✅ Updated)
│   ├── cron/
│   │   └── alertEngine.js (✅ New)
│   └── server.js (✅ Updated)
├── API_DOCUMENTATION.md (✅ New)
├── POSTMAN_COLLECTION.json (✅ New)
└── NOTIFICATION_SYSTEM_README.md (✅ This file)
```

## 🔧 Environment Variables

Add these to your `.env` file:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_SMS_FROM=+1234567890

# JWT Secret
VERIFICATION_TOKEN_SECRET=your_jwt_secret_key
VERIFICATION_TOKEN_EXPIRES=7d

# MongoDB
MONGODB_URI=mongodb://localhost:27017/delhi_breathes

# Server
PORT=5000
NODE_ENV=development
```

## 🚀 Setup Instructions

1. **Install Dependencies** (if not already installed):
   ```bash
   npm install twilio node-cron
   ```

2. **Configure Twilio:**
   - Create a Twilio account at https://www.twilio.com
   - Get your Account SID and Auth Token
   - Create a Verify Service and get the Service SID
   - Get a Twilio phone number for SMS
   - Set up WhatsApp Sandbox (for testing) or use production WhatsApp number

3. **Update `.env` file** with your Twilio credentials

4. **Start the server:**
   ```bash
   npm start
   # or
   npm run dev
   ```

5. **Test the APIs:**
   - Import `POSTMAN_COLLECTION.json` into Postman
   - Set `base_url` variable to `http://localhost:5000/api`
   - Test the endpoints

## 📝 API Endpoints Summary

### Authentication
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP and get JWT

### Alerts
- `POST /api/alerts/enable` - Enable alerts
- `POST /api/alerts/disable` - Disable alerts
- `GET /api/alerts/status/:phone` - Get status
- `POST /api/alerts/test` - Send test alert

### User
- `GET /api/user/:phone` - Get user data

## 🔄 How It Works

1. **User Registration Flow:**
   - User requests OTP via `/api/auth/send-otp`
   - Twilio sends OTP via SMS
   - User verifies OTP via `/api/auth/verify-otp`
   - System creates user in MongoDB and returns JWT

2. **Enable Alerts Flow:**
   - User calls `/api/alerts/enable` with phone, region, health category, WhatsApp preference
   - System updates user record with alert preferences
   - Welcome message sent via SMS/WhatsApp

3. **Automatic Alert Flow:**
   - Cron job runs every 15 minutes
   - Fetches AQI for all regions with enabled users
   - Checks if AQI exceeds user-specific threshold
   - Sends SMS to all enabled users
   - Sends WhatsApp to users with `whatsappEnabled: true`
   - Updates `lastAlertAQI` and `lastAlertTime`

4. **Disable Alerts Flow:**
   - User calls `/api/alerts/disable`
   - System sets `alertsEnabled: false`
   - No more alerts sent

## 🧪 Testing

1. **Test OTP Flow:**
   ```bash
   # Send OTP
   curl -X POST http://localhost:5000/api/auth/send-otp \
     -H "Content-Type: application/json" \
     -d '{"phone": "9876543210"}'
   
   # Verify OTP (use code from SMS)
   curl -X POST http://localhost:5000/api/auth/verify-otp \
     -H "Content-Type: application/json" \
     -d '{"phone": "9876543210", "code": "123456"}'
   ```

2. **Test Enable Alerts:**
   ```bash
   curl -X POST http://localhost:5000/api/alerts/enable \
     -H "Content-Type: application/json" \
     -d '{
       "phone": "9876543210",
       "region": "Delhi",
       "healthCategory": "asthma",
       "whatsappEnabled": true
     }'
   ```

3. **Test Alert Status:**
   ```bash
   curl http://localhost:5000/api/alerts/status/9876543210
   ```

4. **Test Alert:**
   ```bash
   curl -X POST http://localhost:5000/api/alerts/test \
     -H "Content-Type: application/json" \
     -d '{"phone": "9876543210"}'
   ```

## 📊 Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  phone: "9876543210", // unique, indexed
  region: "Delhi", // enum
  healthCategory: "asthma", // enum
  alertsEnabled: true, // boolean, indexed
  whatsappEnabled: true, // boolean
  lastAlertAQI: 255, // number
  lastAlertTime: ISODate("2024-01-15T10:30:00Z"), // date
  createdAt: ISODate("2024-01-01T00:00:00Z"),
  updatedAt: ISODate("2024-01-15T10:30:00Z")
}
```

## ⚠️ Important Notes

1. **Phone Number Format:**
   - System normalizes phone numbers to 10-digit format
   - Removes `+91`, `91` prefixes automatically
   - Stores as 10-digit string in database

2. **Alert Frequency:**
   - Alerts sent maximum once every 2 hours
   - Exception: If AQI increases by >20 points, alert sent immediately

3. **WhatsApp Requirements:**
   - Users must opt-in to receive WhatsApp messages
   - Twilio WhatsApp Sandbox requires users to send a message first
   - Production WhatsApp requires business verification

4. **Error Handling:**
   - All Twilio errors are logged
   - Failed messages don't break the alert flow
   - System continues processing other users even if one fails

## 🔍 Monitoring

Check server logs for:
- `[Twilio OTP]` - OTP sending/verification
- `[Twilio SMS]` - SMS sending
- `[Twilio WhatsApp]` - WhatsApp sending
- `[Alert Engine]` - Cron job execution
- `[Auth]` - Authentication events

## 📚 Documentation

- **API Documentation:** See `API_DOCUMENTATION.md`
- **Postman Collection:** Import `POSTMAN_COLLECTION.json`

## ✅ All Requirements Met

- ✅ Twilio OTP APIs (send-otp, verify-otp)
- ✅ User model with all required fields
- ✅ Enable/Disable alerts APIs
- ✅ Twilio messaging utilities (SMS, WhatsApp)
- ✅ Alert formatter utility
- ✅ Alert engine cron job (runs every 15 minutes)
- ✅ Test alert API
- ✅ Get user API
- ✅ All routes integrated
- ✅ Postman collection provided
- ✅ Complete documentation

## 🎉 Ready to Use!

The backend notification system is complete and ready to use. Just configure your Twilio credentials and start the server!


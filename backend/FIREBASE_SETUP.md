# Firebase Phone OTP Authentication Setup

## Overview

This backend now supports Firebase Phone OTP authentication with server JWT tokens and MongoDB storage for pollution reports.

## Architecture

1. **Client** → Firebase Web SDK → Sends OTP via Recaptcha
2. **Client** → Gets Firebase `idToken` after OTP verification
3. **Client** → Sends `idToken` to `/api/auth/firebase`
4. **Backend** → Verifies Firebase token → Issues server JWT
5. **Client** → Uses server JWT for protected endpoints

## Environment Variables

Add these to your `.env` file:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/delhi_breathes
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/delhi_breathes

# Server Configuration
PORT=5000

# JWT Configuration
VERIFICATION_TOKEN_SECRET=your-random-secret-key-here-change-in-production
VERIFICATION_TOKEN_EXPIRES=15m

# Firebase Admin SDK
# Option 1: JSON string in environment variable
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}

# Option 2: Path to service account file
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json

# File Upload Configuration
UPLOAD_DIR=./uploads
UPLOAD_BASE_URL=/uploads
```

## Firebase Setup

### 1. Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file

### 2. Configure Backend

**Option A: Use Environment Variable (Recommended for production)**
```env
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

**Option B: Use File Path**
1. Place `serviceAccountKey.json` in `backend/` directory
2. Add to `.gitignore`:
   ```
   serviceAccountKey.json
   ```
3. Set in `.env`:
   ```env
   FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
   ```

## API Endpoints

### 1. Firebase Authentication

**POST** `/api/auth/firebase`

**Request:**
```json
{
  "idToken": "firebase-id-token-from-client"
}
```

**Response:**
```json
{
  "success": true,
  "token": "server-jwt-token",
  "phoneMasked": "XXXXXXX210"
}
```

**Rate Limit:** 5 requests per hour

### 2. Submit Report

**POST** `/api/report`

**Headers:**
```
Authorization: Bearer <server-jwt-token>
Content-Type: multipart/form-data
```

**Body (FormData):**
- `description` (string, required)
- `category` (string, required)
- `lat` (number, required)
- `lng` (number, required)
- `image` (file, optional, max 5MB, jpeg/png/webp)

**Response:**
```json
{
  "success": true,
  "report": {
    "id": "report-id",
    "phone": "XXXXXXX210",
    "description": "...",
    "category": "...",
    "imageUrl": "/uploads/report-123.jpg",
    "location": {
      "lat": 28.6139,
      "lng": 77.2090
    },
    "timestamp": 1234567890
  }
}
```

**Rate Limit:** 5 requests per 10 minutes

### 3. Get My Reports

**GET** `/api/report/my-reports`

**Headers:**
```
Authorization: Bearer <server-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "reports": [
    {
      "id": "report-id",
      "phone": "XXXXXXX210",
      "description": "...",
      "category": "...",
      "imageUrl": "/uploads/report-123.jpg",
      "location": {
        "lat": 28.6139,
        "lng": 77.2090
      },
      "timestamp": 1234567890
    }
  ]
}
```

## MongoDB Schema

**Collection:** `reports`

**Schema:**
```javascript
{
  phone: String (indexed),
  description: String,
  category: String,
  imageUrl: String (nullable),
  location: {
    lat: Number,
    lng: Number
  },
  timestamp: Number (indexed),
  createdAt: Date,
  updatedAt: Date
}
```

## Installation

1. Install dependencies:
```bash
cd backend
npm install
```

2. Set up environment variables (see above)

3. Start MongoDB (if using local):
```bash
mongod
```

4. Start server:
```bash
npm start
```

## Testing

### Test Firebase Auth

```bash
curl -X POST http://localhost:5000/api/auth/firebase \
  -H "Content-Type: application/json" \
  -d '{"idToken":"your-firebase-id-token"}'
```

### Test Report Submission

```bash
curl -X POST http://localhost:5000/api/report \
  -H "Authorization: Bearer <server-jwt-token>" \
  -F "description=Test pollution report" \
  -F "category=air-quality" \
  -F "lat=28.6139" \
  -F "lng=77.2090" \
  -F "image=@/path/to/image.jpg"
```

### Test My Reports

```bash
curl -X GET http://localhost:5000/api/report/my-reports \
  -H "Authorization: Bearer <server-jwt-token>"
```

## File Structure

```
backend/
  src/
    models/
      Report.js              # MongoDB Report model
    controllers/
      authController.js      # Firebase auth controller
      reportController.js     # Report submission & my-reports
    routes/
      authRoutes.js          # /api/auth/* routes
      reportRoutes.js        # /api/report/* routes
    middleware/
      verifyServerToken.js   # JWT verification middleware
      upload.js              # Multer file upload middleware
      rateLimit.js            # Rate limiting middleware
    services/
      firebaseService.js      # Firebase Admin SDK service
      maskService.js          # Phone masking utility
    server.js                # Main server file
```

## Security Features

1. **JWT Tokens:** 15-minute expiry
2. **Rate Limiting:**
   - Auth: 5 requests/hour
   - Reports: 5 requests/10 minutes
3. **Phone Masking:** All phone numbers masked in responses
4. **File Validation:** Only images (jpeg/png/webp), max 5MB
5. **Token Verification:** Single-use tokens for legacy OTP flow

## Legacy APIs

The following legacy endpoints are still available for backward compatibility:

- `POST /api/report/send-otp` - Send OTP via Fast2SMS
- `POST /api/report/verify-otp` - Verify OTP
- `POST /api/report/submit` - Submit report with OTP verification

These use the old Fast2SMS OTP flow and are separate from the new Firebase-based endpoints.


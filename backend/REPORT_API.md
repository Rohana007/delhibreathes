# Report Pollution API Documentation

## Overview

The Report Pollution API provides an OTP-based, no-login flow for users to submit pollution reports. Users verify their phone number via OTP before submitting a report, and receive an SMS confirmation with a Report ID.

## Base URL

```
http://localhost:5000/api
```

## Authentication

The report submission endpoint requires a verification token obtained after OTP verification. Include it in the Authorization header:

```
Authorization: Bearer <verificationToken>
```

## Endpoints

### 1. Send OTP

Send a 6-digit OTP to the user's phone number.

**Endpoint:** `POST /api/report/send-otp`

**Request Body:**
```json
{
  "phone": "9876543210",
  "countryCode": "+91"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "phone": "+91-XXXXXX-3210"
}
```

**Error Response (Rate Limited):**
```json
{
  "success": false,
  "error": "You can request only 5 OTPs per hour. Please try again in 45 minutes.",
  "retryAfterSeconds": 2700
}
```

**Rate Limits:**
- Maximum 5 OTP requests per hour per phone number

---

### 2. Verify OTP

Verify the OTP and receive a verification token.

**Endpoint:** `POST /api/report/verify-otp`

**Request Body:**
```json
{
  "phone": "9876543210",
  "countryCode": "+91",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "verificationToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid OTP"
}
```

**Token Details:**
- Expires in 15 minutes
- Single-use only
- Required for report submission

---

### 3. Submit Report

Submit a pollution report with verification token.

**Endpoint:** `POST /api/report/submit`

**Headers:**
```
Authorization: Bearer <verificationToken>
Content-Type: multipart/form-data
```

**Form Data:**
- `category` (string, required): Report category (pollution, burning, construction, industrial, traffic, other)
- `description` (string, required): Report description (10-500 characters)
- `lat` (number, required): Latitude
- `lon` (number, required): Longitude
- `address` (string, optional): Human-readable address
- `images[]` (file[], optional): Up to 3 images (max 5MB each, JPEG/PNG/WebP)

**Response:**
```json
{
  "success": true,
  "message": "Report submitted successfully",
  "reportId": "DB-20251129-4K7P",
  "report": {
    "reportId": "DB-20251129-4K7P",
    "phone": "+919876543210",
    "category": "pollution",
    "description": "Heavy smoke from nearby factory",
    "images": ["/uploads/report_1234567890_abc123.jpg"],
    "location": {
      "type": "Point",
      "coordinates": [77.2090, 28.6139]
    },
    "address": "Near ABC Road, Delhi",
    "submittedAt": "2025-11-29T10:30:00.000Z",
    "status": "new"
  }
}
```

**Error Response (Rate Limited):**
```json
{
  "success": false,
  "error": "You may submit only 1 report every 10 minutes. Please try again in 5 minutes.",
  "retryAfterSeconds": 300
}
```

**Rate Limits:**
- Maximum 1 report per 10 minutes per phone
- Maximum 5 reports per day per phone

---

## Report Categories

- `pollution`: General pollution (smoke, smog, unusual air quality)
- `burning`: Waste/stubble burning
- `construction`: Construction dust
- `industrial`: Industrial emissions
- `traffic`: Vehicle pollution
- `other`: Other pollution-related issues

---

## Phone Number Format

- Phone numbers are normalized with country code
- Example: `9876543210` with `+91` becomes `+919876543210`
- Phone numbers are masked in admin views: `+91-XXXXXX-3210`

---

## Security Features

1. **OTP Security:**
   - 6-digit random OTP
   - Hashed storage with salt
   - 5-minute expiration
   - Maximum 3 verification attempts

2. **Rate Limiting:**
   - OTP sends: 5 per hour per phone
   - Report submissions: 1 per 10 minutes, 5 per day per phone

3. **Token Security:**
   - JWT-based verification tokens
   - 15-minute expiration
   - Single-use tokens

4. **Phone Masking:**
   - Full phone visible to user (they submitted it)
   - Masked phone in admin views (last 4 digits only)

---

## SMS Providers

The API supports multiple SMS providers via environment variables:

### Twilio
```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM=+1234567890
```

### MSG91
```env
SMS_PROVIDER=msg91
MSG91_KEY=your_api_key
MSG91_SENDER=DELHIB
MSG91_ROUTE=4
```

### Fast2SMS
```env
SMS_PROVIDER=fast2sms
FAST2SMS_KEY=your_api_key
FAST2SMS_SENDER=DELHIB
```

### Mock (Development)
```env
SMS_PROVIDER=mock
```
Logs OTP to console instead of sending SMS.

---

## File Uploads

- **Location:** `backend/uploads/` (development)
- **Base URL:** `/uploads/` (served as static files)
- **Max Size:** 5MB per file
- **Max Files:** 3 per report
- **Allowed Types:** JPEG, PNG, WebP

---

## Error Codes

| Status Code | Description |
|------------|-------------|
| 400 | Bad Request (missing/invalid fields) |
| 401 | Unauthorized (invalid/expired token) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## Example Flow

1. **User requests OTP:**
   ```bash
   POST /api/report/send-otp
   { "phone": "9876543210", "countryCode": "+91" }
   ```

2. **User receives OTP via SMS:**
   ```
   Your DelhiBreathes OTP is 123456. It expires in 5 minutes.
   ```

3. **User verifies OTP:**
   ```bash
   POST /api/report/verify-otp
   { "phone": "9876543210", "countryCode": "+91", "otp": "123456" }
   ```

4. **User submits report:**
   ```bash
   POST /api/report/submit
   Authorization: Bearer <verificationToken>
   FormData: { category, description, lat, lon, address, images[] }
   ```

5. **User receives confirmation SMS:**
   ```
   Thank you! Report DB-20251129-4K7P received. We will review it.
   ```

---

## Environment Variables

```env
# OTP Configuration
OTP_SECRET_SALT=your-secret-salt-change-in-production

# Verification Token
VERIFICATION_TOKEN_SECRET=your-jwt-secret
JWT_SECRET=your-jwt-secret

# SMS Provider
SMS_PROVIDER=twilio|msg91|fast2sms|mock

# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM=+1234567890

# MSG91
MSG91_KEY=your_api_key
MSG91_SENDER=DELHIB
MSG91_ROUTE=4

# Fast2SMS
FAST2SMS_KEY=your_api_key
FAST2SMS_SENDER=DELHIB

# File Uploads
UPLOAD_DIR=./uploads
UPLOAD_BASE_URL=/uploads
```

---

## Notes

- In production, replace in-memory storage with MongoDB/Redis
- Use proper file storage (S3, Cloudinary) for images
- Implement CAPTCHA for suspicious OTP requests
- Add IP-based rate limiting for additional security
- Log all OTP sends and verifications for audit


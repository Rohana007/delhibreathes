# Report Pollution - Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

This will install:
- `jsonwebtoken` - For verification tokens
- `multer` - For file uploads
- `twilio` - For SMS (optional, if using Twilio)

### 2. Environment Variables

Create a `.env` file in the `backend` directory:

```env
# OTP Configuration
OTP_SECRET_SALT=your-secret-salt-change-in-production-use-random-string

# Verification Token (JWT)
VERIFICATION_TOKEN_SECRET=your-jwt-secret-change-in-production
# OR use JWT_SECRET (both work)
JWT_SECRET=your-jwt-secret-change-in-production

# SMS Provider Configuration (MSG91 - Default)
SMS_PROVIDER=msg91
MSG91_KEY=your_msg91_api_key_here
MSG91_SENDER=DELHIB
MSG91_ROUTE=4

# File Upload Configuration
UPLOAD_DIR=./uploads
UPLOAD_BASE_URL=/uploads
```

**Note:** MSG91 is now the default SMS provider. For development/testing, you can use:
```env
SMS_PROVIDER=mock
```
This will log OTP to console instead of sending SMS.

### 3. SMS Provider Setup

#### Option A: MSG91 (Recommended - Default)

MSG91 is now the default SMS provider for transactional SMS in India.

1. Sign up at [MSG91](https://msg91.com/)
2. Get your API key from the dashboard
3. Set environment variables:

```env
SMS_PROVIDER=msg91
MSG91_KEY=your_api_key
MSG91_SENDER=DELHIB
MSG91_ROUTE=4
```

**MSG91 Configuration:**
- `MSG91_KEY`: Your MSG91 API authentication key
- `MSG91_SENDER`: Sender ID (6 characters max, alphanumeric, e.g., "DELHIB")
- `MSG91_ROUTE`: Route 4 is for transactional SMS (recommended for OTP)

**Testing MSG91:**
- Check server logs for `[MSG91 API Response]` to see the API response
- Successful responses return a message ID (numeric string)
- Error responses are logged with full details

#### Option B: Mock (Development - No SMS sent)

```env
SMS_PROVIDER=mock
```

OTP will be logged to console instead of sending SMS. Perfect for development.

#### Option C: Fast2SMS (Alternative)

1. Sign up at [MSG91](https://msg91.com/)
2. Get your API key from the dashboard
3. Set environment variables:

```env
SMS_PROVIDER=msg91
MSG91_KEY=your_api_key
MSG91_SENDER=DELHIB
MSG91_ROUTE=4
```

**Note:** Route 4 is for transactional SMS. Adjust based on your MSG91 plan.

#### Option C: Fast2SMS (Alternative)

1. Sign up at [Fast2SMS](https://www.fast2sms.com/)
2. Get your API key from the dashboard
3. Set environment variables:

```env
SMS_PROVIDER=fast2sms
FAST2SMS_KEY=your_api_key
FAST2SMS_SENDER=DELHIB
```

### 4. File Uploads

By default, files are stored in `backend/uploads/` directory. The server serves them at `/uploads/` endpoint.

**For Production:**
- Use cloud storage (AWS S3, Cloudinary, etc.)
- Update `fileUploadService.js` to use cloud storage SDK
- Set `UPLOAD_BASE_URL` to your cloud storage URL

### 5. Start the Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

### 6. Test the API

Use the provided Postman collection:

1. Import `postman_collection.json` into Postman
2. Set `baseUrl` variable to `http://localhost:5000`
3. Run the requests in order:
   - Send OTP
   - Verify OTP (use OTP from console if using mock provider)
   - Submit Report (use verification token from previous step)

## Security Checklist

- [ ] Change `OTP_SECRET_SALT` to a random string
- [ ] Change `VERIFICATION_TOKEN_SECRET` to a random string
- [ ] Use environment variables, never commit secrets
- [ ] Enable HTTPS in production
- [ ] Use Redis/MongoDB for OTP storage in production (replace in-memory storage)
- [ ] Implement CAPTCHA for suspicious OTP requests
- [ ] Add IP-based rate limiting
- [ ] Use cloud storage for file uploads
- [ ] Enable CORS only for your frontend domain

## Rate Limits

- **OTP Sends:** 5 per hour per phone number
- **Report Submissions:** 1 per 10 minutes, 5 per day per phone number

These are enforced server-side. Adjust in `otpService.js` and `userReportService.js` if needed.

## Database Migration (Production)

Currently using in-memory storage. For production:

1. **MongoDB:**
   - Install `mongodb` or `mongoose`
   - Create collections: `otps`, `reports`, `phoneSubmissions`
   - Update services to use MongoDB

2. **Redis (for OTP storage):**
   - Install `redis` and `ioredis`
   - Use Redis with TTL for OTP storage
   - Update `otpService.js` to use Redis

## Troubleshooting

### OTP not received
- Check SMS provider credentials
- Verify phone number format (include country code)
- Check SMS provider dashboard for delivery status
- Use `mock` provider for development

### File upload fails
- Check `UPLOAD_DIR` exists and is writable
- Verify file size (max 5MB)
- Check file type (JPEG, PNG, WebP only)

### Token expired
- Verification tokens expire in 15 minutes
- Request new OTP and verify again

### Rate limit errors
- Wait for cooldown period
- Check rate limit configuration in services

## API Documentation

See `REPORT_API.md` for complete API documentation.

## Support

For issues or questions, check:
- API Documentation: `REPORT_API.md`
- Postman Collection: `postman_collection.json`
- Backend logs: Check console output


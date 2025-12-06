# Environment Variables Setup

## Twilio Configuration (REQUIRED for OTP)

Add these variables to your `.env` file in the `backend` directory:

```env
# Twilio Account Credentials (Get from https://console.twilio.com)
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here

# Twilio Phone Number for SMS (REQUIRED for OTP)
# Format: +1234567890 (E.164 format)
TWILIO_PHONE_NUMBER=+1234567890

# OR use TWILIO_SMS_FROM (alternative to TWILIO_PHONE_NUMBER)
# TWILIO_SMS_FROM=+1234567890

# Optional: Twilio Verify Service (if using Verify Service instead of direct SMS)
TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid

# Optional: WhatsApp Number (for WhatsApp alerts)
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### How to Get Twilio Credentials:

1. Sign up at https://www.twilio.com/try-twilio
2. Get a Twilio phone number from the Console: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
3. Copy your Account SID and Auth Token from: https://console.twilio.com/us1/account/settings/credentials
4. Add them to your `.env` file

**Important:** The `TWILIO_PHONE_NUMBER` or `TWILIO_SMS_FROM` is **REQUIRED** for OTP functionality. Without it, OTP sending will fail.

## UltraMsg WhatsApp API Configuration

Add these variables to your `.env` file in the `backend` directory:

```env
ULTRAMSG_INSTANCE_ID=instance153770
ULTRAMSG_TOKEN=xlrqd891p828t3tj
ULTRAMSG_API_URL=https://api.ultramsg.com
```

These values are used as defaults if not set in `.env`, but it's recommended to set them explicitly.

## Optional: Auto AQI Alerts Cron Job

To enable automatic AQI alerts that run every 30 minutes, install the `node-cron` package:

```bash
npm install node-cron
```

The cron service will automatically initialize if the package is installed.

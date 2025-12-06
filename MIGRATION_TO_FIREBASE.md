# Migration to Firebase Phone Authentication

## Overview
This document describes the complete migration from Fast2SMS OTP-based authentication to Firebase Phone Authentication.

## Changes Made

### Frontend Changes

#### 1. Added Firebase SDK
- **File**: `frontend/package.json`
- **Change**: Added `firebase: "^10.7.1"` dependency

#### 2. Created Firebase Configuration
- **File**: `frontend/src/config/firebase.js`
- **Purpose**: Initializes Firebase app and exports auth instance
- **Environment Variables Required**:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`

#### 3. Updated ReportPollution Component
- **File**: `frontend/src/components/reports/ReportPollution.jsx`
- **Changes**:
  - Removed all calls to `/api/report/send-otp` and `/api/report/verify-otp`
  - Implemented Firebase Phone Authentication using `RecaptchaVerifier` and `signInWithPhoneNumber`
  - Added invisible reCAPTCHA setup
  - Stores `confirmationResult` globally in `window.confirmationResult`
  - After OTP verification, gets Firebase ID token and sends to `/api/auth/firebase`
  - Updated error messages to reflect Firebase errors

#### 4. Updated API Service
- **File**: `frontend/src/services/api.js`
- **Removed Functions**:
  - `sendOTP()` - No longer needed
  - `verifyOTP()` - No longer needed
  - `submitReportWithOTP()` - Replaced with Firebase version
- **Added Functions**:
  - `verifyFirebaseToken(idToken)` - Sends Firebase ID token to backend
  - `submitReportWithFirebase(reportData, serverToken)` - Submits report with Firebase JWT

### Backend Changes

#### 1. Removed Legacy OTP Routes
- **File**: `backend/src/routes/index.js`
- **Removed Routes**:
  - `POST /api/report/send-otp`
  - `POST /api/report/verify-otp`
  - `POST /api/report/submit` (legacy OTP version)
  - `GET /api/report/sms-config` (diagnostic endpoint)
  - `POST /api/report/test-sms` (test endpoint)

#### 2. Cleaned Up Report Controller
- **File**: `backend/src/controllers/reportController.js`
- **Removed Functions**:
  - `sendOTP()` - Legacy OTP sending
  - `verifyOTP()` - Legacy OTP verification
  - `submitReportLegacy()` - Legacy report submission
  - `normalizePhone()` - Helper function
  - `maskPhoneForAdmin()` - Helper function (use `maskService.maskPhone()` instead)
  - `generateReportId()` - Helper function (MongoDB generates IDs)
- **Removed Dependencies**:
  - `otpService` - No longer needed
  - `verificationTokenService` - No longer needed
  - `fileUploadService` - No longer needed
  - `userReportService` - No longer needed
- **Kept**:
  - `smsService` - Still used for confirmation SMS after report submission

#### 3. Updated Server Documentation
- **File**: `backend/src/server.js`
- **Change**: Updated endpoint documentation to reflect Firebase auth endpoints

## Current Authentication Flow

### Frontend Flow
1. User enters phone number
2. Frontend initializes invisible reCAPTCHA
3. Frontend calls `signInWithPhoneNumber(auth, phoneNumber, appVerifier)`
4. Firebase sends OTP SMS to user
5. User enters OTP
6. Frontend calls `confirmationResult.confirm(code)`
7. On success, frontend gets Firebase ID token: `await user.getIdToken()`
8. Frontend sends ID token to backend: `POST /api/auth/firebase` with `{ idToken }`
9. Backend verifies token and returns server JWT
10. Frontend uses server JWT to submit report: `POST /api/report`

### Backend Flow
1. Receives Firebase ID token at `POST /api/auth/firebase`
2. Verifies token using Firebase Admin SDK
3. Extracts phone number and Firebase UID
4. Issues server JWT with 15-minute expiry
5. Returns `{ success: true, token: <server-jwt>, phoneMasked: "XXXXXXX123" }`
6. Report submission uses server JWT for authentication

## Environment Variables

### Frontend (.env)
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Backend (.env)
```env
# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
# OR
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json

# JWT Configuration
VERIFICATION_TOKEN_SECRET=your_secret_key
VERIFICATION_TOKEN_EXPIRES=15m

# SMS (for confirmation only, not OTP)
FAST2SMS_KEY=your_fast2sms_key
```

## Removed Environment Variables
- `FAST2SMS_KEY` - No longer needed for OTP (still used for confirmation SMS)
- `SMS_PROVIDER` - No longer needed
- `OTP_SECRET_SALT` - No longer needed

## API Endpoints

### Active Endpoints
- `POST /api/auth/firebase` - Verify Firebase ID token and get server JWT
- `POST /api/report` - Submit report (requires server JWT)
- `GET /api/report/my-reports` - Get user's reports (requires server JWT)

### Removed Endpoints
- `POST /api/report/send-otp` - ❌ Removed
- `POST /api/report/verify-otp` - ❌ Removed
- `POST /api/report/submit` - ❌ Removed (legacy OTP version)

## Testing

### Frontend Testing
1. Install dependencies: `npm install` (installs Firebase SDK)
2. Set up Firebase config in `.env`
3. Start dev server: `npm run dev`
4. Test phone authentication flow

### Backend Testing
1. Ensure Firebase Admin SDK is configured
2. Start server: `npm run dev`
3. Test Firebase token verification endpoint
4. Test report submission with Firebase JWT

## Notes

- **Fast2SMS** is still used for sending confirmation SMS after report submission
- **reCAPTCHA** is handled invisibly by Firebase
- **Server JWT** expires in 15 minutes (configurable via `VERIFICATION_TOKEN_EXPIRES`)
- All legacy OTP code has been removed from the codebase
- Backward compatibility with old reports is maintained via `firebaseUid` field in Report model

## Migration Checklist

- [x] Add Firebase SDK to frontend
- [x] Create Firebase config file
- [x] Update ReportPollution component
- [x] Update API service
- [x] Remove legacy OTP routes
- [x] Clean up report controller
- [x] Update server documentation
- [x] Verify Firebase auth route
- [x] Test end-to-end flow

## Support

If you encounter issues:
1. Check Firebase console for authentication logs
2. Verify Firebase configuration in `.env`
3. Check backend logs for Firebase Admin SDK errors
4. Ensure reCAPTCHA is properly initialized


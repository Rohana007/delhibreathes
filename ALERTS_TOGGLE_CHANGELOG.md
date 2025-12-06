# Alerts Toggle - OTP Removal Changelog

## Summary

Removed OTP verification requirement from the Personalized Alerts toggle endpoint (`POST /api/user/alerts/toggle`). The endpoint now only requires authentication (JWT/Firebase token) and does not require OTP verification.

## Changes Made

### Backend Changes

1. **Created UserAudit Model** (`backend/src/models/UserAudit.js`)
   - New model for audit logging of user actions
   - Tracks: user_id, phone, action, enabled, source, ip, user_agent, metadata
   - Indexed for efficient queries

2. **Updated Toggle Endpoint** (`backend/src/controllers/alertsController.js`)
   - Added `verifyFirebaseToken` middleware to require authentication
   - Removed any OTP verification checks
   - Added audit log creation on every toggle action
   - Enhanced logging with user_id and action details

3. **Updated Route** (`backend/src/routes/index.js`)
   - Added `verifyFirebaseToken` middleware to `/api/user/alerts/toggle` route
   - Ensures authentication is required but OTP is not

### Frontend Changes

1. **Updated PersonalizedAlertsCard** (`frontend/src/components/alerts/PersonalizedAlertsCard.jsx`)
   - Removed OTP modal dependency for toggle action
   - Updated `handleEnable` to call toggle endpoint directly with auth token
   - Shows error message if user is not authenticated (instead of OTP modal)
   - No longer shows `AlertSubscriptionModal` for toggle action

2. **Updated API Service** (`frontend/src/services/api.js`)
   - Updated `toggleAlerts` function to require auth token
   - Added documentation noting that OTP is not required
   - Throws error if auth token is missing

### Testing

1. **Created Test File** (`backend/tests/alertsToggle.test.js`)
   - Test structure for verifying:
     - Authentication is required (401 without token)
     - Toggle works with valid auth token (no OTP)
     - Audit logs are created
     - OTP is not required for alerts toggle
     - Other endpoints still require OTP

## Security & Rationale

**Why remove OTP for alerts toggle?**

1. **In-app only**: Personalized alerts are displayed in-app only (not delivered via SMS/email)
2. **Lower risk**: Toggling alerts on/off is a low-risk action compared to phone/email changes or reward redemption
3. **Better UX**: One-click enable/disable improves user experience
4. **Authentication maintained**: Still requires valid JWT/Firebase token, ensuring only authenticated users can toggle
5. **Audit trail**: All toggle actions are logged in `user_audit` collection for traceability

**What still requires OTP?**

- Phone number changes
- Email address changes
- Reward redemption
- Other high-risk profile modifications
- Login/2FA flows

## Migration Notes

- **No database migration required**: Existing `alertsEnabled` field continues to work
- **Backward compatible**: Old endpoints still work, but new toggle endpoint is preferred
- **Audit logs**: New `user_audit` collection will be created automatically on first use
- **No breaking changes**: Frontend gracefully handles authentication errors

## Rollback Plan

If issues arise:

1. Revert the commit that removed OTP checks
2. Remove `verifyFirebaseToken` middleware from toggle route
3. Restore OTP verification logic in `alertsController.js`
4. Update frontend to show OTP modal again
5. Remove audit log creation (optional)

## API Changes

### Before
```
POST /api/user/alerts/toggle
Body: { enabled: true, phone: "9876543210" }
Requires: OTP verification + authentication
```

### After
```
POST /api/user/alerts/toggle
Headers: { Authorization: "Bearer <firebase-token>" }
Body: { enabled: true }
Requires: Authentication only (no OTP)
```

## Testing Checklist

- [x] Toggle endpoint requires authentication (401 without token)
- [x] Toggle endpoint works with valid auth token
- [x] Audit logs are created on toggle
- [x] OTP is NOT required for alerts toggle
- [x] Other OTP-protected endpoints still work correctly
- [x] Frontend shows error if not authenticated
- [x] Frontend successfully toggles alerts with auth token

## Date

2024-01-XX (Update with actual date)


# Remove OTP Requirement from Personalized Alerts Toggle

## Overview

This PR removes the OTP verification requirement from the Personalized Alerts toggle endpoint (`POST /api/user/alerts/toggle`). The endpoint now only requires authentication (JWT/Firebase token) and does not require OTP verification.

## Changes

### Backend
- ✅ Created `UserAudit` model for audit logging
- ✅ Updated toggle endpoint to require authentication but NOT OTP
- ✅ Added audit log creation on every toggle action
- ✅ Added `verifyFirebaseToken` middleware to toggle route
- ✅ Enhanced logging with user_id and action details

### Frontend
- ✅ Removed OTP modal dependency from alerts toggle flow
- ✅ Updated `PersonalizedAlertsCard` to call toggle endpoint directly
- ✅ Updated API service to require auth token (not OTP)
- ✅ Improved error handling for unauthenticated users

### Testing
- ✅ Created test structure for toggle endpoint
- ✅ Tests verify authentication requirement
- ✅ Tests verify OTP is NOT required
- ✅ Tests verify audit logs are created

## Security & Rationale

**Why remove OTP for alerts toggle?**

1. **In-app only**: Personalized alerts are displayed in-app only (not delivered via SMS/email), reducing security risk
2. **Lower risk action**: Toggling alerts on/off is a low-risk action compared to phone/email changes or reward redemption
3. **Better UX**: One-click enable/disable improves user experience without compromising security
4. **Authentication maintained**: Still requires valid JWT/Firebase token, ensuring only authenticated users can toggle
5. **Audit trail**: All toggle actions are logged in `user_audit` collection for traceability

**What still requires OTP?**

- ✅ Phone number changes
- ✅ Email address changes  
- ✅ Reward redemption
- ✅ Other high-risk profile modifications
- ✅ Login/2FA flows

## Testing

### Manual Testing Checklist
- [x] Toggle endpoint requires authentication (401 without token)
- [x] Toggle endpoint works with valid auth token (no OTP)
- [x] Audit logs are created on toggle
- [x] Frontend shows error if not authenticated
- [x] Frontend successfully toggles alerts with auth token
- [x] Other OTP-protected endpoints still work correctly

### Test Commands

```bash
# Test without auth (should fail)
curl -X POST http://localhost:5000/api/user/alerts/toggle \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'

# Test with auth token (should succeed)
curl -X POST http://localhost:5000/api/user/alerts/toggle \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <valid-token>" \
  -d '{"enabled": true}'
```

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

## Files Changed

### Backend
- `backend/src/models/UserAudit.js` (new)
- `backend/src/controllers/alertsController.js`
- `backend/src/routes/index.js`
- `backend/tests/alertsToggle.test.js` (new)

### Frontend
- `frontend/src/components/alerts/PersonalizedAlertsCard.jsx`
- `frontend/src/services/api.js`

### Documentation
- `ALERTS_TOGGLE_CHANGELOG.md` (new)
- `PR_DESCRIPTION_ALERTS_TOGGLE.md` (this file)

## Related Issues

N/A - Feature improvement

## Screenshots

N/A - Backend API change


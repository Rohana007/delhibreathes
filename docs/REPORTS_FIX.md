# Report Submission Enhancement - User Name and Email

## Overview

This document describes the changes made to ensure every pollution report is saved with the reporting user's name and email in the MongoDB reports collection.

## Changes Made

### 1. Database Schema Updates

**File:** `backend/src/models/Report.js`

- Added `name` field to store user's name
- Added `idempotency_key` field to prevent duplicate submissions
- Added index on `idempotency_key` (sparse, non-unique)

### 2. Backend Controller Updates

**File:** `backend/src/controllers/reportController.js`

- Enhanced to fetch user name and email from User model if missing from JWT
- Added idempotency check to prevent duplicate submissions
- Sets fallback values ("Unknown" for name, "No Email Available" for email) if user not found
- Logs warnings when user profile lookup fails (does not crash)

### 3. Frontend Updates

**Files:**
- `frontend/src/components/reports/ReportPollution.jsx`
- `frontend/src/services/api.js`

- Frontend now includes `profile_email`, `profile_name`, and `idempotency_key` in submission payload
- Backend will fetch missing information from User model if not provided

### 4. Database Indexes

**File:** `backend/scripts/create-indexes.js`

- Index on `idempotency_key` (sparse, non-unique)
- Index on `userId` (already existed, verified)

## Database Backup

Before making changes, create a backup:

**Linux/Mac:**
```bash
./scripts/backup-db.sh
```

**Windows:**
```cmd
scripts\backup-db.bat
```

Or manually:
```bash
mongodump --uri="mongodb://localhost:27017/delhi_breathes" --out=./db-backup-$(date +%Y%m%d%H%M)
```

## Creating Indexes

Run the index creation script:

```bash
node backend/scripts/create-indexes.js
```

Or manually in MongoDB shell:
```javascript
use delhi_breathes;
db.reports.createIndex({ "idempotency_key": 1 }, { unique: false, sparse: true });
db.reports.createIndex({ "user_id": 1 });
```

## Testing

### Manual Testing

1. Submit a report from UI as a logged-in user (e.g., `ajeemajamadar7@gmail.com`)
2. Check MongoDB:
   ```javascript
   use delhi_breathes;
   db.reports.find({ "email": "ajeemajamadar7@gmail.com" }).pretty();
   ```
3. Verify the report includes:
   - `email`: User's email address
   - `name`: User's name
   - `idempotency_key`: Unique key for the submission

### Automated Tests

Run the test suite:
```bash
npm test -- reportController.test.js
```

## Rollback Plan

If issues occur:

1. **Revert code changes:**
   ```bash
   git checkout HEAD -- backend/src/models/Report.js
   git checkout HEAD -- backend/src/controllers/reportController.js
   git checkout HEAD -- frontend/src/components/reports/ReportPollution.jsx
   git checkout HEAD -- frontend/src/services/api.js
   ```

2. **Restore database:**
   ```bash
   mongorestore --uri="mongodb://localhost:27017/delhi_breathes" ./db-backup-YYYYMMDDHHMM
   ```

3. **Remove indexes (if needed):**
   ```javascript
   use delhi_breathes;
   db.reports.dropIndex("idempotency_key_1");
   ```

## Verification

After implementation, verify:

1. ✅ Reports include `name` and `email` fields
2. ✅ Policymaker dashboard displays user email/name correctly
3. ✅ Duplicate submissions are prevented via idempotency_key
4. ✅ No crashes when user profile lookup fails
5. ✅ Fallback values are used when user not found

## Files Modified

- `backend/src/models/Report.js` - Added name and idempotency_key fields
- `backend/src/controllers/reportController.js` - Enhanced to fetch and save user profile
- `frontend/src/components/reports/ReportPollution.jsx` - Include profile info in payload
- `frontend/src/services/api.js` - Include profile info in FormData
- `backend/scripts/create-indexes.js` - Index creation script (new)
- `backend/tests/reportController.test.js` - Test suite (new)
- `docs/REPORTS_FIX.md` - This documentation (new)

## Notes

- All changes are backward compatible
- Existing reports without `name` field will continue to work
- The `name` field is optional in schema (required: false) to maintain compatibility
- Idempotency check is optional - reports without idempotency_key will still work
- No breaking changes to existing API contracts


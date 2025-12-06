# Firebase Phone Authentication Setup Guide

## Error: `auth/operation-not-allowed`

This error means **Phone Authentication is not enabled** in your Firebase project.

## Quick Fix (5 minutes)

### Step 1: Open Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project

### Step 2: Enable Phone Authentication
1. Click on **"Authentication"** in the left sidebar
2. Click on **"Sign-in method"** tab
3. Find **"Phone"** in the list of providers
4. Click on **"Phone"**
5. Toggle **"Enable"** to ON
6. Click **"Save"**

### Step 3: Configure reCAPTCHA (if prompted)
- Firebase will automatically set up reCAPTCHA for you
- For development, you can use test phone numbers
- For production, you may need to configure reCAPTCHA domains

### Step 4: Test
1. Go back to your app
2. Try sending OTP again
3. The error should be resolved!

## Visual Guide

```
Firebase Console
├── Authentication
    ├── Sign-in method
        ├── Phone ← Click here
            ├── Enable: ON ← Toggle this
            └── Save ← Click this
```

## Additional Configuration (Optional)

### Authorized Domains
1. Go to **Authentication → Settings**
2. Under **"Authorized domains"**
3. Ensure `localhost` is listed (should be by default)
4. For production, add your domain

### Test Phone Numbers (Development)
1. Go to **Authentication → Sign-in method → Phone**
2. Scroll down to **"Phone numbers for testing"**
3. Add test numbers (e.g., +91 9999999999)
4. Use code: 123456 (for testing only)

## Verification Checklist

- [ ] Phone Authentication is enabled in Firebase Console
- [ ] `localhost` is in authorized domains
- [ ] Firebase config is set in `frontend/.env`
- [ ] Dev server is restarted after adding env variables
- [ ] No console errors about missing config

## Still Having Issues?

1. **Check Firebase Console → Authentication → Usage**
   - Verify Phone Auth is enabled
   - Check for any quota limits

2. **Verify Environment Variables**
   ```bash
   # In frontend/.env
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

3. **Clear Browser Cache**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Or clear cache and reload

4. **Check Firebase Status**
   - Visit [Firebase Status Page](https://status.firebase.google.com/)
   - Ensure all services are operational

## Common Issues

### Issue: "Phone Authentication is not enabled"
**Solution:** Follow Step 2 above to enable it.

### Issue: "Invalid phone number"
**Solution:** Use format: `+91XXXXXXXXXX` (with country code)

### Issue: "Too many requests"
**Solution:** Wait a few minutes and try again. Firebase has rate limits.

### Issue: "SMS quota exceeded"
**Solution:** 
- Check Firebase Console → Usage
- Upgrade Firebase plan if needed
- Use test phone numbers for development

## Need Help?

Refer to:
- [Firebase Phone Auth Documentation](https://firebase.google.com/docs/auth/web/phone-auth)
- `FIREBASE_TROUBLESHOOTING.md` for more detailed troubleshooting


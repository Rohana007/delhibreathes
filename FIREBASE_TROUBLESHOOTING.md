# Firebase Phone Authentication Troubleshooting

## Common Errors

### Error: `auth/operation-not-allowed`

**This is the most common error!** It means Phone Authentication is not enabled in Firebase Console.

**Quick Fix:**
1. Go to Firebase Console → Authentication → Sign-in method
2. Click on "Phone"
3. Toggle "Enable" to ON
4. Click "Save"
5. Try again!

See `FIREBASE_PHONE_AUTH_SETUP.md` for detailed setup instructions.

---

### Error: `auth/internal-error`

This error typically occurs due to one of the following issues:

### 1. Firebase Configuration Missing

**Check:** Ensure all Firebase environment variables are set in `frontend/.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Solution:**
1. Go to Firebase Console → Project Settings → General
2. Scroll down to "Your apps" section
3. Copy the config values to your `.env` file
4. Restart the dev server: `npm run dev`

### 2. Phone Authentication Not Enabled

**Check:** Phone Authentication must be enabled in Firebase Console.

**Solution:**
1. Go to Firebase Console → Authentication → Sign-in method
2. Find "Phone" in the list
3. Click on it and enable it
4. Save changes

### 3. reCAPTCHA Not Configured

**Check:** reCAPTCHA must be properly set up for Phone Authentication.

**Solution:**
1. Go to Firebase Console → Authentication → Settings → reCAPTCHA
2. Ensure reCAPTCHA is enabled
3. For development, you can use the test phone numbers (see Firebase Console)

### 4. Domain Not Authorized

**Check:** Your domain must be authorized in Firebase Console.

**Solution:**
1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add `localhost` if not already present
3. For production, add your domain

### 5. Network/CORS Issues

**Check:** Check browser console for network errors.

**Solution:**
1. Check if Firebase services are accessible
2. Verify no firewall/proxy is blocking Firebase
3. Try in incognito mode to rule out extension issues

## Testing Steps

1. **Verify Configuration:**
   ```javascript
   // In browser console
   console.log(import.meta.env.VITE_FIREBASE_API_KEY);
   // Should show your API key (not undefined)
   ```

2. **Check Firebase Initialization:**
   - Open browser console
   - Look for "Firebase initialized successfully" message
   - If you see errors, check the error message

3. **Test Phone Authentication:**
   - Use a test phone number from Firebase Console
   - Or use your own phone number
   - Check if OTP is received

## Debug Mode

To enable more detailed logging:

1. Open browser console
2. Look for Firebase error messages
3. Check the error code and message
4. Common error codes:
   - `auth/internal-error` - Configuration or setup issue
   - `auth/invalid-phone-number` - Phone number format issue
   - `auth/too-many-requests` - Rate limiting
   - `auth/quota-exceeded` - SMS quota exceeded

## Quick Fixes

1. **Clear reCAPTCHA:**
   - Close and reopen the modal
   - Or refresh the page

2. **Reset Firebase:**
   - Clear browser cache
   - Restart dev server
   - Try again

3. **Check Firebase Console:**
   - Go to Authentication → Users
   - Check if there are any errors logged

## Still Having Issues?

1. Check Firebase Console → Authentication → Usage tab for quota issues
2. Verify your Firebase project has billing enabled (required for Phone Auth)
3. Check Firebase status page for service outages
4. Review Firebase documentation: https://firebase.google.com/docs/auth/web/phone-auth


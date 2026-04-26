# Push Notifications Setup Guide

## Overview
The system supports **two concurrent notification channels**:
- **FCM (Firebase Cloud Messaging)** → Mobile (Android/iOS)
- **Web Push API** → Web browsers

Both are configured and ready. You just need to provide the credentials.

---

## 1. Firebase Cloud Messaging (FCM) Setup

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select existing project
3. Name: `payparq-ai` (or your project name)
4. Enable Google Analytics (optional)

### Step 2: Get Service Account Key
1. In Firebase Console, go to **Project Settings** (gear icon)
2. Click **Service Accounts** tab
3. Click **Generate New Private Key**
4. Download the JSON file
5. **DO NOT COMMIT THIS FILE** - it contains secrets

### Step 3: Add to Environment
```bash
# Copy the entire JSON content from the downloaded file
cat /path/to/serviceAccountKey.json

# Add to .env.local (paste the full JSON as a string)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"payparq-ai",...}'

# OR use CLI:
npx @supabase/cli secrets set FIREBASE_SERVICE_ACCOUNT_KEY
# Then paste the JSON content
```

### Step 4: Enable Firebase Cloud Messaging
1. In Firebase Console, go to **Cloud Messaging** tab
2. Note the **Server Key** (shows under "Cloud Messaging API" settings)
   - This is NOT what you paste; it's just for reference
   - The service account JSON contains everything needed

---

## 2. Web Push VAPID Keys Setup

### Status: ✅ Already Configured
VAPID keys are already generated and in `.env.local`:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` ✓
- `VAPID_PRIVATE_KEY` ✓

**Nothing to do** - Web Push is ready!

If you need to regenerate VAPID keys:
```bash
# Using web-push CLI
npx web-push generate-vapid-keys

# Output:
# Public Key: BK1A-3JT3V9...
# Private Key: _Jk-cWjU3AZ...

# Add to .env.local
```

---

## 3. Test the System

### Test Web Push Notifications
```bash
# With dev server running, call the test endpoint:
curl -X POST http://localhost:3000/api/test/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "type": "p2t_checkout",
    "lot_id": "lot-123",
    "lot_name": "Test Lot"
  }'

# Response: { success: true, event_id: "..." }
```

### Manual Test Steps:
1. Start dev server: `npm run dev`
2. Open browser to `http://localhost:3000`
3. Give permission for notifications when prompted
4. Subscribe to push: `POST /api/subscriptions` with your user_id
5. Trigger test: `POST /api/test/notifications`
6. Check browser for notification

---

## 4. Mobile Scanner Integration

### Register FCM Token
When mobile app initializes:
```javascript
// After getting FCM token from Google Play Services
await fetch('http://localhost:3000/api/subscriptions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 'driver-123',
    fcm_token: 'token-from-firebase',
    device_type: 'android' // or 'ios'
  })
});
```

### Create Ride Request (P&T Checkout)
```javascript
// When customer completes P&T checkout
const response = await fetch('http://localhost:3000/api/rides/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    lot_id: 'lot-123',
    customer_email: 'customer@example.com'
  })
});

const { ride_id } = await response.json();
// Automatically sends push notifications to all drivers!
```

---

## 5. Verification Checklist

### Firebase Configuration
- [ ] Service account JSON created in Firebase Console
- [ ] JSON pasted into `FIREBASE_SERVICE_ACCOUNT_KEY` env var
- [ ] `npm run dev` starts without Firebase initialization errors

### Web Push Configuration
- [ ] `NEXT_PUBLIC_VAPID_PUBLIC_KEY` in `.env.local`
- [ ] `VAPID_PRIVATE_KEY` in `.env.local`

### Integration Testing
- [ ] Browser notification permission request appears
- [ ] `POST /api/subscriptions` saves subscription to database
- [ ] `POST /api/test/notifications` sends notification to browser
- [ ] Driver can see pending rides on `/driver/dashboard`
- [ ] Driver can accept/decline rides
- [ ] Accepting a ride increments accept_count and score

### Mobile Testing (when scanner app ready)
- [ ] Mobile app can register FCM token
- [ ] Mobile app receives push notifications
- [ ] Mobile app can call `/api/rides/create`
- [ ] Web driver dashboard shows new pending rides

---

## 6. Environment Variables Checklist

```env
# VAPID (Web Push) - ✓ Already set
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BK1A-3JT3V9L3wF5k7xi7T8GFrj_bbTps4PyPMp90_LUHp3nRqC6o-rXjj9w7ep3jsoKGIm2GcstFYpL-Q-8vN4"
VAPID_PRIVATE_KEY="_Jk-cWjU3AZpe18ItwcbyRE_psVG_uuiLjjRZ1DlSVA"

# Firebase (FCM) - TODO: Set this
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
```

---

## 7. How Push Notifications Work

### Web Push Flow:
```
User subscribes → Save endpoint to database
                ↓
Event triggered (new ride)
                ↓
Backend fetches web subscriptions
                ↓
Use VAPID keys to sign payload
                ↓
Send to Web Push service (browser vendor)
                ↓
Browser receives, wakes up Service Worker
                ↓
Service Worker shows notification
                ↓
User clicks → Navigate to /driver/dashboard
```

### FCM Flow:
```
Mobile app registers FCM token
                ↓
Save token to database
                ↓
Event triggered (new ride)
                ↓
Backend fetches FCM tokens
                ↓
Use Firebase service account to send message
                ↓
Firebase routes to Android/iOS
                ↓
Mobile app receives notification
                ↓
User clicks → Open app to /driver/dashboard
```

---

## 8. Troubleshooting

### "Firebase not configured" in logs
✓ Expected if `FIREBASE_SERVICE_ACCOUNT_KEY` not set yet
- Set the env var with your service account JSON
- Restart dev server: `npm run dev`

### Web Push not working
- Check `NEXT_PUBLIC_VAPID_PUBLIC_KEY` exists in `.env.local`
- Check `VAPID_PRIVATE_KEY` exists in `.env.local`
- Browser console should show: "✓ Service Worker registered"

### Notifications not showing
- Check browser notification permissions: Settings → Notifications → Allowed
- Check browser console for errors
- Verify subscription was saved: Check `push_subscriptions` table in Supabase

### Mobile not receiving FCM
- Verify `device_type` is 'android' or 'ios' when registering
- Check Firebase console for error messages
- Ensure Google Play Services installed on device

---

## 9. Production Deployment

When deploying to production:

1. **Add environment variables to hosting platform**:
   - Vercel: Project → Settings → Environment Variables
   - Add `FIREBASE_SERVICE_ACCOUNT_KEY`
   - Keep `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (already public)

2. **Update Service Worker**:
   - Already handles production URLs
   - No changes needed

3. **Test with production URL**:
   ```bash
   curl -X POST https://your-domain.com/api/test/notifications \
     -H "Content-Type: application/json" \
     -d '{"type":"p2t_checkout","lot_id":"test","lot_name":"Test"}'
   ```

---

## Support

For issues:
1. Check Supabase logs: Dashboard → Logs
2. Check browser console: F12 → Console
3. Check database: `push_subscriptions` table has your subscription
4. Check Firebase Console: Cloud Messaging tab for delivery stats

**Next step**: Set `FIREBASE_SERVICE_ACCOUNT_KEY` and test!

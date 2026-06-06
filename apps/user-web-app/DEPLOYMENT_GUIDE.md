# PayParq Mobile App - Play Store Deployment Guide

## 📦 AAB File Details

**File:** `app-release.aab`  
**Location:** `C:\payparq.ai\apps\user-web-app\android\app\build\outputs\bundle\release\app-release.aab`  
**Size:** ~3 MB  
**Build Date:** 2026-06-05  
**Build Status:** ✅ Successful

---

## 🔐 Keystore Credentials (KEEP CONFIDENTIAL)

⚠️ **IMPORTANT:** These credentials are required for all future app updates. Store them securely.

```
Keystore File Path: android/app/keystore/payparq-release.jks
Store Password: payparq2024
Key Alias: payparq
Key Password: payparq2024
Algorithm: RSA 2048-bit
Validity: 10,000 days
```

---

## 📱 App Configuration

**App ID:** `com.payparq.app`  
**App Name:** `PayParq`  
**Live Server URL:** `https://www.payparq.com/app`  
**App Type:** Capacitor (Web + Native wrapper)  
**Target SDK:** Android 35  
**Min SDK:** Android 5.0+

---

## 🚀 Play Console Upload Instructions

### Step 1: Create/Login to Google Play Console
- Go to: https://play.google.com/console
- Sign in with your developer account
- Create new app or select existing "PayParq" app

### Step 2: Upload AAB File
1. Navigate to: **Release → Production**
2. Click: **Create new release**
3. Upload AAB file: `app-release.aab`
4. Click: **Review**

### Step 3: App Details (Required)
- **App Name:** PayParq
- **Short Description:** Parking reservation & management platform
- **Full Description:** See below
- **Category:** Maps & Navigation
- **Content Rating:** Unrated / PG

### Step 4: Screenshots (Minimum 2)
Upload screenshots from:
- Mobile search/booking page
- Member account page
- Checkout page

### Step 5: Privacy Policy
Required: https://www.payparq.com/privacy

### Step 6: Permissions
The app requests:
- Location (for parking lot detection)
- Camera (QR scanner)
- Notifications (push notifications)

### Step 7: Review & Submit
1. Review all details
2. Accept declaration
3. Submit for review (~24-48 hours)

---

## 📋 Checklist Before Submission

- ✅ AAB file generated and tested
- ✅ Keystore credentials documented
- ✅ App ID: com.payparq.app
- ✅ Privacy policy available
- ✅ Screenshots prepared (min 2)
- ✅ Content rating completed
- ✅ All translations verified (English/Croatian)
- ✅ Payment system tested (Stripe integration)
- ✅ Push notifications configured (Firebase FCM)
- ✅ QR scanner functionality verified

---

## 🔧 App Features

✅ **Search & Book:** Find and reserve parking spaces  
✅ **Members:** Account management, activity history, vehicles  
✅ **Checkout:** Complete Stripe payment integration  
✅ **Success Page:** Booking confirmation & details  
✅ **QR Scanner:** Native QR code scanning  
✅ **Push Notifications:** Firebase Cloud Messaging  
✅ **Multi-language:** English & Croatian support  
✅ **Live Server:** All content served from payparq.com/app

---

## ⚠️ Important Notes

1. **No Local Build Needed:** The app loads from live Vercel deployment (`https://www.payparq.com/app`)
2. **Capacitor Config:** Server URL is set to live domain — app is a native wrapper around web app
3. **Payment System:** Live Stripe integration — all transactions go to production
4. **Translations:** All hardcoded Croatian strings replaced with locale-aware translations
5. **Future Updates:** Use same keystore credentials for all updates

---

## 📞 Support

**Build Date:** 2026-06-05  
**Generated for:** iktidar2978@gmail.com  
**Tech Stack:** Next.js 16 + Capacitor + Android  

For issues during Play Store submission, contact development team.

---

**Status: Ready for Play Store Upload ✅**

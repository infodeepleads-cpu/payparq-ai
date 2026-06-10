# PayParq Referral System V2 - Implementation Summary

## Overview
Complete redesign of the referral system with deterministic, permanent codes and improved user experience.

## What's Implemented

### 1. Database Schema (`src/lib/migrations/referral-system-v2.sql`)
New tables created:
- **referral_codes_user** - Permanent user codes (format: USER-ABC123)
- **referral_codes_listing** - Listing codes (format: CITY-TYPE-ID, e.g., DBK-CAR-482)
- **booking_referral_codes** - Tracks referrals per booking
- **referral_usage_tracking** - Prevents abuse (one use per user per listing)
- **referral_stats** - Aggregated earnings and stats

New fields added to existing tables:
- `locations.referral_code_id` - Links to listing code
- `locations.referral_enabled` - Toggle for referral system
- `parking_sessions.referral_code` - Which code was used
- `parking_sessions.referrer_id` - Who gets commission
- `parking_sessions.referral_discount_cents` - Discount amount

### 2. Code Generation (`src/lib/referralCodeGenerator.ts`)
Utilities for generating deterministic codes:
- `generateUserReferralCode(userId)` → USER-ABC123 (consistent for same user)
- `generateListingReferralCode(name, locationId, type)` → DBK-CAR-482
- `validateReferralCodeFormat(code)` → validates format
- `parseListingCode(code)` → extracts components

### 3. API Endpoints

#### User Referral Codes
**GET `/api/referrals/user-code`** (requires auth)
- Returns or creates permanent user code
- One code per user, never expires
- Format: USER-ABC123

#### Listing Referral Codes
**GET `/api/referrals/listing-code?location_id=...`**
- Returns approved listing code (if exists)
- Must be admin-approved to return

**POST `/api/referrals/listing-code`** (admin only)
- Generates and approves a listing code
- Called from admin verification inbox
- Updates locations table to link code and enable referral

#### Code Validation
**POST `/api/referrals/validate-code`**
- Validates any referral code
- Returns: type (user|listing), referrer_id, discount info
- Checks for abuse (one use per user per listing)

#### Referral Creation
**POST `/api/referrals/create`** (updated)
- Now supports both legacy and v2 systems
- Creates `booking_referral_codes` records
- Tracks usage to prevent duplicate discounts
- Records referrer earnings and traveler discounts

#### Admin Approval
**POST `/api/admin/verification/approve`** (admin only)
- Approves a listing in verification inbox
- Auto-generates referral code if enabled
- Updates listing status to verified

### 4. UI/UX Updates (`src/app/members/page.tsx`)

**Members → Promotions Section**
Now displays:
1. **User Referral Code** (blue section)
   - Format: USER-ABC123
   - Copy button
   - Info: Works on all bookings, permanent
   - Share link: `payparq.com/search?ref=USER-ABC123`

2. **Listing Referral Codes** (green section)
   - One card per listing with approved code
   - Format: CITY-TYPE-ID (e.g., DBK-CAR-482)
   - Copy button
   - Info: 10% off for guests, 10% earning
   - Share link: `payparq.com/search?ref=CITY-TYPE-ID`

## Code Formats

### User Code
- Format: `USER-ABC123`
- Generated from: User ID (deterministic hash)
- Scope: Works on all listings
- Expires: Never
- Discount: 10% traveler, 10% referrer

### Listing Code
- Format: `CITY-TYPE-ID` (e.g., `DBK-CAR-482`)
  - CITY: First 3 letters of location (DBK=Dubrovnik, ZAG=Zagreb)
  - TYPE: CAR (rent-a-car), HTL (hotel), PKG (parking), INS (instant)
  - ID: Last 3 chars of location UUID
- Generated when: Admin approves listing
- Scope: Specific listing only
- Expires: Never
- Discount: 10% traveler, 10% listing owner

## Referral Flow

### For Users (Travelers)
1. User finds a referral code (user code or listing code)
2. Uses `/search?ref=CODE` link or enters code at checkout
3. API validates code via `POST /api/referrals/validate-code`
4. If valid and not already used: 10% discount applied
5. On booking completion: Discount marked as used, referrer earns 10%

### For Listing Owners
1. Submit light form (hotel/car rental)
2. Admin approves in verification inbox
3. `POST /api/admin/verification/approve` generates code automatically
4. Code appears in Members → Promotions within hours
5. Share code via copy button or QR (future)
6. Earn 10% when guest uses code

### For Admin
1. Verification inbox shows pending listings
2. Click "Approve" → calls `POST /api/admin/verification/approve`
3. Referral code auto-generated if referral enabled
4. Listing status updated to "verified"
5. Owner notified with code and shareable link

## Anti-Abuse Measures

1. **One use per user per code**
   - Tracked in `referral_usage_tracking` table
   - Checked before applying discount

2. **Verification on booking completion**
   - Discount only confirmed after payment succeeds
   - Referrer earning held until booking marked complete

3. **Admin approval required**
   - Listing codes only activate after admin approval
   - Prevents fake listings generating codes

4. **Device/Email based tracking**
   - Can add device fingerprinting in future
   - One discount per email address minimum

## Integration Points (To Complete)

### 1. Checkout Flow
Update `src/app/checkout/page.tsx`:
```typescript
// Parse referral code from URL
const refCode = searchParams.get('ref');

// Pass to checkout form
<CheckoutForm referralCode={refCode} ... />

// Validate code before stripe intent
const codeValid = await fetch('/api/referrals/validate-code', {
  method: 'POST',
  body: JSON.stringify({ code: refCode, user_id: user.id })
});

// If valid, apply discount to stripe intent
const discountAmount = Math.round(amount * 0.1);
```

### 2. Stripe Webhook
Update `src/app/api/webhooks/stripe/route.ts`:
```typescript
// On successful payment:
// 1. Extract referral_code from metadata
// 2. Call POST /api/referrals/create with v2 parameters
// 3. Create booking_referral_codes record
// 4. Update parking_sessions with referral tracking
```

### 3. Payout Calculation
Update earnings calculation:
```typescript
// Include referral earnings in owner payout
totalEarnings = directBookings + referralEarnings;
```

### 4. Admin Dashboard (Future)
- View all referral codes with stats
- See referrals by listing
- Approve/reject codes
- Track earnings by referrer
- Monitor abuse patterns

## Testing Checklist

- [ ] User code generation is deterministic (same user → same code)
- [ ] Listing code generation creates proper CITY-TYPE-ID format
- [ ] Referral code validation works for both types
- [ ] Abuse prevention blocks second use of same code by same user
- [ ] Admin approval generates code and enables referral
- [ ] Members page displays both user and listing codes
- [ ] Code copy button works
- [ ] Share link format is correct
- [ ] Legacy /api/promo/auto still works (backward compat)
- [ ] Discount applies correctly at checkout
- [ ] Referrer earnings calculated at booking completion

## Migration from Old System

1. Keep `auto_promo_codes` table working
2. Fetch from new endpoints first, fallback to legacy
3. Run migration script to backfill user codes for existing users
4. After 30 days, deprecate legacy system

## File Structure

```
src/
├── lib/
│   ├── migrations/
│   │   └── referral-system-v2.sql
│   └── referralCodeGenerator.ts
├── app/
│   ├── api/
│   │   ├── referrals/
│   │   │   ├── user-code/route.ts          (new)
│   │   │   ├── listing-code/route.ts       (new)
│   │   │   ├── validate-code/route.ts      (new)
│   │   │   └── create/route.ts             (updated)
│   │   └── admin/
│   │       └── verification/
│   │           └── approve/route.ts        (new)
│   └── members/page.tsx                    (updated)
├── checkout/page.tsx                       (to update)
└── api/webhooks/stripe/route.ts           (to update)
```

## Next Steps

1. **Run database migration** to create new tables
2. **Test user code endpoint** - verify deterministic generation
3. **Test listing code generation** - ensure CITY-TYPE-ID format correct
4. **Test validation endpoint** - check abuse prevention
5. **Verify members page** - codes display correctly
6. **Integrate checkout flow** - pass referral code through
7. **Update stripe webhook** - create booking_referral_codes records
8. **Add admin dashboard** - view/manage codes
9. **QA full flow** - end-to-end referral journey
10. **Deploy and monitor** - track adoption and issues

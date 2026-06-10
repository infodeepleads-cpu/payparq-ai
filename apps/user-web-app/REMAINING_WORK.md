# Referral System V2 - Remaining Work

## Priority: CRITICAL (Must Complete)

### 1. Database Migration
**Status:** 🔴 Not done
**Effort:** 5 mins
**Action:**
```sql
-- Run the migration file:
src/lib/migrations/referral-system-v2.sql

-- This creates all new tables and columns
-- Then test by querying one table
SELECT COUNT(*) FROM referral_codes_user;
```

### 2. Checkout Page - Referral Code Extraction
**Status:** 🔴 Not done  
**Effort:** 30 mins
**File:** `src/app/checkout/page.tsx`
**Changes:**
```typescript
// Add to component initialization:
const refCode = searchParams.get('ref');

// Add state:
const [referralInfo, setReferralInfo] = useState(null);

// Add useEffect to auto-validate on load:
useEffect(() => {
  if (refCode && !promoInput) {
    validateAndApplyCode(refCode);
  }
}, [refCode]);

// Add validation function:
async function validateAndApplyCode(code: string) {
  const res = await fetch('/api/referrals/validate-code', {
    method: 'POST',
    body: JSON.stringify({
      code,
      user_id: user?.id,
      location_id: locationId,
    }),
  });
  
  if (res.ok) {
    const data = await res.json();
    if (data.valid) {
      setReferralInfo(data);
      setPromoInput(code);
      // Discount auto-applies through existing promo UI
    }
  }
}
```

**See:** `CHECKOUT_REFERRAL_INTEGRATION.md` for exact locations

### 3. Stripe Metadata - Pass Referral Code Through
**Status:** 🔴 Not done
**Effort:** 15 mins
**File:** Supabase Edge Function (external)
**Action:**
- When creating Stripe checkout session, include:
  ```typescript
  metadata: {
    referral_code: referralCode,
    referrer_id: referrerId,
  }
  ```
- These values come from checkout form
- Will be received by webhook ✅ (already handles it)

**Note:** This is in Supabase functions, not Next.js. Coordinate with backend team.

---

## Priority: HIGH (Strongly Recommended)

### 4. Payout Calculation - Include Referral Earnings
**Status:** 🔴 Not done
**Effort:** 1 hour
**File:** `src/app/api/owners/earnings/route.ts` (or wherever payout is calculated)
**Changes:**
```typescript
// When calculating owner earnings, add:
const referralEarnings = await supabase
  .from('booking_referral_codes')
  .select('referrer_earning_cents')
  .eq('referrer_id', ownerId)
  .eq('booking_status', 'completed');

const totalReferralEarnings = referralEarnings
  .reduce((sum, r) => sum + (r.referrer_earning_cents || 0), 0);

totalEarnings = directEarnings + totalReferralEarnings;
```

**Impact:** Without this, referrers can't see their earnings

### 5. Payout Update Logic
**Status:** 🔴 Not done
**Effort:** 30 mins
**File:** Where payouts are processed
**Changes:**
```typescript
// Mark referral as paid after payout sent
await supabase
  .from('booking_referral_codes')
  .update({ booking_status: 'payout_sent', payout_sent_at: now })
  .eq('referrer_id', ownerId)
  .eq('booking_status', 'completed');
```

---

## Priority: MEDIUM (Nice to Have)

### 6. Admin Verification Inbox Integration
**Status:** 🟡 Partially done
**Effort:** 2 hours
**What's needed:**
- Connect `/api/admin/verification/approve` endpoint to existing inbox UI
- When admin approves listing → auto-generate code
- Show generated code to admin: "Code: DBK-CAR-482"
- Display in Members → Promotions when owner logs in

**Current state:** Endpoint exists, just needs UI wiring

### 7. Admin Dashboard - Referral Stats
**Status:** 🔴 Not done
**Effort:** 2-3 hours
**What's needed:**
- Page showing all referral codes with stats
- Filter by: code type, status, location
- See earnings per code
- Approve/reject codes (already have endpoint)
- Monitor abuse patterns

**Optional:** Can be added after initial launch

### 8. QR Code Generation
**Status:** 🔴 Not done
**Effort:** 30 mins
**File:** `src/app/members/page.tsx` (Promotions section)
**Action:**
```typescript
// Add button in referral code card:
import QRCode from 'qrcode.react';

const qrValue = `https://payparq.com/search?ref=${code}`;

<button onClick={() => setShowQR(true)}>
  Show QR Code
</button>

{showQR && (
  <QRCode 
    value={qrValue}
    size={200}
    level="H"
    includeMargin={true}
  />
)}
```

**Note:** qrcode.react might already be in dependencies

---

## Testing & Validation

### Unit Tests 🟡 (Recommended)
**Effort:** 1 hour
**Test:**
```typescript
// referralCodeGenerator.ts
✓ generateUserReferralCode('user123') always returns same code
✓ generateListingReferralCode('Hotel A', 'uuid', 'hotel') matches pattern CITY-TYPE-ID
✓ validateReferralCodeFormat('USER-ABC123') = true
✓ validateReferralCodeFormat('DBK-CAR-482') = true
✓ validateReferralCodeFormat('invalid') = false
```

### API Tests 🟡 (Recommended)
**Effort:** 1-2 hours
**Test:**
```
POST /api/referrals/user-code → returns code
GET /api/referrals/listing-code?location_id=X → returns code
POST /api/referrals/validate-code → validates correctly
POST /api/referrals/create → creates record
```

### E2E Test 🔴 (Critical for launch)
**Effort:** 2 hours
**Scenario:**
1. Owner registers light form (hotel)
2. Admin approves → code generated
3. Code appears in Members → Promotions
4. Share link: `payparq.com/checkout?location_id=X&ref=DBK-HTL-482`
5. Checkout page extracts code
6. 10% discount shows
7. User completes payment
8. Webhook fires, creates booking_referral_codes
9. Owner sees referral earning in Members → Payouts
10. On payout, earning included in total

---

## Deployment Order

1. **Database migration** (prerequisite for everything)
2. **Checkout integration** (needed for user flow)
3. **Payout calculation** (needed for earnings to show)
4. **Admin integration** (nice to have, can be manual for now)
5. **Tests** (before announcing feature)
6. **QR codes** (can ship later)

---

## Effort Summary

| Task | Effort | Priority |
|------|--------|----------|
| Database migration | 5 min | 🔴 Critical |
| Checkout integration | 30 min | 🔴 Critical |
| Stripe metadata | 15 min | 🔴 Critical |
| Payout calculation | 1 hr | 🔴 Critical |
| Admin integration | 2 hr | 🟡 High |
| Admin dashboard | 3 hr | 🟡 High |
| Tests | 3 hr | 🟡 High |
| QR codes | 30 min | 🟢 Nice |
| **TOTAL** | **~11 hrs** | |

**Critical path (MVP):** ~2 hours = Database + Checkout + Payout

---

## Success Criteria (Before Launch)

- [ ] Database migration runs without errors
- [ ] User code generation works (`GET /api/referrals/user-code`)
- [ ] Listing code generation works with admin approval
- [ ] Checkout extracts `?ref=CODE` and validates it
- [ ] 10% discount appears in checkout UI
- [ ] Stripe webhook receives referral metadata
- [ ] `booking_referral_codes` table populated after payment
- [ ] Owner sees referral earnings in payouts
- [ ] E2E test: Code → Checkout → Discount → Earning ✓
- [ ] Abuse prevention works (second use blocked)
- [ ] Documentation updated

---

## Quick Start (Do This First)

```bash
# 1. Run migration
psql -f src/lib/migrations/referral-system-v2.sql

# 2. Test endpoint
curl -H "Authorization: Bearer TOKEN" \
  https://yourdomain.com/api/referrals/user-code

# 3. Check Members page shows your code ✓

# 4. Update checkout page

# 5. Test end-to-end with ?ref=CODE in URL
```

---

## Questions Before Implementing?

- Is the Supabase function accessible/modifiable? (for metadata pass-through)
- Where is payout calculated currently?
- Does admin have existing verification inbox UI?
- Do you want QR codes immediately or can they ship later?
- Any custom anti-abuse rules beyond one-per-booking?

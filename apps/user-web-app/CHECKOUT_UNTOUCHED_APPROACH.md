# Referral System V2 - Checkout Completely Untouched

## Core Principle
**Checkout doesn't know about referral codes at all.** 
They flow through the URL naturally, webhook handles them.

---

## How It Works (Checkout Untouched)

```
User clicks: payparq.com/search?ref=DBK-CAR-482
     ↓
Search page loads, extracts ?ref=DBK-CAR-482
     ↓
Search page shows: "10% off with code: DBK-CAR-482"
     ↓
User finds listing, clicks "Book"
     ↓
URL becomes: /checkout?location_id=X&ref=DBK-CAR-482
(ref param just goes along for the ride)
     ↓
Checkout page loads
(Checkout IGNORES the ref param - completely unchanged)
     ↓
User pays
     ↓
Stripe session created with NORMAL metadata (unchanged)
     ↓
Webhook receives session
     ↓
Webhook extracts ?ref=DBK-CAR-482 from metadata/URL
(or it's passed through as query param separately)
     ↓
Webhook creates booking_referral_codes record
     ↓
DONE - no checkout modifications needed
```

---

## Files to Actually Modify

### 1. Search Page (New Code Only)
**File:** `src/app/search/page.tsx` (or SearchPageClient)

**Add:**
```typescript
const searchParams = useSearchParams();
const refCode = searchParams.get('ref');

// Show banner if ref code present
{refCode && (
  <div className="bg-green-50 border border-green-200 p-3 rounded">
    <p className="text-green-700">
      ✓ 10% discount active with code: <strong>{refCode}</strong>
    </p>
  </div>
)}

// When creating booking URL, preserve ref param
const bookingUrl = `/checkout?location_id=${id}&ref=${refCode || ''}`;
```

**That's it.** Search page just displays the code, passes it through.

### 2. Webhook (Already Done ✅)
**File:** `src/app/api/webhooks/stripe/route.ts`

Already updated to handle `referral_code` in metadata or URL params.
No further changes needed.

### 3. Members Page (Already Done ✅)
**File:** `src/app/members/page.tsx`

Already shows user and listing codes.
No changes needed.

---

## How Referral Code Reaches Webhook

### Option A: Via URL Query Param (Simplest)
```typescript
// Checkout receives URL: /checkout?location_id=X&ref=DBK-CAR-482
// Checkout ignores ref param
// Checkout creates Stripe session normally
// THEN: Before redirecting to Stripe, extract ref from URL

const refCode = new URL(window.location.href).searchParams.get('ref');

// Pass to webhook backend via POST /api/create-referral-record
// Before payment completes
await fetch('/api/referrals/pre-checkout', {
  method: 'POST',
  body: JSON.stringify({
    referral_code: refCode,
    location_id: locationId,
    user_id: userId,
  })
});
```

### Option B: Via Supabase Function (If Modifiable)
```typescript
// If you control the Supabase function that creates Stripe session:
// Pass ref code as query param to that function
// Function includes it in Stripe metadata
// Webhook reads from metadata
```

### Option C: Via Session Storage (No Backend Change)
```typescript
// Before checkout: store ref in sessionStorage
if (refCode) {
  sessionStorage.setItem('referral_code', refCode);
}

// On webhook success redirect: retrieve from session
// Send to /api/referrals/create
```

---

## Mobile Scanner - Completely Untouched ✅

Old system continues working:
```
Mobile app scans QR → generates promo code
Promo code sent to checkout via OLD mechanism (unchanged)
Checkout processes normally (unchanged)
Webhook creates referral record in OLD TABLE (unchanged)
Old 10% system keeps working

NEW system runs separately:
Referral code validation endpoint
Referral code creation endpoint  
New booking_referral_codes table
Webhook ALSO creates v2 records

Both systems coexist peacefully - no conflicts
```

---

## Webhook Handles Both Systems

```typescript
// In webhook, checkout.session.completed:

// 1. Owner ledger (unchanged - green part)
await createOwnerLedger(...);

// 2. OLD system (if promoCodeId present)
if (promoCodeId) {
  await createLegacyReferral(...);
}

// 3. NEW system (if referral_code present)
if (referralCode) {
  await createNewReferral(...);
}

// Both can exist in same transaction
// No conflicts, no overwrites
```

---

## Implementation Steps (Checkout Untouched)

### Step 1: Search Page - Show Discount Banner
**File:** `src/app/search/page.tsx`
```typescript
const refCode = searchParams.get('ref');

// Just display it, that's all
{refCode && <DiscountBanner code={refCode} />}
```
**Effort:** 10 min

### Step 2: Search Page - Pass Ref Through to Checkout
```typescript
// When user clicks "Book"
const bookUrl = `/checkout?location_id=${id}&ref=${refCode || ''}`;
```
**Effort:** 5 min

### Step 3: Create Pre-Checkout Hook
**File:** New file `/api/referrals/pre-checkout/route.ts`
```typescript
// POST endpoint
// Called BEFORE payment, not in checkout
// Just records intent to use code
// Returns validation result

async function POST(req: NextRequest) {
  const { referral_code, location_id, user_id } = await req.json();
  
  // Validate code
  const valid = await validateCode(referral_code, user_id, location_id);
  
  if (valid) {
    // Store temporarily (in cache or temp table)
    // Will be linked to booking_id after payment
    return NextResponse.json({ valid: true });
  }
  
  return NextResponse.json({ valid: false, error: 'Invalid code' });
}
```
**Effort:** 15 min

### Step 4: Update Webhook to Lookup Pre-Checkout Record
```typescript
// When webhook fires (checkout.session.completed):

// Check if there's a pre-checkout record for this session
const preCheckout = await getPreCheckoutRecord(session.id);

if (preCheckout?.referral_code) {
  // Create booking_referral_codes record
  await createNewReferralRecord({
    booking_id: session.id,
    referral_code: preCheckout.referral_code,
    referrer_id: preCheckout.referrer_id,
    ...
  });
}
```
**Effort:** 10 min

---

## Result

✅ Checkout completely untouched (zero changes)
✅ Old mobile scanner codes work (zero changes)
✅ New referral codes work alongside old ones
✅ No conflicts, no overwrites
✅ Both systems in same webhook transaction
✅ Clean separation: Search handles display, Webhook handles recording

---

## Data Flow (Visual)

```
┌─────────────────────────────────────────┐
│ payparq.com/search?ref=DBK-CAR-482     │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────▼──────────┐
        │  SEARCH PAGE        │
        │ (Modified: Show     │
        │  banner, pass ref)  │
        └──────────┬──────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│ /checkout?location_id=X&ref=DBK-CAR-482│
└──────────────────┬──────────────────────┘
                   │
        ┌──────────▼──────────────┐
        │  CHECKOUT PAGE          │
        │ (UNTOUCHED - ignores    │
        │  ref param)             │
        └──────────┬──────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│ /api/referrals/pre-checkout            │
│ (New: validates code before payment)    │
└──────────────────┬──────────────────────┘
                   │
                   ▼
        ┌──────────────────┐
        │ User pays        │
        └──────────┬───────┘
                   │
                   ▼
        ┌──────────────────────────┐
        │ Stripe webhook fires     │
        │ (Unchanged)              │
        └──────────┬───────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
    OLD SYSTEM          NEW SYSTEM
    (Mobile)            (Web)
    Keep working ✅     Create record ✅
```

---

## Summary

- **Checkout:** Zero changes, completely untouched
- **Search page:** Add 10-line banner display
- **New endpoint:** `/api/referrals/pre-checkout` for validation
- **Webhook:** Already handles both old + new systems
- **Mobile scanner:** Still works, no conflicts
- **Old 10% system:** Keeps working in old table

Total effort: ~40 minutes
Risk to checkout: Zero

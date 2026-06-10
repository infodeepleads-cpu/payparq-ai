# Referral System V2 - BEST Design (Optimized)

## Core Principle
**Validation early (search page), execution late (webhook)**

---

## Why This Is Best

✅ **Checkout 100% untouched** - doesn't know ref codes exist
✅ **Early validation** - users see errors before payment
✅ **No orphaned records** - validation = actual intended use
✅ **One flow, one validation** - no pre-checkout endpoint needed
✅ **Mobile scanner unaffected** - completely separate path
✅ **Simple data flow** - ref code just travels in URL

---

## How It Works

```
User on search page
     ↓
Enters code: "DBK-CAR-482"
     ↓
Search page calls: POST /api/referrals/validate-code
     ↓
Endpoint validates:
  ✓ Code exists
  ✓ Code approved
  ✓ User hasn't used before
     ↓
IF VALID:
  └─→ Show green: "✓ 10% discount active"
      Store code in state
      Pass to checkout URL: ?ref=DBK-CAR-482
     ↓
IF INVALID:
  └─→ Show red: "Code not found" or "Already used"
      Don't pass to checkout
      User either fixes or continues without code
     ↓
User clicks "Book Listing"
     ↓
URL: /checkout?location_id=X&ref=DBK-CAR-482
     ↓
Checkout loads
(Completely untouched - ignores ?ref=DBK-CAR-482)
     ↓
User pays
     ↓
Stripe webhook fires
     ↓
Webhook reads ref from metadata/URL
     ↓
Webhook creates booking_referral_codes record
(Validation already passed on search page)
     ↓
DONE
```

---

## Why NOT Pre-Checkout Endpoint

❌ **Pre-checkout approach issues:**
- Two API calls (validate + webhook) = slow, complex
- Orphaned records if user abandons after validation
- Record created → payment fails → record stays invalid
- Need cleanup logic
- Extra database complexity

✅ **Search-page validation approach:**
- One API call to validate
- Validation result shown immediately  
- User sees discount in preview
- Same code passed to checkout (untouched)
- Webhook handles record creation (one source of truth)
- No orphaned records (validation = actual use)

---

## Implementation (Super Clean)

### 1. Search Page Referral Input
**File:** `src/app/search/page.tsx` (or SearchPageClient)

```typescript
const [referralCode, setReferralCode] = useState('');
const [referralValid, setReferralValid] = useState(false);
const [referralError, setReferralError] = useState('');
const [validating, setValidating] = useState(false);

async function validateCode(code: string) {
  if (!code.trim()) {
    setReferralValid(false);
    setReferralError('');
    return;
  }

  setValidating(true);
  setReferralError('');

  try {
    const res = await fetch('/api/referrals/validate-code', {
      method: 'POST',
      body: JSON.stringify({
        code: code.toUpperCase(),
        user_id: user?.id,
        location_id: selectedListingId, // optional, for listing codes
      }),
    });

    const data = await res.json();

    if (data.valid) {
      setReferralValid(true);
      setReferralCode(code.toUpperCase());
      setReferralError('');
    } else {
      setReferralValid(false);
      setReferralCode('');
      setReferralError(data.error || 'Invalid code');
    }
  } catch (err) {
    setReferralValid(false);
    setReferralCode('');
    setReferralError('Error validating code');
  } finally {
    setValidating(false);
  }
}

// Show input
return (
  <>
    <input
      type="text"
      placeholder="Enter referral code (e.g., DBK-CAR-482)"
      value={referralCode}
      onChange={(e) => {
        setReferralCode(e.target.value.toUpperCase());
        validateCode(e.target.value.toUpperCase());
      }}
      className="..."
    />

    {validating && <p>Checking code...</p>}
    {referralValid && (
      <div className="bg-green-50 p-3 rounded">
        ✓ 10% discount active with code: <strong>{referralCode}</strong>
      </div>
    )}
    {referralError && (
      <div className="bg-red-50 p-3 rounded text-red-700">
        ✗ {referralError}
      </div>
    )}
  </>
);

// When user books, pass code in URL
const bookUrl = `/checkout?location_id=${listing.id}${
  referralValid ? `&ref=${referralCode}` : ''
}`;
```

### 2. Checkout (UNTOUCHED) ✅
**File:** `src/app/checkout/page.tsx`

Zero changes. Checkout doesn't know about referral codes.

```typescript
// Checkout naturally receives URL with ref param
// Checkout ignores it completely
// Just works as normal
```

### 3. Webhook (Minor Addition)
**File:** `src/app/api/webhooks/stripe/route.ts`

Read ref code from somewhere (URL, metadata, etc) and create record:

```typescript
// In webhook, when session.completed:

// Extract ref code from where it came through
const refCode = meta.referral_code || session.client_reference_id?.split('ref=')[1];

if (refCode) {
  // Code already validated on search page
  // Just create the record
  await supabase.from('booking_referral_codes').insert({
    booking_id: session.id,
    referral_code: refCode,
    // ...rest of fields
  });
}
```

---

## Data Flow Summary

```
SEARCH PAGE                 CHECKOUT              WEBHOOK
┌──────────────┐           ┌──────────┐         ┌─────────┐
│ User enters  │           │ Receives │         │ Creates │
│ code         │           │ ref in   │         │ referral│
│              │           │ URL but  │         │ record  │
│ Validate ✓   │──────────→│ ignores  │────────→│ ✓       │
│              │           │ it       │         │         │
│ Show result  │           │ (normal) │         │         │
└──────────────┘           └──────────┘         └─────────┘
     ↑
     └──olds all logic
```

**One validation point = one source of truth**

---

## Why This Beats Alternatives

### vs. Pre-Checkout Endpoint
```
Pre-Checkout:  Search → Validate → Checkout → Pay → Webhook
               (3 API calls, orphaned records risk)

Best System:   Search → Validate → Checkout → Pay → Webhook
               (1 validation call, no orphaned records)
```

### vs. Validate in Checkout
```
Validate in Checkout: Violates "checkout untouched" rule ✗

Best System: Validate in Search ✓ (checkout untouched)
```

### vs. No Validation
```
No Validation: User doesn't see discount in preview ✗
              Webhook may fail silently ✗

Best System: Validation in search page ✓
            User sees discount before paying ✓
            Webhook just creates record (already validated) ✓
```

---

## Effort

- **Search page:** ~20 minutes
- **Webhook adjustment:** ~5 minutes  
- **Testing:** 30 minutes
- **Total:** ~1 hour

---

## Checklist (Before Implementation)

- [ ] Search page can access user ID and listing ID
- [ ] Can modify search page (no restrictions)?
- [ ] How does ref code travel to checkout URL in current setup?
  - Option A: Direct in URL ✓
  - Option B: Via session storage
  - Option C: Via URL redirect
- [ ] Webhook can read ref from metadata or URL?

---

## This Is Best Because

✅ **Simplest flow** - One validation point
✅ **Best UX** - User sees result before paying
✅ **Safest** - Checkout untouched, no side effects
✅ **No orphaned records** - Validation = actual use
✅ **Fastest** - No extra API calls in checkout
✅ **Mobile scanner safe** - Completely separate path
✅ **Matches industry standard** - How Uber/Airbnb do it

Ready to implement?

# Referral System V2 - Real Best System (Using Existing Promo Field)

## The Real Simplest Approach

**Use the promo code field that already exists on checkout.**

---

## How It Works

```
User clicks: payparq.com/checkout?location_id=X&ref=DBK-CAR-482
     ↓
Checkout page loads
     ↓
Checkout has existing promo code input field
     ↓
IF ?ref=CODE in URL:
  └─→ Auto-populate promo field with code
      (One line of code)
     ↓
User sees: "DBK-CAR-482" already in field
     ↓
User presses Apply (or auto-applies)
     ↓
Existing promo validation logic runs
  (Already handles validation, discount calc, etc)
     ↓
Validation endpoint needs update:
  OLD: Validates only old codes
  NEW: Also validates new referral codes
     ↓
If valid: 10% discount shows
If invalid: Error shows
     ↓
User pays
     ↓
Webhook fires
     ↓
Webhook sees promoCode/referralCode in metadata
(Already handles it)
     ↓
Webhook creates:
  - OLD: referral record (if old code)
  - NEW: booking_referral_codes record (if new code)
     ↓
DONE
```

---

## Changes Required (Minimal)

### 1. Checkout Page - Auto-populate if ?ref in URL
**File:** `src/app/checkout/page.tsx`

```typescript
const searchParams = useSearchParams();
const refFromUrl = searchParams.get('ref');

// On component mount:
useEffect(() => {
  if (refFromUrl && !promoInput) {
    setPromoInput(refFromUrl.toUpperCase());
    // Optionally auto-apply:
    // onApplyPromo(refFromUrl);
  }
}, [refFromUrl]);
```

**That's it.** 3 lines of code.

### 2. Promo Validation Endpoint - Accept New Codes
**File:** Where promo validation happens (likely in checkout flow)

Update the validation logic to:
```typescript
async function validatePromoCode(code: string) {
  // Try new v2 referral codes first
  const v2Result = await validateReferralCode(code);
  if (v2Result.valid) {
    return {
      valid: true,
      type: 'referral_v2',
      discount_percent: v2Result.discount_percent,
      referrer_id: v2Result.referrer_id,
      // ... other fields
    };
  }

  // Fall back to old promo codes
  const v1Result = await validateLegacyPromo(code);
  if (v1Result.valid) {
    return {
      valid: true,
      type: 'promo_legacy',
      discount_percent: v1Result.discount_percent,
      // ... other fields
    };
  }

  return { valid: false, error: 'Invalid code' };
}
```

### 3. Webhook - Already Updated ✅
Already handles both old and new codes in metadata.
No changes needed.

---

## Why This Is Actually Best

✅ **Zero checkout flow changes** - just one useEffect
✅ **Reuses existing promo field** - no new UI needed
✅ **Reuses existing validation flow** - just extend it
✅ **Reuses existing discount logic** - both are 10%
✅ **Mobile scanner codes** - still work unchanged
✅ **Backward compatible** - old codes keep working
✅ **Super simple** - 3 lines of code to auto-populate

---

## Data Flow

```
                CHECKOUT PAGE
                ┌────────────┐
                │ Promo Code │ ← Auto-fill if ?ref=CODE
                │   Field    │
                └─────┬──────┘
                      │
                      ▼
            ┌─────────────────┐
            │ Validate Code   │
            │ (NEW: accepts   │
            │  both v1 & v2)  │
            └─────────┬───────┘
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
      V1 Code              V2 Code
      (Mobile)             (Referral)
          │                       │
          └───────────┬───────────┘
                      │
                      ▼
            ┌─────────────────┐
            │ Webhook         │
            │ (Already        │
            │  handles both)  │
            └─────────────────┘
```

---

## Step by Step

### 1. Auto-Populate Promo Field
```typescript
// In checkout page useEffect:
const searchParams = useSearchParams();
const refCode = searchParams.get('ref');

useEffect(() => {
  if (refCode && !promoInput) {
    setPromoInput(refCode.toUpperCase());
  }
}, [refCode, promoInput]);
```

**Effort:** 2 minutes

### 2. Update Validation to Accept V2 Codes
```typescript
// In existing promo validation function:
async function validateCode(code: string) {
  // Check v2 referral codes
  const res = await fetch('/api/referrals/validate-code', {
    method: 'POST',
    body: JSON.stringify({ code, user_id, location_id })
  });
  
  if (res.ok) {
    const data = await res.json();
    if (data.valid) return { ...data, discountPercent: 10 };
  }
  
  // Fall back to existing legacy validation
  return validateLegacy(code);
}
```

**Effort:** 5 minutes

### 3. Test End to End
- Click: `payparq.com/checkout?location_id=X&ref=DBK-CAR-482`
- Promo field auto-fills ✓
- Click Apply ✓
- 10% discount shows ✓
- Pay ✓
- Webhook creates record ✓

**Effort:** 15 minutes

---

## Total Effort: ~25 minutes

- Auto-populate: 2 min
- Update validation: 5 min
- Test: 15 min
- Cleanup/review: 3 min

---

## Members Page Still Shows Codes ✅

Already updated to show:
- User codes (USER-ABC123)
- Listing codes (DBK-CAR-482)
- Copy button
- Shareable links

No changes needed.

---

## This Works For:

✅ **Links:** `payparq.com/checkout?location_id=X&ref=DBK-CAR-482`
✅ **QR codes:** Encode same URL, point to checkout
✅ **Manual entry:** User types code in existing promo field
✅ **Mobile scanner codes:** Still work unchanged
✅ **All old codes:** Legacy system untouched

---

## Why NOT Use Search Page

❌ You already have promo on checkout
❌ Adding another input on search page = duplicate UX
❌ Refactoring to search would require more changes
✅ Just use what exists

---

## Summary

**Don't modify checkout flow.**
**Just auto-populate existing promo field with ?ref=CODE**
**Extend existing validation to accept new codes**
**Done.**

2 tiny changes (3 lines + 5 lines = 8 lines total)

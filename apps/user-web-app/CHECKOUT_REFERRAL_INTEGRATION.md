# Checkout Referral Code Integration Proposal

## Current State
- Checkout page (`src/app/checkout/page.tsx`) has existing promo code system
- Promo code input field, validation, and discount calculation already exist
- Stripe webhook expects `referral_code` and `referrer_id` in metadata

## Integration Points

### 1. **URL Parameter Parsing** (Checkout Page)
**Location:** `src/app/checkout/page.tsx` component initialization

**Current flow:**
```typescript
const searchParams = useSearchParams();
const location_id = searchParams.get('location_id');
const flow = searchParams.get('flow');
// ... etc
```

**Change needed:**
```typescript
// Add referral code extraction from URL
const referralCode = searchParams.get('ref') || '';

// If referral code exists in URL, auto-validate it
useEffect(() => {
  if (referralCode && !promoInput) {
    // Auto-apply referral code
    setPromoInput(referralCode);
    onApplyPromo(referralCode);
  }
}, [referralCode]);
```

### 2. **Code Validation** (Existing Promo Logic)
**Location:** Where `onApplyPromo()` is called

**Current behavior:**
- Validates against `/api/promo/validate-auto`
- Returns discount percentage and promo_code_id

**Change needed - Add v2 validation:**
```typescript
async function validateCode(code: string) {
  // Try new v2 endpoint first
  const res = await fetch('/api/referrals/validate-code', {
    method: 'POST',
    body: JSON.stringify({
      code: code,
      user_id: userId, // Get from auth context
      location_id: location_id,
    }),
  });

  if (res.ok) {
    const data = await res.json();
    if (data.valid) {
      // Store for later
      setReferralInfo({
        code: data.code,
        type: data.type, // 'user' or 'listing'
        referrer_id: data.referrer_id,
        discount_percent: data.discount_percent,
      });
      return true;
    }
  }

  // Fallback to legacy system
  return validateLegacyPromo(code);
}
```

### 3. **State Management**
**Add to checkout component state:**
```typescript
const [referralInfo, setReferralInfo] = useState<{
  code: string;
  type: 'user' | 'listing';
  referrer_id: string;
  discount_percent: number;
} | null>(null);
```

### 4. **Stripe Metadata Assembly**
**Location:** Where Stripe session is created (Supabase function call)

**Current metadata keys being sent:**
- `location_id`
- `charged_amount_cents`
- `lot_commission_rate`
- `plate_number`
- `customer_email`
- `promoCodeId` (for legacy system)
- etc.

**Change needed - Add v2 referral metadata:**
```typescript
// When calling Supabase function or creating Stripe session
const metadata = {
  // ... existing metadata ...
  
  // Legacy promo code (if applicable)
  ...(promoCodeId ? { promoCodeId } : {}),
  
  // NEW: V2 Referral system
  ...(referralInfo ? {
    referral_code: referralInfo.code,
    referrer_id: referralInfo.referrer_id,
    referral_type: referralInfo.type,
  } : {}),
};
```

### 5. **Supabase Edge Function**
**File:** (Cloud function for creating Stripe checkout sessions)

**Change needed:**
```typescript
// When creating the Stripe checkout session, include referral metadata:

const session = await stripe.checkout.sessions.create({
  line_items: [...],
  metadata: {
    // ... existing ...
    referral_code: req.query.referral_code || null,
    referrer_id: req.query.referrer_id || null,
    referral_type: req.query.referral_type || null,
  },
  // ...
});
```

### 6. **Discount Application**
**Current behavior:**
- Promo discount already calculated and displayed
- UI shows discounted total

**No changes needed here** - referral codes use same 10% discount as existing promo system
```typescript
discountAmount = chargedCents * (referralInfo?.discount_percent || 0) / 100;
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ User clicks link: payparq.com/checkout?...&ref=DBK-CAR-482      │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ Checkout Page loads   │
        │ Parses ?ref=CODE      │
        └───────┬───────────────┘
                │
                ▼
    ┌──────────────────────────────┐
    │ Auto-apply referral code     │
    │ Call POST /api/referrals/    │
    │   validate-code             │
    └───────┬──────────────────────┘
            │
            ▼
  ┌─────────────────────────┐
  │ Valid? Show discount    │
  │ Store referralInfo:     │
  │ - code, type,           │
  │ - referrer_id, discount │
  └───────┬─────────────────┘
          │
          ▼
┌──────────────────────────────────┐
│ User completes checkout          │
│ Pass metadata to Stripe:         │
│ - referral_code                  │
│ - referrer_id                    │
│ - referral_type                  │
└───────┬──────────────────────────┘
        │
        ▼
   ┌─────────────────────┐
   │ Stripe webhook      │
   │ checkout.session.   │
   │ completed           │
   └─────┬───────────────┘
         │
         ▼
   ┌─────────────────────────────────┐
   │ Create owner_ledger (UNCHANGED) │
   └─────────────────────────────────┘
         │
         ▼
   ┌──────────────────────────────────┐
   │ Create booking_referral_codes    │
   │ record with:                     │
   │ - booking_id: session.id         │
   │ - referral_code                  │
   │ - referrer_id                    │
   │ - earnings: 10% of charged       │
   │ - status: completed              │
   └──────────────────────────────────┘
```

## Files to Modify

1. **`src/app/checkout/page.tsx`**
   - Add referral code extraction from URL
   - Add validation call to `/api/referrals/validate-code`
   - Add `referralInfo` state
   - Update metadata when passing to Stripe

2. **Supabase Edge Function** (outside this repo)
   - Accept `referral_code`, `referrer_id` in query params
   - Pass through to Stripe metadata

3. **No changes needed to webhook** ✅ (already updated)

## Testing Checklist

- [ ] URL with `?ref=USER-ABC123` auto-applies discount
- [ ] URL with `?ref=DBK-CAR-482` auto-applies discount
- [ ] Invalid codes show error message
- [ ] Valid code shows 10% discount before total
- [ ] Discount percentage displayed correctly (10%)
- [ ] Metadata contains `referral_code` and `referrer_id`
- [ ] Webhook receives metadata correctly
- [ ] `booking_referral_codes` record created with correct values
- [ ] `parking_sessions` updated with referral tracking
- [ ] Referrer earning calculated as 10% of charged amount
- [ ] Legacy promo codes still work (backward compat)

## Fallback & Error Handling

```typescript
// If referral code validation fails, allow user to continue
// without referral (graceful degradation)

if (!validationResult.valid) {
  setPromoError(validationResult.error || 'Invalid code');
  setReferralInfo(null);
  // Don't block checkout
  return;
}
```

## Benefits of This Approach

✅ **Minimal changes** - Reuses existing promo code UI/logic
✅ **Backward compatible** - Legacy promo codes still work
✅ **User-friendly** - Code auto-applies from URL
✅ **Secure** - Validation happens server-side
✅ **Traceable** - Full referral chain tracked
✅ **Flexible** - Works with user codes AND listing codes

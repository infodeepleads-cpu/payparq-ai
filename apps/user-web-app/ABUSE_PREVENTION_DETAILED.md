# Referral System - Abuse Prevention Strategy

## Current Design Issue
**Old approach:** One use per user per code per listing **EVER** ❌
- Problem: Blocks loyal repeat customers
- Example: Guest books hotel in June 2025 → uses code → returns June 2026 → code blocked forever

## Recommended Approach
**New approach:** One use per **DISTINCT BOOKING** ✅
- Per-booking granularity prevents abuse during same purchase window
- Repeat customers can use code again for new bookings
- Natural cooldown: Can't use same code for same listing on overlapping dates

---

## How It Works

### Scenario 1: Same Guest, Different Bookings
```
Guest books Hotel DBK-HTL-482:

Booking #1 (June 2025, 3 nights):
  - Uses code: DBK-HTL-482
  - Gets 10% discount ✓
  - Referral created: status='completed'

[Time passes: 1 year]

Booking #2 (June 2026, 3 nights):
  - Uses code: DBK-HTL-482
  - Gets 10% discount ✓ (NEW BOOKING, so allowed)
  - New referral created: status='completed'
  - Referrer earns another 10%

Result: Referrer earns on BOTH bookings ✅
```

### Scenario 2: Abuse Attempt (Prevented)
```
Guest tries to use code multiple times:

Booking #1 (June 2025, 3 nights):
  - Uses code: DBK-HTL-482 at checkout
  - Gets 10% discount ✓
  - Session ID: sess_abc123
  - Referral created with booking_id=sess_abc123

[Guest tries again in SAME booking session]

- Attempts to re-enter code before completing booking
- Session ID still: sess_abc123
- Check: Is there existing referral_usage_tracking for this booking_id + code + user?
- YES → Block: "Code already used in this booking"
- NO checkout happens → Code usage prevented ✓

[Later, different checkout session]

Booking #2 (SAME month, new dates):
  - New session ID: sess_xyz789
  - Tries same code: DBK-HTL-482
  - Check: Is there existing referral_usage_tracking for this code + user + location + recent_date?
  - Check window: Last 30 days? (configurable)
  - IF yes → Block: "Can use this code once per 30 days"
  - IF no → Allow new booking

Result: Protects against rapid-fire abuse ✓
```

### Scenario 3: Different Listing
```
Guest uses USER code (works everywhere):

Booking #1 (Hotel A):
  - Code: USER-ABC123
  - Gets discount ✓

Booking #2 (Car Rental B, SAME DAY):
  - Code: USER-ABC123
  - Gets discount ✓ (different listing, different booking)

Result: Works as intended - user code benefits all guests ✓
```

---

## Implementation Strategy

### Update `referral_usage_tracking` Table
```sql
-- Current schema
CREATE TABLE referral_usage_tracking (
  id UUID PRIMARY KEY,
  referral_code VARCHAR(20),
  location_id UUID,
  user_id_claimed UUID,
  booking_id TEXT,           -- ← KEY: Track by BOOKING
  claimed_at TIMESTAMP,
  UNIQUE(referral_code, user_id_claimed, booking_id)  -- ← Per-booking uniqueness
);

-- Optional: Add cooldown window for same location
ALTER TABLE referral_usage_tracking 
ADD COLUMN cooldown_expires_at TIMESTAMP;
```

### Validation Logic at Checkout
```typescript
async function validateReferralCode(
  code: string,
  userId: string,
  locationId: string,
  bookingId: string  // Session ID or reservation ID
) {
  // 1. Check code exists and is approved
  const codeRecord = await validateCodeExists(code);
  if (!codeRecord.valid) return { valid: false };

  // 2. Check for SAME booking (prevent multi-use in same checkout)
  const sameBookingUsage = await supabase
    .from('referral_usage_tracking')
    .select('*')
    .eq('referral_code', code)
    .eq('user_id_claimed', userId)
    .eq('booking_id', bookingId)
    .maybeSingle();

  if (sameBookingUsage) {
    return { 
      valid: false, 
      error: 'Code already used in this booking' 
    };
  }

  // 3. Optional: Check cooldown (e.g., one per 30 days per location)
  const COOLDOWN_DAYS = 30;
  const recentUsage = await supabase
    .from('referral_usage_tracking')
    .select('*')
    .eq('referral_code', code)
    .eq('user_id_claimed', userId)
    .eq('location_id', locationId)
    .gte('claimed_at', new Date(Date.now() - COOLDOWN_DAYS * 24 * 60 * 60 * 1000))
    .maybeSingle();

  if (recentUsage) {
    return { 
      valid: false,
      error: `Code can be used once per ${COOLDOWN_DAYS} days for this listing.` 
    };
  }

  // 4. Code is valid
  return { 
    valid: true,
    referrer_id: codeRecord.referrer_id,
    discount_percent: 10
  };
}
```

### Webhook Recording (POST /api/referrals/create)
```typescript
// When booking completes, record usage
await supabase
  .from('referral_usage_tracking')
  .insert([{
    referral_code: code,
    location_id: locationId,
    user_id_claimed: userId,
    booking_id: session.id,  // ← Unique per booking
    claimed_at: new Date(),
    cooldown_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }]);
```

---

## Configuration Options

### Option A: Strict (Default)
```typescript
// No cooldown, one use per location EVER
const COOLDOWN_DAYS = null;
const ALLOW_REPEAT_AFTER_BOOKING_COMPLETION = true;
```

Result: Guest can use again, but only for NEW booking (recommended)

### Option B: Moderate (Loyalty Incentive)
```typescript
// One use per 30 days per location
const COOLDOWN_DAYS = 30;
const ALLOW_REPEAT_AFTER_BOOKING_COMPLETION = true;
```

Result: Annual visitor can use code once per year (good for seasonal)

### Option C: Permissive (Max Loyalty)
```typescript
// Unlimited uses, only prevents same booking multi-use
const COOLDOWN_DAYS = null;
const COOLDOWN_WINDOW = 'per-booking';
```

Result: Unlimited uses across years (true loyalty program)

---

## Business Impact

### Referrer Earnings (Per Configuration)

**Option A (Strict):**
```
Annual guest returns:
Year 1: 1 booking = 10% earning
Year 2: 1 booking = 10% earning
Year 3: 1 booking = 10% earning
Total: 30% annual revenue from repeat customers ✅
```

**Option B (Moderate - 30 day cooldown):**
```
Local guest books monthly:
Month 1: Uses code = 10% earning
Month 2: Can't use (within 30 days)
Month 3: Can use again = 10% earning
Total: ~36% annual revenue (more spread out)
```

**Option C (Permissive - unlimited):**
```
Local guest books monthly:
Every booking: Uses code = 10% earning
12 bookings/year: 12 × 10% = 120% earning (more than listing price!) 🚀
```

---

## Recommended Implementation

**Start with Option A (Strict):**
- One use per distinct booking
- Natural cooldown: Can't book same dates twice
- Repeat customers benefit: Different dates = new booking = new discount
- Referrer earns on every return booking
- Simplest to implement and explain
- Fair to guests, good for referrer

**Add cooldown if abuse detected:**
- Monitor `referral_usage_tracking`
- If same user books 5+ times per month → add 30-day cooldown
- Can adjust per-listing based on patterns

---

## Validation Database Query

```sql
-- Check if code can be used for this booking
SELECT COUNT(*) as usage_count
FROM referral_usage_tracking
WHERE referral_code = $1          -- The code
  AND user_id_claimed = $2        -- The user
  AND booking_id != $3            -- Different booking
  AND location_id = $4            -- Same listing
  AND claimed_at > NOW() - INTERVAL '30 days';  -- Within cooldown window
  
-- If count > 0: blocked (within cooldown)
-- If count = 0: allowed (different booking or cooldown expired)
```

---

## Testing Checklist

- [ ] Guest A books, uses code, gets discount ✓
- [ ] Guest A tries same code in same booking → blocked ✓
- [ ] Guest A books different dates, uses code again → allowed ✓
- [ ] Guest A books 3 days later with same code → check cooldown logic
- [ ] Guest B uses same code → allowed (different user) ✓
- [ ] Referrer earns on each valid booking ✓
- [ ] Referral earnings accumulate across years ✓
- [ ] Cooldown window calculated correctly ✓

---

## Edge Cases Handled

| Case | Behavior | Why |
|------|----------|-----|
| Same booking, reused code in checkout | Blocked | Prevents accidental multi-charge |
| Different booking, same month | Allowed (default) | Different reservation = different booking |
| Different booking, 30+ days later | Allowed | Cooldown expired |
| Different guest, same code | Allowed | Unlimited users per code |
| Different listing, same user, same code | Allowed | User code works everywhere |
| Same listing, same code, different user | Allowed | Different user = no abuse |

---

## Summary

✅ **Guest books now, comes back next year** → Code works again (new booking)
✅ **Abuse attempts within same checkout** → Blocked
✅ **Repeat customers rewarded** → Referrer earns multiple times
✅ **Fair to all users** → One discount per distinct booking
✅ **Flexible config** → Can adjust cooldown if needed

-- Find all owners with Stripe connected but NOT verified
SELECT 
  p.id,
  p.email,
  p.stripe_account_id,
  p.stripe_onboarding_complete,
  l.id as location_id,
  l.name as location_name
FROM profiles p
LEFT JOIN locations l ON l.owner_id = p.id
WHERE p.stripe_account_id IS NOT NULL 
  AND p.stripe_account_id != ''
  AND p.stripe_onboarding_complete = false
LIMIT 10;

-- Show query to manually set onboarding complete for owner (after they finish Stripe steps):
-- UPDATE profiles SET stripe_onboarding_complete = true 
-- WHERE id = 'OWNER_ID' AND stripe_account_id IS NOT NULL;

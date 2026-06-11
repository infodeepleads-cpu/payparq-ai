# Secrets Checklist for App Store Deployment

## GitHub Actions Secrets (Settings → Secrets and variables → Actions)

Add these 5 secrets:

- [ ] `IOS_DISTRIBUTION_CERT_B64` — from `payparq_distribution_b64.txt`
- [ ] `IOS_CERTIFICATE_PASSWORD` — P12 export password
- [ ] `IOS_PROVISIONING_PROFILE_B64` — from `payparq_profile_b64.txt`
- [ ] `APPLE_ID` — Apple ID email
- [ ] `APPLE_APP_PASSWORD` — App-specific password from appleid.apple.com

## Environment Variables (.env.local)

Already configured:
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `RESEND_API_KEY`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_CONFIG`
- [ ] `HOST_NOTIFICATION_EMAIL`

## Notes

- Never commit `.env.local` to git (already in `.gitignore`)
- Keep `payparq_distribution.p12` and `payparq_distribution_b64.txt` offline
- Store P12 password securely (password manager)

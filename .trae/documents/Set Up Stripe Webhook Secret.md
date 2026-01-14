I will configure the Stripe Webhook Signing Secret in your local environment file.

**Steps:**
1.  **Update Configuration**: Add `STRIPE_WEBHOOK_SECRET` to `apps/user-web-app/.env.local`.

**Note:**
To fully run the webhook locally or deploy, ensure `STRIPE_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are also set in your environment (Vercel or `.env.local`). I will strictly add the secret you provided for now.
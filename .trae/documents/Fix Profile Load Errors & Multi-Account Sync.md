## Phase 1: Database Resilience & Realtime
1. **Enable Realtime**: I will enable Supabase Realtime for the `profiles` table. This is required for the `StreamProvider` to work correctly and show your dashboard instantly after signup.
2. **Fix Security Recursion**: I will update the `get_auth_role` and `get_auth_location_id` functions to explicitly set the `search_path`. This prevents a common Postgres error where security functions fail to find tables when called from a security policy.
3. **Explicit Self-Access**: I will add a high-priority RLS policy that explicitly allows every user to read their own profile, bypassing any other complex logic.

## Phase 2: Robust Profile Provider
1. **Hybrid Profile Loader**: I will refactor the [auth_providers.dart](file:///c:/Users/karlo/OneDrive/Pictures/Desktop/payparq.ai/apps/mobile-scanner/lib/logic/providers/auth_providers.dart) to use a more robust "Listen & Fetch" logic. Instead of just a database stream (which can fail on weak connections), it will:
   - Listen for authentication changes.
   - Fetch the profile using a standard query.
   - Fall back to a "Finalizing" state if the profile is still being created.

## Phase 3: Verification
1. **Deploy & Rebuild**: Re-deploy the database fixes and rebuild the web app.
2. **Testing**: This will ensure that:
   - **Super Admin** sees everything immediately.
   - **New Accounts** see their own isolated lot without errors.
   - **Log Out** always takes you back to the clean Auth screen.

**Summary of the "Contact Support" Error:**
This happened because the app was trying to "subscribe" to a table that didn't have Realtime enabled, causing the database to reject the connection and the app to show an error screen.

**Shall I proceed with these reliability fixes?**
## Phase 1: Database & Super Admin Sync
1. Apply the new [auth_super_admin.sql](file:///c:/Users/karlo/OneDrive/Pictures/Desktop/payparq.ai/supabase/migrations/20260116999999_auth_super_admin.sql) which:
   - Fixes the Postgres recursion error.
   - Enables the `super_admin` role.
   - Simplifies RLS for all tables.
2. Update the `welcome-email` function to support all user types.

## Phase 2: App Resilience (The UI)
1. **Locations Screen**: Fix the layout crash and ensure it handles multiple IDs correctly.
2. **Add Staff Screen**: Update the creation logic to handle the new RLS rules and role types (Admin vs Officer).
3. **Master Scaffold**: Ensure the sidebar reflects the correct permissions based on the user's role.

## Phase 3: Dashboard Settings (Manual Action)
I will provide instructions for:
1. **Promoting yourself to Super Admin**: A 1-line SQL command.
2. **Fixing the Email Link**: Updating the "Site URL" in Supabase to `https://payparq-d-6rex95.web.app`.

## Phase 4: Build & Deploy
1. Clean rebuild of the web app.
2. Deploy v1.2.2 to Firebase Hosting.

**Ready to proceed with these fixes?**
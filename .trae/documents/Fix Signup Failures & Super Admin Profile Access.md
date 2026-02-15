## Phase 1: The "Ultimate Database Fix"
I will provide a single, comprehensive SQL script to run in your Supabase SQL Editor. This script will:
1. **Restore missing functions**: Ensure `generate_unique_display_id` and `get_auth_role` are correctly defined.
2. **Fix the Signup Trigger**: Update `handle_new_user` to be "bulletproof." It will now handle cases where the user partially exists or if the location generation hits a snag, ensuring you can always create new accounts.
3. **Repair Super Admin Access**: Force-insert the profile for `kzamic@gmail.com` with the correct `super_admin` role so you can log in immediately.

## Phase 2: App Resilience (No more Grey Screens)
1. **Auth Provider Update**: I will update [auth_providers.dart](file:///c:/Users/karlo/OneDrive/Pictures/Desktop/payparq.ai/apps/mobile-scanner/lib/logic/providers/auth_providers.dart) to handle "Missing Profiles" gracefully. Instead of a crash, it will return a null profile which we can then handle.
2. **Main Scaffold Guard**: Update the [MasterScaffold](file:///c:/Users/karlo/OneDrive/Pictures/Desktop/payparq.ai/apps/mobile-scanner/lib/main_scaffold.dart) to show a "Finalizing Account..." state if the profile is being created, rather than a grey screen.

## Phase 3: Deployment & Verification
1. Re-deploy the web app with these safety checks.
2. Provide you with the specific SQL to run in Supabase.

**Why kzamic@gmail.com failed:**
It's likely the signup for this account was interrupted or hit a database error, leaving the account in a "half-created" state (exists in Login but missing from the Profile table). My fix will manually bridge this gap.

**Shall I proceed with these fixes?**
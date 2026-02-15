## Phase 1: Fix Database Logic & RLS Recursion
1. **Remove Recursive RLS**: I will replace the current RLS policies with a non-recursive approach. I will create a `SECURITY DEFINER` function called `is_super_admin()` that bypasses RLS to check roles safely.
2. **Repair Signup Trigger**: I will update the `handle_new_user` trigger to be more resilient, ensuring it doesn't fail if a profile already exists or if certain metadata is missing.
3. **Master Sync**: I will provide a single SQL script to run in your Supabase SQL Editor that will reset the security layer to a working state.

## Phase 2: UI Crash Prevention (The "Grey Screen" Fix)
1. **Master Scaffold Guard**: I will update the [MasterScaffold](file:///c:/Users/karlo/OneDrive/Pictures/Desktop/payparq.ai/apps/mobile-scanner/lib/main_scaffold.dart) to explicitly handle the "Error" and "Loading" states of your profile. This will replace the grey screen with a helpful "Error Loading Profile" message and a Retry button.
2. **Super Admin Navigation**: Ensure that the Super Admin role is correctly detected even if the initial database fetch is slow or partially fails.

## Phase 3: Deployment & Verification
1. Re-deploy the Edge Functions to ensure they are using the latest logic.
2. Re-build and deploy the web app to Firebase.

**Summary of what happened:**
- The database was "talking to itself" (Recursion) trying to figure out if you were a Super Admin, which caused it to crash.
- This crash prevented your profile from loading, leading to the "Grey Screen" in the app.
- The signup error was likely caused by this same database instability.

**Shall I proceed with applying these fixes?**
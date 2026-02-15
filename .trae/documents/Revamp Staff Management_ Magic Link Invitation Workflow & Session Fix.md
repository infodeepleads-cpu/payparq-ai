## Phase 1: Checkpoint Backup (v1.5.1)
1. I will create a dedicated migration file [v1.5.1_checkpoint.sql](file:///c:/Users/karlo/OneDrive/Pictures/Desktop/payparq.ai/supabase/migrations/20260117930000_v151_checkpoint.sql) to save the current stable state as requested.

## Phase 2: Fix Session Persistence (Login/Logout Bug)
1. **Clean Logout**: I will refactor the logout logic in [MasterScaffold](file:///c:/Users/karlo/OneDrive/Pictures/Desktop/payparq.ai/apps/mobile-scanner/lib/main_scaffold.dart) to explicitly reset all Riverpod providers (Profile, Locations, Selected Lot) upon signing out. This will prevent the "sticky session" issue where the next login attempt defaults to the previous user.
2. **State Reset**: I will ensure `selectedLocationIdProvider` is set to `null` immediately on logout.

## Phase 3: Revamp "Add Admin/Officer" (Magic Link Workflow)
1. **Edge Function Upgrade**: I will refactor the `create-officer` Edge Function to use `supabase.auth.admin.inviteUserByEmail()`. 
    - This will trigger a professional invitation email instead of requiring a manual password.
    - It will embed the `role` and `location_id` into the user metadata during the invitation process.
2. **Invitation UI**: I will simplify the [AddStaffScreen](file:///c:/Users/karlo/OneDrive/Pictures/Desktop/payparq.ai/apps/mobile-scanner/lib/features/management/screens/add_staff_screen.dart) dialog:
    - **Remove Password Field**: Users now set their own password during onboarding.
    - **Add Expiry Info**: Inform the Admin that the invitation link expires in 48 hours.
3. **Onboarding Flow**: I will ensure the mobile app handles the "Invite Link" callback, allowing new staff to set their password and enable MFA upon first login.

## Phase 4: Verification & Deployment
1. **Redeploy Edge Function**: Deploy the new invitation logic.
2. **Redeploy Web App**: Apply the UI and logout fixes.
3. **End-to-End Test**: Verify that an invitation is sent, the session clears on logout, and a new user can onboard via the link.

**Shall I proceed with this revamped Magic Link workflow and session fix?**
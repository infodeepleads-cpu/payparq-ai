## Phase 1: Database Resilience & Staff Creation Fix
1. **Expand Profile Roles**: I will update the `public.profiles` table to include `super_admin` in the allowed roles, resolving the "database error" during account creation.
2. **Robust Signup Trigger**: I will refactor the `handle_new_user()` trigger to use `ON CONFLICT` logic. This ensures that even if a profile partially exists (e.g., from an Edge Function call), the trigger will safely update it instead of crashing.

## Phase 2: Perfecting Lot Selection
1. **Smart Auto-Selection**: I will update the [availableLocationsProvider](file:///c:/Users/karlo/OneDrive/Pictures/Desktop/payparq.ai/apps/mobile-scanner/lib/logic/providers/auth_providers.dart) to be more proactive. It will now automatically select the first lot if:
    - No lot is currently selected.
    - The previously selected lot is no longer available (e.g., deleted or permission changed).
2. **Super Admin Fix**: This will resolve the issue where Super Admins see all lots but cannot choose them initially.

## Phase 3: Admin Data Visibility (Violations Fix)
1. **Simplified RLS**: I will simplify the `violations` table policies to ensure Admins can see all tickets for any lot they own, without relying on stale JWT metadata.
2. **Immediate Refresh**: I will ensure the [Violations Stream](file:///c:/Users/karlo/OneDrive/Pictures/Desktop/payparq.ai/apps/mobile-scanner/lib/features/management/repositories/parking_repository.dart) is perfectly synchronized with the global lot selector, so newly added tickets appear instantly on the Admin's screen.

## Phase 4: Verification & Deployment
1. **SQL Deployment**: Apply all database fixes.
2. **Web App Update**: Rebuild and redeploy the Flutter web app to apply the new selection logic.
3. **Edge Function Update**: Redeploy the `create-officer` function to verify staff creation works for both Admins and Super Admins.

**Shall I proceed with these fixes to ensure a smooth experience for your Admin accounts?**
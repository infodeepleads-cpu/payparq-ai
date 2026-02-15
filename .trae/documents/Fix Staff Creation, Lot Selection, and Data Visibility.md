## Phase 1: Fix Database Constraints & Triggers
1. **Update Profile Roles**: I will update the `public.profiles` table to explicitly allow the `super_admin` role in its check constraint, preventing the "database error" during staff creation.
2. **Robust Trigger**: I will refine the `handle_new_user()` trigger to gracefully handle all roles (including `super_admin`) and ensure it doesn't fail if metadata is partially missing.

## Phase 2: Refactor Lot Selection & Visibility
1. **Global Lot Selection**: I will refactor the [availableLocationsProvider](file:///c:/Users/karlo/OneDrive/Pictures/Desktop/payparq.ai/apps/mobile-scanner/lib/logic/providers/auth_providers.dart) to automatically initialize the `selectedLocationIdProvider` with the first available lot if it's currently null. This ensures that as soon as an Admin or Super Admin logs in, a lot is active.
2. **MasterScaffold Cleanup**: I will remove the fragile listeners in [MasterScaffold](file:///c:/Users/karlo/OneDrive/Pictures/Desktop/payparq.ai/apps/mobile-scanner/lib/main_scaffold.dart) and rely on the provider's own initialization for a "flicker-free" experience.

## Phase 3: Fix Data Scoping & Real-time Sync
1. **Violations Visibility**: I will update the [parkingRepositoryProvider](file:///c:/Users/karlo/OneDrive/Pictures/Desktop/payparq.ai/apps/mobile-scanner/lib/features/management/repositories/parking_repository.dart) to ensure that if a lot is selected, the stream is invalidated and re-fetched immediately. This will fix the issue where warnings/tickets were added but didn't show up.
2. **Edge Function Reliability**: I will redeploy the `create-officer` Edge Function with enhanced logging to catch any remaining edge cases in staff creation.

## Phase 4: Verification
1. **Admin Test**: Log in as Admin -> Verify automatic lot selection -> Add a ticket -> Verify immediate visibility.
2. **Super Admin Test**: Log in as Super Admin -> Verify global lot access and immediate toggler functionality.

**Shall I proceed with these fixes to stabilize the Admin and Super Admin environments?**
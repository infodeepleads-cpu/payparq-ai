## Phase 1: Make Staff List Reactive
1. **Refactor AddStaffScreen**: I will change the staff list from a static `FutureBuilder` to a reactive `StreamProvider`.
2. **Global Lot Filtering**: The staff list will now filter based on the **currently selected lot** in the top bar, instead of just the Admin's "default" lot. This ensures that when you switch lots, you see the correct team members for that specific lot.

## Phase 2: Fix Data Visibility (Cases & Tickets)
1. **Simplified Data Streams**: I will refactor the [Parking Repository](file:///c:/Users/karlo/OneDrive/Pictures/Desktop/payparq.ai/apps/mobile-scanner/lib/features/management/repositories/parking_repository.dart) to use direct Supabase streams for Violations and Staff.
2. **Instant Sync**: I will ensure that when a ticket or warning is issued, the list refreshes **immediately** across all Admin screens.

## Phase 3: Resolve "Red Lot" & Visibility Issues
1. **Smart Profile Sync**: I will update the [Auth Providers](file:///c:/Users/karlo/OneDrive/Pictures/Desktop/payparq.ai/apps/mobile-scanner/lib/logic/providers/auth_providers.dart) to perform a "hard sync" of your profile data upon login. This ensures that "Old Locations" are recognized instantly by the security system.
2. **Enhanced Lot Selector**: I will update the top bar selector to be more resilient. If it shows red, it will now offer a "Sync Now" option to refresh your permissions and locations from the database.

## Phase 4: Verification
1. **Admin Test**: Log in -> A lot is auto-selected -> Add a staff member -> It appears instantly in the list.
2. **Cross-Lot Test**: Switch to a different lot -> Add a warning -> Verify it appears in the "Cases" log for that specific lot.

**Shall I proceed with these fixes to finalize the Admin and Team management experience?**
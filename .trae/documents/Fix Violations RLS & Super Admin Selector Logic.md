## Phase 1: Checkpoint Backup
1. I will create a "Checkpoint" migration that serves as a snapshot of the current working system (v1.4.6) before applying fixes.

## Phase 2: Database RLS Overhaul (Fix for Postgres Exceptions)
1. **Violations RLS**: I will update the `violations` table policies to move away from restricted JWT metadata and use real ownership checks:
    - **Super Admins**: Full access to all violations.
    - **Admins**: Full access to violations where the lot's `owner_id` matches their `auth.uid()`.
    - **Officers**: Access to violations for lots assigned to them in `officer_assignments`.
2. **Parking Sessions RLS**: I will apply the same ownership-based logic to `parking_sessions` to ensure consistency across newly created lots.

## Phase 3: Flutter UI Refinement (Fix for Super Admin Selector)
1. **MasterScaffold Auto-Selection**: I will refactor the auto-selection logic in [MasterScaffold](file:///c:/Users/karlo/OneDrive/Pictures/Desktop/payparq.ai/apps/mobile-scanner/lib/main_scaffold.dart) to ensure that if no lot is selected, it immediately selects the first available one as soon as the location list is loaded.
2. **Top Bar Selector**: I will ensure the dropdown in the top bar is fully reactive and correctly handles the "Selected Lot" state for Super Admins who see the entire global list of lots.

## Phase 4: Verification
1. **Admin Verification**: Test adding a ticket/warning on a *newly created lot* to ensure the Postgres exception is resolved.
2. **Super Admin Verification**: Test initial login to ensure a lot is automatically selected and the toggler works as expected.

**Shall I proceed with these fixes?**
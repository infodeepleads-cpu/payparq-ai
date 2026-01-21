## Phase 1: Database Repair & Schema Update
1. **Assign Location ID**: I will provide a SQL script to manually assign a unique 5-digit `location_id` to `payparq@outlook.com` and create their first parking lot in the `locations` table.
2. **Schema Upgrade**: I will add a `location_id` (TEXT) column to the `violations` table so that enforcement actions are correctly grouped by lot ID.

## Phase 2: Repository Multi-Tenancy
1. **Violations Support**: I will update the [ParkingRepository](file:///c:/Users/karlo/OneDrive/Pictures/Desktop/payparq.ai/apps/mobile-scanner/lib/features/management/repositories/parking_repository.dart) to include a `getViolationsStream` and a corresponding `violationsStreamProvider`.
2. **Owner Filtering**: I will change the [locationsStreamProvider](file:///c:/Users/karlo/OneDrive/Pictures/Desktop/payparq.ai/apps/mobile-scanner/lib/features/management/repositories/parking_repository.dart) to filter by `owner_id` instead of a single ID. This allows an Admin to see the location they were assigned AND any new locations they add.

## Phase 3: UI & Enforcement Fixes
1. **Scoped Cases**: I will refactor the [CasesListView](file:///c:/Users/karlo/OneDrive/Pictures/Desktop/payparq.ai/apps/mobile-scanner/lib/features/enforcement/screens/cases_list_view.dart) to use the new `violationsStreamProvider`. Every "Quick Warning" or "Quick Ticket" will now automatically include the user's 5-digit Location ID.
2. **Badge Fix**: Ensure the profile badge in the sidebar correctly pulls the `location_id` from the database.

**Summary of what happened:**
- `payparq@outlook.com` was missing its assigned ID in the database, causing the `-----` display.
- The Cases screen was "global" and not filtering data by your specific lot.
- The Locations screen was filtering too strictly, potentially hiding new lots you created.

**Shall I proceed with these fixes?**
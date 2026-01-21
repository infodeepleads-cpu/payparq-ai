## Phase 1: Database & Logic Refactor
1. **Remove Auto-ID for Admins**: I will update the `handle_new_user` trigger so new Admins start with a blank slate (no pre-assigned `location_id`).
2. **Support Multiple Assignments**: I will create an `officer_assignments` table in Supabase. This allows Admins to link one or more locations to a specific Officer.
3. **Location State Management**: I will implement a `selectedLocationProvider` in Flutter. This will track which lot the Admin or Officer is currently managing.

## Phase 2: "Add Location" Enhancements
1. **Address-Based Registration**: I will replace the Latitude/Longitude fields with a single **Address** input.
2. **Automated Coordinates**: I will implement logic to automatically assign coordinates based on the address.
3. **Auto-ID Generation**: I will ensure every new location instantly receives its unique 5-digit `display_id` upon creation.

## Phase 3: Admin & Officer Workflow
1. **Blank Slate Redirect**: On first login, Admins with no locations will be guided to the **Add Location** tab.
2. **Location Switcher**: I will add a dropdown in the Top Bar (Mobile) and Sidebar (Desktop) allowing users to switch between their owned or assigned lots.
3. **Officer-Specific App View**: 
   - Officers will have a restricted view: **Scanner** (with photo upload), **Searchable Dashboard** (current lot data), and **Settings**.
   - They will **not** have access to pricing, staff management, or system settings.
4. **Staff Assignment**: I will update the **Add Admin/Officer** screen to let Admins pick from their active locations when assigning an Officer.

## Phase 4: Verification
1. **Admin Test**: Sign up as a new Admin -> see blank slate -> create lot -> Lot ID appears -> Lot becomes "Selected".
2. **Officer Test**: Assign an Officer to a lot -> Officer logs in -> only sees Scanner/Dashboard for that lot.

**Shall I proceed with this multi-tenancy and role-based overhaul?**
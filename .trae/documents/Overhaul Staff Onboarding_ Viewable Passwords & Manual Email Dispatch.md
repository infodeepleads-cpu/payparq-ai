## Phase 1: Database Migration (Password Storage)
1. **Schema Update**: I will add a `raw_password` column to the `profiles` table to store the generated password for your future reference.
2. **Trigger Logic**: I will update the `handle_new_user()` database trigger to automatically capture the password from the system metadata and save it into this new column instantly.

## Phase 2: Edge Function Overhaul (No Email Hurdles)
1. **Instant Account Creation**: The `create-officer` function will be refactored to use `createUser` with **Auto-Confirmation**. This bypasses all Supabase email workflows entirely.
2. **Email Suppression**: I will **disable** the automatic Supabase invitation email. The account will be live and ready for login the millisecond you click "Create."

## Phase 3: UI/UX Overhaul (Staff View Tab)
1. **View Credentials Button**: I will add a "View" (Eye) icon to every staff member in your list.
2. **Credential Dashboard**: Clicking "View" will open a dialog showing:
    - **User Email**
    - **Generated Password**
    - **Notify Button**: A simple "Send Email" button that serves as a notification trigger (no more complex invitation links).
3. **Admin Visibility Fix**: I will update the data streaming logic to ensure that regular Admins see their new staff members in the list immediately, matching the Super Admin experience.

## Phase 4: Verification
1. **Deployment**: Push all backend and frontend changes live.
2. **End-to-End Test**: Create a staff member -> Verify they appear in the list instantly -> View their password -> Log in immediately on another device.

**Shall I proceed with this streamlined "No-Email" instant onboarding process?**
## Phase 1: UI Renaming & Branding
1. **Sidebar Update**: I will rename "Add Admin/Officer" to **"Add Staff"** in the main navigation sidebar for a cleaner, unified look.
2. **Screen Overhaul**: I will update the [AddStaffScreen](file:///c:/Users/karlo/OneDrive/Pictures/Desktop/payparq.ai/apps/mobile-scanner/lib/features/management/screens/add_staff_screen.dart) headers and labels to consistently use "Staff" instead of "Admin/Officer".

## Phase 2: Instant Registration Workflow
1. **Direct Account Creation**: I will refactor the `create-officer` Edge Function to use `supabase.auth.admin.createUser()` with `email_confirm: true`.
    - **Benefit**: This skips the "Pending" state. The user is created and confirmed immediately.
    - **Instant Profile**: Because the account is confirmed, the database trigger will instantly create their profile, making them appear in your **Staff List** immediately as "Registered".
2. **Direct Login**: New staff members will be able to log in immediately using the temporary password without having to wait for or click an email link.

## Phase 3: Password Delivery & UX
1. **Password Display**: Since Supabase does not include passwords in automated emails for security, I will enhance the success dialog to show the **Temporary Password** in a large, copyable format.
2. **Metadata Integration**: I will embed the `temp_password` into the user's metadata. This allows you to customize your Supabase Email Templates in the dashboard to include the password using the `{{ .Data.temp_password }}` tag if desired.

## Phase 4: Verification
1. **Deployment**: Redeploy the updated Edge Function and the Flutter Web app.
2. **Test**: Create a "Manager" staff member -> Verify they appear in the list instantly -> Verify they can log in immediately with the generated password.

**Shall I proceed with these refinements to the staff onboarding process?**
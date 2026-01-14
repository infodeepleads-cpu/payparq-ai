I will fix the missing staff list and add the requested search functionality.

### 1. Enable Realtime for the Staff List
The reason the list isn't showing is likely because the `app_users` table isn't enabled for real-time updates in the database.
- **Action**: Create a migration to add `app_users` to the `supabase_realtime` publication.

### 2. Implement Search & Update UI
I will modify `AddStaffScreen` to:
- **Add Search Bar**: Insert a search text field above the staff list.
- **Implement Filtering**: Filter the displayed list based on the name or email entered.
- **Refresh Logic**: Ensure the list updates instantly when you add a new admin/officer.

### 3. Deploy
- **Build & Deploy**: Rebuild the web app and deploy to Vercel so you can see the changes at `https://payparq-flutter.vercel.app/`.

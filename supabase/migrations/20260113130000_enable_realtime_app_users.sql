-- Enable Realtime for app_users table so the stream works in the Flutter app
alter publication supabase_realtime add table app_users;

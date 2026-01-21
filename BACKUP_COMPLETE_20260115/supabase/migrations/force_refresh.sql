-- Force PostgREST schema cache reload
-- This is a standard Supabase/PostgREST command to refresh the API schema
NOTIFY pgrst, 'reload config';

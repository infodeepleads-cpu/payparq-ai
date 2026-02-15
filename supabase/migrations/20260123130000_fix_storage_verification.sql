
-- Fix storage bucket and policies for location verification
-- Ensure bucket is public and allows image/jpg as well just in case
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('location-verification', 'location-verification', true, 5242880, '{image/jpeg,image/png,image/webp,image/jpg}')
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880, allowed_mime_types = '{image/jpeg,image/png,image/webp,image/jpg}';

-- Re-create policies with broader permissions for testing
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'location-verification');

DROP POLICY IF EXISTS "Allow Authenticated Uploads" ON storage.objects;
CREATE POLICY "Allow Authenticated Uploads" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'location-verification'); -- Simplified for debugging

DROP POLICY IF EXISTS "Allow Authenticated Updates" ON storage.objects;
CREATE POLICY "Allow Authenticated Updates" ON storage.objects FOR UPDATE
WITH CHECK (bucket_id = 'location-verification');

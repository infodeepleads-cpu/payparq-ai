-- Create Verification Status Enum
DO $$ BEGIN
    CREATE TYPE public.verification_status AS ENUM (
        'unverified', 
        'pending', 
        'verified', 
        'video_required', 
        'call_scheduled',
        'rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add verification fields to locations table
ALTER TABLE public.locations 
ADD COLUMN IF NOT EXISTS verification_status public.verification_status DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS verification_photos TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS verification_metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS verification_submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_reviewed_by UUID REFERENCES auth.users(id);

-- Add comments for clarity
COMMENT ON COLUMN public.locations.verification_status IS 'The verification state of the parking lot';
COMMENT ON COLUMN public.locations.verification_photos IS 'Array of URLs to verification images stored in Supabase Storage';
COMMENT ON COLUMN public.locations.verification_metadata IS 'Additional admin notes, video links, or call schedules';

-- Set up Storage for Verifications
INSERT INTO storage.buckets (id, name, public) 
VALUES ('location-verifications', 'location-verifications', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for Storage
-- 1. Owners can upload their own verification photos
CREATE POLICY "Owners can upload verification photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'location-verifications' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Super Admins can see all verification photos
CREATE POLICY "Super Admins can view all verification photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'location-verifications' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
  )
);

-- 3. Owners can see their own verification photos
CREATE POLICY "Owners can view their own verification photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'location-verifications' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

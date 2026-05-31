-- Add booking_source column to parking_sessions table for commission tracking
ALTER TABLE public.parking_sessions
ADD COLUMN IF NOT EXISTS booking_source VARCHAR(50) DEFAULT 'platform'
CHECK (booking_source IN ('platform', 'airport', 'member'));

-- Create index for faster querying
CREATE INDEX IF NOT EXISTS idx_parking_sessions_booking_source
ON public.parking_sessions(booking_source);

-- Add comment for documentation
COMMENT ON COLUMN public.parking_sessions.booking_source IS
  'Source of booking: platform (www.payparq.com), airport (airport landing pages), or member (quick-res member links). Default 25% commission for platform and airport, 0% for member.';

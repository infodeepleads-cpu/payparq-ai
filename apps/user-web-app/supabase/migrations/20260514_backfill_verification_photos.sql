-- Backfill verification_photos column from verification_metadata for existing locations
UPDATE locations
SET verification_photos = (
  CASE
    WHEN verification_metadata ->> 'photos' IS NOT NULL THEN
      (verification_metadata ->> 'photos')::text[]
    WHEN verification_metadata ->> 'verification_photos' IS NOT NULL THEN
      (verification_metadata ->> 'verification_photos')::text[]
    ELSE NULL
  END
)
WHERE verification_photos IS NULL
  AND verification_metadata IS NOT NULL
  AND (
    verification_metadata ->> 'photos' IS NOT NULL
    OR verification_metadata ->> 'verification_photos' IS NOT NULL
  );

-- Log results
SELECT
  COUNT(*) as locations_updated,
  COUNT(CASE WHEN verification_photos IS NOT NULL THEN 1 END) as with_photos
FROM locations
WHERE verification_status = 'pending' OR verification_status = 'verified';

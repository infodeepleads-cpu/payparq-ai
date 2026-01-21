-- CHECKPOINT BACKUP V1.4.6
-- This file marks the stable state before applying multi-lot RLS ownership fixes.
-- No schema changes in this file, just a reference point.

-- Current state of policies:
-- 1. Profiles: JWT-based access
-- 2. Locations: JWT-based + owner_id + officer_assignments
-- 3. Sessions: JWT-based (Restrictive)
-- 4. Violations: JWT-based (Restrictive)
-- 5. Officer Assignments: Role-based

SELECT 'V1.4.6 Checkpoint Applied' as status;

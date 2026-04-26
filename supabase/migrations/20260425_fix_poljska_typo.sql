-- Fix typo: replace "poljska" with "polaska" in all location fields
-- This handles description, notes, and other text fields that might contain the typo

-- Update description field if it exists
DO $$
BEGIN
  UPDATE locations SET description = REPLACE(description, 'poljska', 'polaska')
  WHERE description IS NOT NULL AND description LIKE '%poljska%';
EXCEPTION WHEN OTHERS THEN
  NULL; -- Column doesn't exist, skip
END $$;

-- Update notes field if it exists
DO $$
BEGIN
  UPDATE locations SET notes = REPLACE(notes, 'poljska', 'polaska')
  WHERE notes IS NOT NULL AND notes LIKE '%poljska%';
EXCEPTION WHEN OTHERS THEN
  NULL; -- Column doesn't exist, skip
END $$;

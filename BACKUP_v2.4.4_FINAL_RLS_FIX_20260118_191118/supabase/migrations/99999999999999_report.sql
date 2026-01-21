-- Multi-Tenancy Verification Script
-- Run this to check current account statuses

DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '--- USER PROFILES REPORT ---';
  FOR r IN (SELECT id, email, role, location_id FROM public.profiles WHERE email IN ('kzamic@gmail.com', 'payparq@outlook.com', 'admin@payparq.ai')) LOOP
    RAISE NOTICE 'Email: %, Role: %, Location ID: %', r.email, r.role, r.location_id;
  END LOOP;
  
  RAISE NOTICE '--- LOCATION OWNERSHIP REPORT ---';
  FOR r IN (SELECT l.display_id, l.name, p.email as owner_email FROM public.locations l JOIN public.profiles p ON l.owner_id = p.id) LOOP
    RAISE NOTICE 'Location ID: %, Name: %, Owner: %', r.display_id, r.name, r.owner_email;
  END LOOP;
END $$;

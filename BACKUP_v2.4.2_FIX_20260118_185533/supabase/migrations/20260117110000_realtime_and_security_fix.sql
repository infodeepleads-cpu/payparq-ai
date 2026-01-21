-- RELIABILITY AND REALTIME FIX

-- 1. Enable Realtime for profiles table (Required for StreamProvider)
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- 2. Hard-Fix Security Functions (Explicit search path to prevent recursion/scope errors)
CREATE OR REPLACE FUNCTION public.get_auth_role() 
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_auth_location_id() 
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT location_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Explicit Self-Access Policy (Highest priority, no recursion)
DROP POLICY IF EXISTS "Profiles_Self_Access" ON public.profiles;
CREATE POLICY "Profiles_Self_Access" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- 4. Update Profiles Isolation (For other team members)
DROP POLICY IF EXISTS "Profiles_Isolation" ON public.profiles;
CREATE POLICY "Profiles_Isolation" ON public.profiles
  FOR ALL USING (
    public.get_auth_role() = 'super_admin' OR
    id = auth.uid() OR
    location_id = public.get_auth_location_id()
  );

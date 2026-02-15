-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'officer', 'user')),
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LOCATIONS / LOTS
CREATE TABLE public.locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  owner_id UUID REFERENCES public.profiles(id),
  total_spots INTEGER DEFAULT 0,
  occupancy INTEGER DEFAULT 0,
  pricing_rules TEXT, -- Stored as text string for DeepSeek parsing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRICING SETTINGS (Global or overridden by location)
CREATE TABLE public.pricing_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  location_id UUID REFERENCES public.locations(id),
  rules_text TEXT NOT NULL, -- "Weekdays $5/hr, Weekends $10/hr..."
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PARKING SESSIONS (Core Data)
CREATE TABLE public.parking_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  location_id UUID REFERENCES public.locations(id) NOT NULL,
  plate TEXT NOT NULL,
  mobile TEXT,
  email TEXT,
  name TEXT,
  
  entry_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exit_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  
  price NUMERIC(10, 2),
  currency TEXT DEFAULT 'usd',
  
  stripe_session_id TEXT,
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'open')),
  
  evidence_r2_url TEXT, -- URL to image in Cloudflare R2
  evidence_r2_url_exit TEXT, -- Optional exit image
  
  ai_risk_score INTEGER, -- 0-100
  ai_reasoning TEXT, -- Explanation from DeepSeek
  
  is_lpr_scan BOOLEAN DEFAULT FALSE,
  is_whatsapp_linked BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SCANS (Raw LPR / Mobile Scans)
CREATE TABLE public.scans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.parking_sessions(id),
  location_id UUID REFERENCES public.locations(id),
  scanner_user_id UUID REFERENCES public.profiles(id),
  
  plate_text_raw TEXT, -- Raw OCR
  plate_text_clean TEXT, -- DeepSeek cleaned
  confidence_score NUMERIC,
  
  image_url TEXT,
  scan_time TIMESTAMPTZ DEFAULT NOW(),
  scan_type TEXT CHECK (scan_type IN ('entry', 'exit', 'check', 'violation'))
);

-- VIOLATIONS (Overstays, etc.)
CREATE TABLE public.violations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.parking_sessions(id),
  plate TEXT NOT NULL,
  violation_type TEXT NOT NULL,
  fine_amount NUMERIC(10, 2),
  status TEXT DEFAULT 'issued', -- issued, paid, appealed, void
  location_id UUID REFERENCES public.locations(id), -- Added for lot tracking
  evidence_r2_url TEXT, -- URL to image in Cloudflare R2
  is_lpr_scan BOOLEAN DEFAULT FALSE,
  issued_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violations ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view own profile. Admins can view all.
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins view all profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Locations: Admins view all. Officers view assigned (need assignment table, simplified for now to all for officers)
CREATE POLICY "Admins and Officers view locations" ON public.locations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'officer'))
  );

-- Parking Sessions: Admins view all. Officers view all. Users view own (via email/mobile matching or user_id if linked)
CREATE POLICY "Admins and Officers manage sessions" ON public.parking_sessions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'officer'))
  );

-- REALTIME SUBSCRIPTION
-- Enable Realtime for specific tables (dashboard updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.parking_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scans;

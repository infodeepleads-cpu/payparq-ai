import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const setCookie = (key: string, value: string) => {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

const getCookie = (key: string): string | null => {
  const encodedKey = encodeURIComponent(key);
  const match = document.cookie.split('; ').find(row => row.startsWith(encodedKey + '='));
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
};

const deleteCookie = (key: string) => {
  document.cookie = `${encodeURIComponent(key)}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`;
};

// Hybrid storage: PKCE verifier goes into cookies (shared across iOS PWA/Safari contexts).
// Sessions stay in localStorage (cookies have 4KB limit — session JSON exceeds it).
const hybridStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    // Try localStorage first, fall back to cookie (for cross-context PKCE)
    const ls = localStorage.getItem(key);
    if (ls !== null) return ls;
    return getCookie(key);
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
    // Also mirror PKCE verifier to cookie so iOS PWA callback page can read it
    if (key.includes('code-verifier')) {
      setCookie(key, value);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
    if (key.includes('code-verifier')) {
      deleteCookie(key);
    }
  },
};

export const supabase = isSupabaseConfigured && supabaseUrl && supabaseAnonKey && isValidUrl(supabaseUrl)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage: hybridStorage,
      },
    })
  : null;

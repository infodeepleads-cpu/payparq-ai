"use client";
import { useState, useEffect } from "react";
import { getSupabase } from "../../lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";

export const dynamic = "force-dynamic";

export default function Auth() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    setMounted(true);
  }, []);

  const signIn = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        window.location.href = "/";
      }
    } catch (err: any) {
      setError(err.message || t('auth_error_generic'));
      setLoading(false);
    }
  };

  const signUp = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/confirm` : undefined,
          data: { full_name: name }
        },
      });

      if (error) {
        setError(error.message);
      } else if (data.session) {
        window.location.href = "/";
        return;
      } else {
        setMessage(t('auth_confirmation_sent').replace('{email}', email));
        setEmail("");
        setPassword("");
      }
      setLoading(false);
    } catch (err: any) {
      setError(err.message || t('auth_error_generic'));
      setLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError(t('auth_missing_fields'));
      return;
    }
    
    if (mode === "signin") {
      await signIn();
    } else {
      await signUp();
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen w-full font-sans items-center justify-center bg-white p-4">
      <div className="w-[85%] max-w-[300px] space-y-5 mx-auto -translate-x-4">
        <div className="text-center space-y-2">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">PayParq Manager</h2>
          <h1 className="text-lg font-semibold tracking-tight">{mode === "signin" ? t('welcome_back') : t('create_account')}</h1>
        </div>
        
        <div className="grid grid-cols-2 gap-1 p-1 bg-white rounded-full">
          <button
            onClick={() => {
              setMode("signin");
              setError(null);
              setMessage(null);
            }}
            className={`py-2 text-xs font-medium rounded-full transition-all ${mode === "signin" ? "bg-black text-white shadow-sm" : "bg-white text-black"}`}
          >
            {t('sign_in')}
          </button>
          <button
            onClick={() => {
              setMode("signup");
              setError(null);
              setMessage(null);
            }}
            className={`py-2 text-xs font-medium rounded-full transition-all ${mode === "signup" ? "bg-black text-white shadow-sm" : "bg-white text-black"}`}
          >
            {t('create_account_btn')}
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-3">
            {mode === "signup" && (
              <div className="relative flex items-center w-full h-10 bg-white border border-gray-200 shadow-pill rounded-full">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('full_name')}
                  className="flex-1 bg-transparent border-0 px-4 text-xs placeholder:text-gray-400 focus:ring-0 focus:outline-none"
                />
              </div>
            )}
            <div className="relative flex items-center w-full h-10 bg-white border border-gray-200 shadow-pill rounded-full">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="flex-1 bg-transparent border-0 px-4 text-xs placeholder:text-gray-400 focus:ring-0 focus:outline-none"
              />
            </div>
            <div className="relative flex items-center w-full h-10 bg-white border border-gray-200 shadow-pill rounded-full">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('password')}
                className="flex-1 bg-transparent border-0 px-4 text-xs placeholder:text-gray-400 focus:ring-0 focus:outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center w-full h-10 rounded-full bg-black px-8 text-xs font-medium text-white shadow transition-colors hover:bg-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> : mode === "signup" ? t('sign_up_email') : t('sign_in')}
          </button>
        </form>

        <div className="min-h-[20px] text-center">
          {message && <p className="text-xs text-green-600">{message}</p>}
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="text-center text-[10px] text-gray-500">
          {t('auth_terms_agreement')
            .split('{terms}').flatMap((part, i, arr) => 
              i === arr.length - 1 ? [part] : [part, <a key="terms" href="https://www.payparq.com/terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 text-black">{t('terms')}</a>]
            )
            .flatMap((part, i, arr) => {
              if (typeof part !== 'string') return [part];
              return part.split('{privacy}').flatMap((p, j, a) => 
                j === a.length - 1 ? [p] : [p, <a key="privacy" href="https://www.payparq.com/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 text-black">{t('privacy')}</a>]
              );
            })
          }
        </div>
      </div>
    </div>
  );
}

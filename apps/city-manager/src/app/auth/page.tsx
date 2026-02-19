"use client";
import { useState, useEffect } from "react";
import { getSupabase } from "../../lib/supabase";
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
      setError(err.message || "An unexpected error occurred");
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
        // Email confirmation is disabled, user is signed in immediately
        window.location.href = "/";
        return;
      } else {
        setMessage(`Confirmation email sent to ${email}. Please check your spam folder.`);
        setEmail("");
        setPassword("");
      }
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
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
    <div className="flex min-h-screen w-full font-sans">
      <div className="hidden lg:flex w-[45%] bg-black flex-col justify-between p-16 text-white relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-xl font-bold tracking-tighter">machine.io</span>
        </div>
        <div className="relative z-10 max-w-lg">
          <blockquote className="text-4xl font-light leading-tight tracking-tight">
            "machine.io invites you to challenge it so we can go deeper."
          </blockquote>
        </div>
        <div className="relative z-10 text-xs text-white/40">© 2026 machine.io</div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_50%)] pointer-events-none" />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white text-gray-900 overflow-y-auto">
        <div className="w-full max-w-[380px] space-y-10">
          <div className="lg:hidden text-center mb-8">
            <span className="text-xl font-bold tracking-tighter">machine.io</span>
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">{mode === "signin" ? "Welcome back" : "Create an account"}</h1>
          </div>
          <div className="grid grid-cols-2 gap-1 p-1 bg-white rounded-full">
            <button
              onClick={() => {
                setMode("signin");
                setError(null);
                setMessage(null);
              }}
              className={`py-2.5 text-sm font-medium rounded-full transition-all ${mode === "signin" ? "bg-black text-white shadow-sm" : "bg-white text-black"}`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode("signup");
                setError(null);
                setMessage(null);
              }}
              className={`py-2.5 text-sm font-medium rounded-full transition-all ${mode === "signup" ? "bg-black text-white shadow-sm" : "bg-white text-black"}`}
            >
              Create Account
            </button>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-4">
              {mode === "signup" && (
                <div className="relative flex items-center w-full h-14 bg-white border border-gray-200 shadow-pill rounded-full">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="flex-1 bg-transparent border-0 px-4 text-sm placeholder:text-gray-400 focus:ring-0 focus:outline-none"
                  />
                </div>
              )}
              <div className="relative flex items-center w-full h-14 bg-white border border-gray-200 shadow-pill rounded-full">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="flex-1 bg-transparent border-0 px-4 text-sm placeholder:text-gray-400 focus:ring-0 focus:outline-none"
                />
              </div>
              <div className="relative flex items-center w-full h-14 bg-white border border-gray-200 shadow-pill rounded-full">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="flex-1 bg-transparent border-0 px-4 text-sm placeholder:text-gray-400 focus:ring-0 focus:outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center w-full h-14 rounded-full bg-black px-8 text-sm font-medium text-white shadow transition-colors hover:bg-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : mode === "signup" ? "Sign up with Email" : "Sign In"}
            </button>
          </form>
          <div className="min-h-[20px] text-center">
            {message && <p className="text-sm text-green-600">{message}</p>}
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <div className="text-center text-xs text-gray-500">
            By clicking continue, you agree to our{" "}
            <a href="https://www.payparq.com/terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 text-black">Terms of Service</a>{" "}
            and{" "}
            <a href="https://www.payparq.com/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 text-black">Privacy Policy</a>.
          </div>
        </div>
      </div>
    </div>
  );
}

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
    <div className="flex min-h-screen w-full font-sans items-center justify-center bg-white p-4">
      <div className="w-[85%] max-w-[300px] space-y-5 mx-auto -translate-x-4">
        <div className="text-center space-y-2">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">PayParq Manager</h2>
          <h1 className="text-lg font-semibold tracking-tight">{mode === "signin" ? "Welcome back" : "Create an account"}</h1>
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
            Sign In
          </button>
          <button
            onClick={() => {
              setMode("signup");
              setError(null);
              setMessage(null);
            }}
            className={`py-2 text-xs font-medium rounded-full transition-all ${mode === "signup" ? "bg-black text-white shadow-sm" : "bg-white text-black"}`}
          >
            Create Account
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
                  placeholder="Full Name"
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
                placeholder="Password"
                className="flex-1 bg-transparent border-0 px-4 text-xs placeholder:text-gray-400 focus:ring-0 focus:outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center w-full h-10 rounded-full bg-black px-8 text-xs font-medium text-white shadow transition-colors hover:bg-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> : mode === "signup" ? "Sign up with Email" : "Sign In"}
          </button>
        </form>

        <div className="min-h-[20px] text-center">
          {message && <p className="text-xs text-green-600">{message}</p>}
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="text-center text-[10px] text-gray-500">
          By clicking continue, you agree to our{" "}
          <a href="https://www.payparq.com/terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 text-black">Terms</a>{" "}
          and{" "}
          <a href="https://www.payparq.com/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 text-black">Privacy Policy</a>.
        </div>
      </div>
    </div>
  );
}

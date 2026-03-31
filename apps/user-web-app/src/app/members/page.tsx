'use client';

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { FooterBrand } from "@/components/FooterBrand";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type NavItemId =
  | "account"
  | "home"
  | "monthly"
  | "activity"
  | "company"
  | "payment"
  | "vehicles"
  | "promotions"
  | "rewards"
  | "help";
type FlowType = "park_now" | "monthly" | "reserve";
type ActivityRow = {
  id: string;
  created_at?: string | null;
  location_id?: string | null;
  plate?: string | null;
  price?: number | null;
  currency?: string | null;
  payment_status?: string | null;
  status?: string | null;
  entry_time?: string | null;
  exit_time?: string | null;
};

function normalizeRole(value: unknown) {
  const normalized = (value ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
  if (normalized === "superadmin" || normalized.startsWith("super_admin")) {
    return "super_admin";
  }
  if (normalized.startsWith("admin")) {
    return "admin";
  }
  if (normalized.startsWith("manager")) {
    return "manager";
  }
  if (normalized.startsWith("officer")) {
    return "officer";
  }
  return "officer";
}

export default function MembersPage() {

  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [loginNotice, setLoginNotice] = useState("");
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationNotice, setVerificationNotice] = useState("");

  const [activeItem, setActiveItem] = useState<NavItemId>("home");
  const [plates, setPlates] = useState<string[]>([]);
  const [newPlate, setNewPlate] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [actionLocation, setActionLocation] = useState("");
  const [actionProcessing, setActionProcessing] = useState<FlowType | null>(null);
  const [actionError, setActionError] = useState("");
  const [activityFavorite, setActivityFavorite] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityRows, setActivityRows] = useState<ActivityRow[]>([]);

  const [devSignedIn, setDevSignedIn] = useState(false);

  const isLocalDevOverrideEnabled =
    process.env.NODE_ENV === "development" && !isSupabaseConfigured;

  const displayEmail =
    user?.email || (devSignedIn ? "dev@local.test" : "Unknown email");

  const [homeFlow, setHomeFlow] = useState<"park_now" | "monthly" | "reserve">("park_now");
  const [homeOpen, setHomeOpen] = useState(true);

  const isSignedIn = !!user || devSignedIn;
  const isEmailVerified = devSignedIn || Boolean((user as { email_confirmed_at?: string | null } | null)?.email_confirmed_at);

  function parseCurrency(value: string | null | undefined) {
    const normalized = (value ?? "eur").toString().toUpperCase();
    return normalized;
  }

  function formatActivityDate(value: string | null | undefined) {
    if (!value) return "Unknown time";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  }
  function formatCroatianDateTime(value: string | null | undefined) {
    if (!value) return "Nije dostupno";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("hr-HR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Europe/Zagreb",
    });
  }

  function resolveSafeNextPath(value: string | null | undefined) {
    const fallback = "/members";
    const trimmed = (value ?? "").trim();
    if (!trimmed) return fallback;
    if (trimmed.startsWith("/")) return trimmed;
    try {
      if (typeof window === "undefined") return fallback;
      const parsed = new URL(trimmed);
      if (parsed.origin !== window.location.origin) return fallback;
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      return fallback;
    }
  }

  function formatOtpError(message: string) {
    const normalized = message.toLowerCase();
    if (normalized.includes("redirect") && normalized.includes("allow")) {
      return "Redirect URL nije dopušten u Supabase postavkama. Dodajte Members URL u Auth URL Configuration.";
    }
    if (normalized.includes("error sending magic link email")) {
      return "Pogreška pri slanju e-pošte s čarobnom vezom. U Supabase Auth provjerite Email provider, SMTP postavke i Redirect URL.";
    }
    if (normalized.includes("email address not authorized")) {
      return "Adresa e-pošte nije odobrena za slanje. Potvrdite sender domenu i mailbox u SMTP servisu.";
    }
    if (normalized.includes("signups not allowed")) {
      return "Registracije su isključene u Supabase projektu. Uključite Email sign-in i dopustite kreiranje korisnika.";
    }
    if (normalized.includes("invalid login credentials")) {
      return "Prijava nije uspjela. Pokušajte ponovno kroz link iz e-pošte.";
    }
    return message;
  }

  async function resolveIsAdmin(currentUser: User | null) {
    if (!currentUser || !supabase) {
      setIsAdmin(false);
      return;
    }
    try {
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", currentUser.id)
        .maybeSingle();
      const role = normalizeRole(
        (profileRow as { role?: unknown } | null)?.role ??
          currentUser.user_metadata?.role ??
          currentUser.app_metadata?.role
      );
      setIsAdmin(role === "admin" || role === "super_admin");
    } catch {
      const fallbackRole = normalizeRole(
        currentUser.user_metadata?.role ?? currentUser.app_metadata?.role
      );
      setIsAdmin(fallbackRole === "admin" || fallbackRole === "super_admin");
    }
  }

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      setUser(null);
      setIsAdmin(false);
      return;
    }

    let cancelled = false;

    supabase.auth
      .getUser()
      .then(async ({ data, error }) => {
        if (cancelled) return;
        if (!error && data.user) {
          setUser(data.user);
          await resolveIsAdmin(data.user);
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setIsAdmin(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setUser(session?.user ?? null);
      if (!session?.user) {
        setIsAdmin(false);
      } else {
        void resolveIsAdmin(session.user);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tokenHash = (params.get("token_hash") ?? "").trim();
    const code = (params.get("code") ?? "").trim();
    if (!tokenHash && !code) return;
    if (!supabase || !isSupabaseConfigured) {
      setAuthError("Members sign-in is not configured for this environment.");
      return;
    }
    const client = supabase;

    const otpType = (params.get("type") ?? "magiclink").trim().toLowerCase();
    const safeNextPath = resolveSafeNextPath(params.get("next"));
    let cancelled = false;

    setAuthLoading(true);
    setAuthError("");
    setLoginNotice("Potvrđujemo prijavu...");

    const run = async () => {
      try {
        let data: { user: User | null } | null = null;
        let error: { message: string } | null = null;
        if (tokenHash) {
          const verifyResult = await client.auth.verifyOtp({
            type: otpType === "recovery" ? "recovery" : "magiclink",
            token_hash: tokenHash,
          } as {
            type: "magiclink" | "recovery";
            token_hash: string;
          });
          data = verifyResult.data as { user: User | null } | null;
          error = verifyResult.error ? { message: verifyResult.error.message } : null;
        } else if (code) {
          const exchangeResult = await client.auth.exchangeCodeForSession(code);
          data = exchangeResult.data as { user: User | null } | null;
          error = exchangeResult.error ? { message: exchangeResult.error.message } : null;
        }
        if (cancelled) return;
        if (error) {
          setAuthError(formatOtpError(error.message));
          setLoginNotice("");
          return;
        }
        if (data?.user) {
          setUser(data.user);
          void resolveIsAdmin(data.user);
        }
        const cleaned = new URL(window.location.href);
        cleaned.searchParams.delete("token_hash");
        cleaned.searchParams.delete("type");
        cleaned.searchParams.delete("next");
        cleaned.searchParams.delete("code");
        const nextPath = safeNextPath || cleaned.pathname;
        window.history.replaceState({}, "", `${nextPath}${cleaned.search}${cleaned.hash}`);
        setLoginNotice("");
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const prefillEmail = (params.get("email") ?? "").trim().toLowerCase();
    const tab = (params.get("tab") ?? "").trim().toLowerCase();
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
    if (
      tab === "home" ||
      tab === "monthly" ||
      tab === "activity" ||
      tab === "company" ||
      tab === "payment" ||
      tab === "vehicles" ||
      tab === "promotions" ||
      tab === "rewards" ||
      tab === "help" ||
      tab === "account"
    ) {
      setActiveItem(tab as NavItemId);
    }
  }, []);

  useEffect(() => {
    if (!isSignedIn || !user?.email || !supabase || !isSupabaseConfigured) {
      setActivityRows([]);
      return;
    }
    const client = supabase;
    let active = true;
    const run = async () => {
      setActivityLoading(true);
      try {
        const { data, error } = await client
          .from("parking_sessions")
          .select("id,created_at,location_id,plate,price,currency,payment_status,status,entry_time,exit_time")
          .eq("email", user.email)
          .order("created_at", { ascending: false })
          .limit(20);
        if (!active) return;
        if (error) {
          setActivityRows([]);
          return;
        }
        setActivityRows((data ?? []) as ActivityRow[]);
      } catch {
        if (!active) return;
        setActivityRows([]);
      } finally {
        if (!active) return;
        setActivityLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [isSignedIn, user?.email]);

  useEffect(() => {
    if (!isSignedIn || typeof window === "undefined" || activityRows.length === 0) {
      return;
    }
    if (!("Notification" in window)) {
      return;
    }
    if (Notification.permission === "default") {
      void Notification.requestPermission();
    }
    const timers: number[] = [];
    const now = Date.now();
    for (const row of activityRows) {
      if (!row.exit_time) continue;
      const exitDate = new Date(row.exit_time);
      if (Number.isNaN(exitDate.getTime())) continue;
      const notifyAt = exitDate.getTime() - 10 * 60 * 1000;
      const message = `Sesija za lokaciju ${row.location_id || "Nepoznata lokacija"} istječe za 10 minuta. Otvorite Members za produljenje.`;
      if (notifyAt <= now) {
        if (exitDate.getTime() > now && Notification.permission === "granted") {
          new Notification("Payparq podsjetnik", { body: message });
        }
        continue;
      }
      const delay = notifyAt - now;
      const timerId = window.setTimeout(() => {
        if (Notification.permission === "granted") {
          new Notification("Payparq podsjetnik", { body: message });
        }
      }, delay);
      timers.push(timerId);
    }
    return () => {
      for (const timerId of timers) {
        window.clearTimeout(timerId);
      }
    };
  }, [activityRows, isSignedIn]);

  async function handleAuth(event: FormEvent) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setAuthError("Enter your email.");
      return;
    }

    if (!supabase || !isSupabaseConfigured) {
      setAuthError("Members sign-in is not configured for this environment.");
      return;
    }

    setAuthLoading(true);
    setAuthError("");
    setLoginNotice("");

    try {
      const redirectTo = "/members";
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          redirectTo,
          source: "members_login",
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; id?: string; error?: string; email?: string }
        | null;
      if (!response.ok || !payload?.ok || !payload?.id) {
        setAuthError(formatOtpError(payload?.error || "Unable to send sign-in email."));
      } else {
        setLoginNotice(`Sign-in email sent to ${payload?.email || normalizedEmail}. Check Inbox and Junk/Spam.`);
      }
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSignOut() {
    setDevSignedIn(false);
    if (!supabase || !isSupabaseConfigured) {
      return;
    }
    await supabase.auth.signOut();
  }
  async function handleCheckout(flow: FlowType, location: string) {
    const value = location.trim();
    if (!value) {
      setActionError("Enter a location ID or name from on-site signage.");
      return;
    }
    setActionProcessing(flow);
    setActionError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location_id: value,
          plate_number: "",
          customer_email: user?.email,
          flow_type: flow,
        }),
      });
      if (!res.ok) {
        setActionError("Unable to start checkout. Please try again.");
        setActionProcessing(null);
        return;
      }
      const data = (await res.json().catch(() => null)) as { url?: string } | null;
      if (!data?.url) {
        setActionError("Checkout link not available. Please try again.");
        setActionProcessing(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      setActionError("Something went wrong. Please try again.");
      setActionProcessing(null);
    }
  }
  async function handleResetPassword() {
    if (!user?.email) {
      setAuthError("No email available for reset.");
      return;
    }
    if (!supabase || !isSupabaseConfigured) {
      setAuthError("Reset is not configured for this environment.");
      return;
    }
    try {
      await supabase.auth.resetPasswordForEmail(user.email);
      setAuthError("Check your email for the reset link.");
    } catch {
      setAuthError("Unable to send reset email right now.");
    }
  }

  async function handleAddPaymentMethod() {
    if (!user?.email) {
      setActionError("Sign in to add a payment method.");
      return;
    }
    setActionProcessing("park_now");
    setActionError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flow_type: "setup",
          customer_email: user.email,
        }),
      });
      if (!res.ok) {
        setActionError("Unable to open secure payment setup.");
        setActionProcessing(null);
        return;
      }
      const data = (await res.json().catch(() => null)) as { url?: string } | null;
      if (!data?.url) {
        setActionError("Setup link not available. Please try again.");
        setActionProcessing(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      setActionError("Something went wrong. Please try again.");
      setActionProcessing(null);
    }
  }

  async function handleSendVerificationEmail() {
    const targetEmail = user?.email || email.trim().toLowerCase();
    if (!targetEmail) {
      setVerificationNotice("No email available for verification.");
      return;
    }
    if (!supabase || !isSupabaseConfigured) {
      setVerificationNotice("Verification is not configured for this environment.");
      return;
    }
    setVerificationLoading(true);
    setVerificationNotice("");
    try {
      const redirectTo = "/members?tab=promotions";
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          redirectTo,
          source: "members_verification",
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; id?: string; error?: string; email?: string }
        | null;
      if (!response.ok || !payload?.ok || !payload?.id) {
        setVerificationNotice(formatOtpError(payload?.error || "Unable to send verification email right now."));
      } else {
        setVerificationNotice(
          `Verification email sent to ${payload?.email || targetEmail}. Check Inbox and Junk/Spam.`
        );
      }
    } catch {
      setVerificationNotice("Unable to send verification email right now.");
    } finally {
      setVerificationLoading(false);
    }
  }

  function renderActiveContent() {
    if (activeItem === "account") {
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight text-black">
              Account settings
            </h2>
            <p className="text-sm text-black/70">
              Review the basics connected to your Payparq profile.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-black/5 bg-black/[0.02] p-4 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/60">
                Profile
              </p>
              <p className="text-sm text-black/80">
                Signed in as <span className="font-semibold">{displayEmail}</span>
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {!isEmailVerified && (
                  <button
                    type="button"
                    onClick={handleSendVerificationEmail}
                    disabled={verificationLoading}
                    className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#5F3DFC] text-white text-[11px] font-semibold hover:bg-[#4330c4] transition-colors disabled:opacity-60"
                  >
                    {verificationLoading ? "Sending..." : "Verify email"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="inline-flex items-center px-3 py-1.5 rounded-full bg-black text-white text-[11px] font-semibold hover:bg-gray-900 transition-colors"
                >
                  Reset password
                </button>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(displayEmail)}
                  className="inline-flex items-center px-3 py-1.5 rounded-full border border-black/10 text-[11px] font-semibold hover:bg-black/5 transition-colors"
                >
                  Copy email
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center px-3 py-1.5 rounded-full border border-black/10 text-[11px] font-semibold hover:bg-black/5 transition-colors"
                >
                  Log out
                </button>
                <button
                  type="button"
                  onClick={() => setVerificationNotice("You have opted out of promotions.")}
                  className="inline-flex items-center px-3 py-1.5 rounded-full border border-black/10 text-[11px] font-semibold hover:bg-black/5 transition-colors"
                >
                  Opt out
                </button>
                <button
                  type="button"
                  onClick={() => setVerificationNotice("Delete account request received. Support will finalize deletion.")}
                  className="inline-flex items-center px-3 py-1.5 rounded-full border border-red-200 text-red-700 text-[11px] font-semibold hover:bg-red-50 transition-colors"
                >
                  Delete account
                </button>
              </div>
              {!isEmailVerified && (
                <p className="text-[11px] text-black/60">
                  Verify your email to unlock Promotions access. Check Inbox and Junk/Spam.
                </p>
              )}
              {verificationNotice && (
                <p className="text-[11px] text-black/70">{verificationNotice}</p>
              )}
            </div>
            <div className="rounded-xl border border-black/5 bg-black/[0.02] p-4 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/60">
                Quick summary
              </p>
              <p className="text-sm text-black/80">
                Plates connected:{" "}
                <span className="font-semibold">
                  {plates.length > 0 ? plates.length : "None yet"}
                </span>
              </p>
              <p className="text-sm text-black/80">
                Payment methods:{" "}
                <span className="font-semibold">
                  {paymentMethods.length > 0
                    ? paymentMethods.length
                    : "None yet"}
                </span>
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (activeItem === "home") {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight text-black">
                Welcome back
              </h2>
              <p className="text-sm text-black/70">
                Use quick actions to pay, reserve, or start monthly in seconds.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setHomeOpen((v) => !v)}
              className="inline-flex items-center px-3 py-1.5 rounded-full border border-black/10 text-[11px] font-semibold hover:bg-black/5 transition-colors"
            >
              {homeOpen ? "Hide" : "Show"}
            </button>
          </div>
          {homeOpen && (
            <div className="bg-white p-4 space-y-3">
              <div className="flex flex-col md:flex-row gap-2">
                <input
                  type="text"
                  value={actionLocation}
                  onChange={(e) => setActionLocation(e.target.value)}
                  placeholder="Location ID or name"
                  className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm text-black bg-white outline-none focus:border-black/40"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-full border border-black/10 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setHomeFlow("park_now")}
                    className={`px-3 py-1.5 text-[11px] font-semibold ${
                      homeFlow === "park_now"
                        ? "bg-black text-white"
                        : "bg-white text-black"
                    }`}
                  >
                    Park Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setHomeFlow("monthly")}
                    className={`px-3 py-1.5 text-[11px] font-semibold ${
                      homeFlow === "monthly"
                        ? "bg-black text-white"
                        : "bg-white text-black"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setHomeFlow("reserve")}
                    className={`px-3 py-1.5 text-[11px] font-semibold ${
                      homeFlow === "reserve"
                        ? "bg-black text-white"
                        : "bg-white text-black"
                    }`}
                  >
                    Reserve
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleCheckout(homeFlow as FlowType, actionLocation)
                  }
                  disabled={!!actionProcessing}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-black text-white text-xs font-semibold shadow-md hover:bg-gray-900 transition-colors disabled:opacity-60"
                >
                  Continue
                </button>
              </div>
              {actionError && (
                <p className="text-[11px] text-red-600">{actionError}</p>
              )}
            </div>
          )}
        </div>
      );
    }

    if (activeItem === "monthly") {
      return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight text-black">
            Monthly subscriptions
          </h2>
          <p className="text-sm text-black/70">
            View-only list of your recurring permits connected to a plate or company.
          </p>
          <div className="bg-white p-4 space-y-3">
            <p className="text-xs font-semibold text-black/70">Your monthly permits</p>
            <p className="text-sm text-black/60">No active monthly subscriptions.</p>
          </div>
        </div>
      );
    }

    if (activeItem === "activity") {
      const selectedActivityLocation = actionLocation.trim() || "Parking Trogir";
      return (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight text-black">
            Activity
          </h2>
          <p className="text-sm text-black/70">
            A timeline of recent sessions, payments, and enforcement outcomes.
          </p>
          {activityLoading && (
            <p className="text-xs text-black/60">Loading live activity...</p>
          )}
          {!activityLoading && activityRows.length === 0 && (
            <p className="text-xs text-black/60">
              No sessions yet. Complete a checkout and this feed updates automatically.
            </p>
          )}
          {!activityLoading && activityRows.length > 0 && (
            <div className="rounded-xl border border-black/10 bg-white p-3 space-y-2">
              {activityRows.map((row) => (
                <div key={row.id} className="rounded-lg border border-black/10 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-black">
                      {row.plate || "Unknown plate"} · {row.location_id || "Unknown location"}
                    </p>
                    <p className="text-[11px] text-black/60">
                      {formatActivityDate(row.created_at)}
                    </p>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-black/70">
                    <span>
                      {Number(row.price ?? 0).toFixed(2)} {parseCurrency(row.currency)}
                    </span>
                    <span>{(row.payment_status || row.status || "pending").toUpperCase()}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-black/70">
                    Vrijedi: {formatCroatianDateTime(row.entry_time || row.created_at)} — {formatCroatianDateTime(row.exit_time)}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="rounded-xl border border-black/10 bg-white px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-black leading-tight truncate">
                {selectedActivityLocation}
              </p>
              <button
                type="button"
                onClick={() => setActivityFavorite((value) => !value)}
                className={`inline-flex items-center justify-center w-7 h-7 rounded-full border border-black/10 transition-colors shrink-0 ${activityFavorite ? "text-red-500 hover:bg-red-50" : "text-black hover:bg-black/5"}`}
                aria-label={activityFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill={activityFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="m12 21-1.45-1.32C5.4 15.03 2 11.95 2 8.25 2 5.17 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09A5.98 5.98 0 0 1 16.5 3C19.58 3 22 5.17 22 8.25c0 3.7-3.4 6.78-8.55 11.43z" />
                </svg>
              </button>
            </div>
            <div className="mt-1.5 flex items-center gap-2 overflow-x-auto whitespace-nowrap text-[10px] text-black/70">
              <span className="inline-flex items-center gap-1">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[#5F3DFC]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M4 18h4" />
                  <path d="M16 18h4" />
                  <path d="M7 18V9a3 3 0 1 1 6 0v9" />
                  <path d="M17 18V9a3 3 0 1 0-6 0" />
                </svg>
                2 min walk
              </span>
              <span className="inline-flex items-center gap-1">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[#5F3DFC]" fill="currentColor" aria-hidden="true">
                  <path d="m12 17.27 6.18 3.73-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
                4.8 reviews
              </span>
              <span className="inline-flex items-center gap-1">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[#5F3DFC]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M12 3v18" />
                  <path d="M3 12h18" />
                  <path d="m5.6 5.6 12.8 12.8" />
                  <path d="m18.4 5.6-12.8 12.8" />
                </svg>
                Extras available
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (activeItem === "company") {
      return (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight text-black">
            Company subscriptions
          </h2>
          <p className="text-sm text-black/70">
            Manage shared allocations, visitor access, and team permits from a
            single workspace.
          </p>
        </div>
      );
    }

    if (activeItem === "payment") {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight text-black">
              Payment
            </h2>
            <p className="text-sm text-black/70">
              Add a card label so you can quickly recognise how each payment is
              charged.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-black/70">
              Saved payment methods
            </p>
            {paymentMethods.length === 0 && (
              <p className="text-sm text-black/60">
                No payment methods added yet.
              </p>
            )}
            {paymentMethods.length > 0 && (
              <ul className="space-y-2 text-sm text-black/80">
                {paymentMethods.map((label) => (
                  <li
                    key={label}
                    className="flex items-center justify-between rounded-lg border border-black/10 bg-white px-3 py-2"
                  >
                    <span>{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-black/50">
                        Card on file
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setPaymentMethods((current) =>
                            current.filter((x) => x !== label)
                          )
                        }
                        className="text-[11px] underline underline-offset-2 text-black/60 hover:text-black"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-black/70">
              Add a payment method
            </p>
            <div className="flex flex-col md:flex-row gap-2">
              <button
                type="button"
                onClick={handleAddPaymentMethod}
                disabled={!!actionProcessing}
                className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-black text-white text-xs font-semibold shadow-md hover:bg-gray-900 transition-colors disabled:opacity-60"
              >
                Add payment method
              </button>
            </div>
            <p className="text-[11px] text-black/60">
              Opens a secure Stripe page to save a tokenized payment method.
            </p>
            {actionError && (
              <p className="text-[11px] text-red-600">{actionError}</p>
            )}
          </div>
        </div>
      );
    }

    if (activeItem === "vehicles") {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight text-black">
              Vehicles
            </h2>
            <p className="text-sm text-black/70">
              Add license plates you use for work so Payparq can recognise your
              arrivals.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-black/70">
              Saved plates
            </p>
            {plates.length === 0 && (
              <p className="text-sm text-black/60">
                No plates added yet. Add your first plate below.
              </p>
            )}
            {plates.length > 0 && (
              <ul className="flex flex-wrap gap-2 text-xs text-black/80">
                {plates.map((plate) => (
                  <li
                    key={plate}
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5"
                  >
                    <span className="font-semibold tracking-[0.12em] uppercase">
                      {plate}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPlates((current) => current.filter((x) => x !== plate))
                      }
                      className="text-[10px] underline underline-offset-2 text-black/60 hover:text-black"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-black/70">
              Add a license plate
            </p>
            <div className="flex flex-col md:flex-row gap-2">
              <input
                type="text"
                value={newPlate}
                onChange={(event) => setNewPlate(event.target.value)}
                className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm text-black bg-white outline-none focus:border-black/40 uppercase"
                placeholder="e.g. ZG-123-AB"
              />
              <button
                type="button"
                onClick={() => {
                  const trimmed = newPlate.trim();
                  if (!trimmed) return;
                  const value = trimmed.toUpperCase();
                  if (plates.includes(value)) {
                    setNewPlate("");
                    return;
                  }
                  setPlates((current) => [...current, value]);
                  setNewPlate("");
                }}
                className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-black text-white text-xs font-semibold shadow-md hover:bg-gray-900 transition-colors"
              >
                Add plate
              </button>
            </div>
            <p className="text-[11px] text-black/60">
              In production, these plates will sync with your parking locations
              and enforcement tools.
            </p>
          </div>
        </div>
      );
    }

    if (activeItem === "promotions") {
      if (!isEmailVerified) {
        return (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-black">
              Promotions
            </h2>
            <p className="text-sm text-black/70">
              Promotions are locked until your email is verified.
            </p>
            <div className="rounded-xl border border-black/10 bg-white p-4 space-y-3">
              <p className="text-xs text-black/70">
                Before verifying, check Inbox and Junk/Spam folders.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSendVerificationEmail}
                  disabled={verificationLoading}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-[#5F3DFC] text-white text-xs font-semibold shadow-md hover:bg-[#4330c4] transition-colors disabled:opacity-60"
                >
                  {verificationLoading ? "Sending..." : "Verify email"}
                </button>
                <button
                  type="button"
                  onClick={handleSendVerificationEmail}
                  disabled={verificationLoading}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-black/10 text-xs font-semibold hover:bg-black/5 transition-colors disabled:opacity-60"
                >
                  Resend email
                </button>
              </div>
              {verificationNotice && (
                <p className="text-[11px] text-black/70">{verificationNotice}</p>
              )}
            </div>
          </div>
        );
      }
      return (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight text-black">
            Promotions
          </h2>
          <p className="text-sm text-black/70">
            Redeem and manage promotional codes connected to your profile.
          </p>
          <div className="rounded-xl border border-black/10 bg-white p-4">
            <p className="text-sm text-black/80">
              Promotions unlocked. Your account is verified.
            </p>
          </div>
        </div>
      );
    }

    if (activeItem === "rewards") {
      return (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight text-black">
            Rewards
          </h2>
          <p className="text-sm text-black/70">
            Track rewards and benefits earned across the Payparq network.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight text-black">
          Help
        </h2>
        <p className="text-sm text-black/70">
          Find answers, raise a ticket, or reach the Payparq team for support.
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        isSignedIn
          ? "h-screen overflow-hidden bg-[#05020A] text-white flex flex-col"
          : "min-h-screen bg-[#05020A] text-white flex flex-col"
      }
    >
      {!isSignedIn && <SiteHeader />}

      <main
        className={
          isSignedIn
            ? "flex-1 bg-[#05020A] overflow-hidden flex flex-col"
            : "flex-1 bg-[#05020A] pt-24 md:pt-28"
        }
      >
        <section
          className={
            isSignedIn
              ? "w-full px-0 md:px-0 py-0 flex-1 flex flex-col overflow-hidden"
              : "w-full px-4 md:px-0 py-10 md:py-12 flex flex-col items-center"
          }
        >
          {!isSignedIn && (
            <div className="w-full max-w-md">
              <div className="rounded-3xl border border-white/10 bg-white text-black p-6 md:p-8 shadow-lg">
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/50 mb-3">
                  Members
                </p>
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
                  Sign in to your Payparq account
                </h1>
                <p className="text-sm text-black/70 mb-6">
                  Access member tools, subscriptions, and activity with secure email sign-in.
                </p>
                {!isSupabaseConfigured && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-[11px] text-red-700">
                    Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local and restart the server.
                  </div>
                )}
                <form className="space-y-4" onSubmit={handleAuth}>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-black/70">
                      Work email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-black bg-white outline-none focus:border-black/40"
                      placeholder="you@company.com"
                    />
                  </div>
                  {authError && (
                    <p className="text-[11px] text-red-600">{authError}</p>
                  )}
                  {loginNotice && (
                    <p className="text-[11px] text-black/70">{loginNotice}</p>
                  )}
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-full bg-black text-white text-xs font-semibold shadow-md hover:bg-gray-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {authLoading ? "Sending..." : "Send sign-in email"}
                  </button>
                </form>
                <div className="mt-4 flex items-center justify-end text-[11px] text-black/70">
                  <Link href="/support" className="hover:text-black">
                    Need help?
                  </Link>
                </div>
                <p className="mt-4 text-[10px] text-black/60">
                  Authentication uses your Supabase project settings. Configure
                  email sign-in policies, confirmations, and SMTP inside your
                  Supabase dashboard.
                </p>
                {isLocalDevOverrideEnabled && (
                  <div className="mt-6 rounded-2xl border border-dashed border-black/15 bg-black/[0.02] p-3 text-[11px]">
                    <p className="font-semibold text-black/80">
                      Local-only preview
                    </p>
                    <p className="mt-1 text-black/70">
                      Supabase is not configured locally. You can still open the
                      Members dashboard layout without signing in.
                    </p>
                    <button
                      type="button"
                      onClick={() => setDevSignedIn(true)}
                      className="mt-3 inline-flex items-center px-3 py-1.5 rounded-full bg-black text-white text-[11px] font-semibold hover:bg-gray-900 transition-colors"
                    >
                      Continue to dashboard (no Supabase)
                    </button>
                    <p className="mt-2 text-[10px] text-black/60">
                      Stripe checkout and real parking data will not work in
                      this mode. Use it only for local layout testing.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {isSignedIn && (
            <div className="flex-1 flex flex-col bg-[#05020A] overflow-hidden">
              <div className="bg-[#5F3DFC] px-4 md:px-6 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/70">
                    Members
                  </p>
                  <p className="text-xs md:text-sm font-semibold">
                    Platform workspace
                  </p>
                </div>
                <div className="text-[11px] text-white/80 text-right flex flex-col items-end gap-1">
                  <div>
                    <p>Signed in as</p>
                    <p className="font-semibold truncate max-w-[180px]">
                      {displayEmail}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="md:hidden inline-flex items-center px-3 py-1.5 rounded-full border border-white/30 text-[11px] font-semibold text-white/90 hover:bg-white/10 transition-colors"
                  >
                    Log out
                  </button>
                </div>
              </div>

              <div className="md:hidden border-t border-white/10 bg-[#05020A] overflow-x-auto">
                <div className="flex items-center gap-2 px-4 py-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setActiveItem("home")}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap ${
                      activeItem === "home"
                        ? "bg-white text-black border-white"
                        : "border-white/20 text-white/80"
                    }`}
                  >
                    <span>Home</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveItem("monthly")}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap ${
                      activeItem === "monthly"
                        ? "bg-white text-black border-white"
                        : "border-white/20 text-white/80"
                    }`}
                  >
                    <span>Monthly</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveItem("activity")}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap ${
                      activeItem === "activity"
                        ? "bg-white text-black border-white"
                        : "border-white/20 text-white/80"
                    }`}
                  >
                    <span>Activity</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveItem("company")}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap ${
                      activeItem === "company"
                        ? "bg-white text-black border-white"
                        : "border-white/20 text-white/80"
                    }`}
                  >
                    <span>Company</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveItem("payment")}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap ${
                      activeItem === "payment"
                        ? "bg-white text-black border-white"
                        : "border-white/20 text-white/80"
                    }`}
                  >
                    <span>Payment</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveItem("vehicles")}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap ${
                      activeItem === "vehicles"
                        ? "bg-white text-black border-white"
                        : "border-white/20 text-white/80"
                    }`}
                  >
                    <span>Vehicles</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveItem("promotions")}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap ${
                      activeItem === "promotions"
                        ? "bg-white text-black border-white"
                        : "border-white/20 text-white/80"
                    }`}
                  >
                    <span>Promotions</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveItem("rewards")}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap ${
                      activeItem === "rewards"
                        ? "bg-white text-black border-white"
                        : "border-white/20 text-white/80"
                    }`}
                  >
                    <span>Rewards</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveItem("help")}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap ${
                      activeItem === "help"
                        ? "bg-white text-black border-white"
                        : "border-white/20 text-white/80"
                    }`}
                  >
                    <span>Help</span>
                  </button>
                  {isAdmin && (
                    <Link
                      href="/resources"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-white/20 text-xs font-semibold whitespace-nowrap text-white/90 hover:bg-white/10 transition-colors"
                    >
                      <span>Resources</span>
                    </Link>
                  )}
                </div>
              </div>

              <div className="flex-1 flex bg-[#05020A] overflow-hidden">
                <aside className="hidden md:flex w-72 border-r border-white/10 bg-[#05020A] flex-col">
                  <nav className="px-2 pt-4 pb-4 space-y-1 text-[12px] flex-1">
                    <button
                      type="button"
                      onClick={() => setActiveItem("home")}
                      className={`flex w-full items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors ${
                        activeItem === "home"
                          ? "bg-white text-black"
                          : "text-white/70 hover:bg-white/5"
                      }`}
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#5F3DFC]/90 text-[11px]">
                        H
                      </span>
                      <span>Home</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveItem("monthly")}
                      className={`flex w-full items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors ${
                        activeItem === "monthly"
                          ? "bg-white text-black"
                          : "text-white/70 hover:bg-white/5"
                      }`}
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[11px]">
                        P
                      </span>
                      <span>Monthly subscriptions</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveItem("activity")}
                      className={`flex w-full items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors ${
                        activeItem === "activity"
                          ? "bg-white text-black"
                          : "text-white/70 hover:bg-white/5"
                      }`}
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[11px]">
                        A
                      </span>
                      <span>Activity</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveItem("company")}
                      className={`flex w-full items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors ${
                        activeItem === "company"
                          ? "bg-white text-black"
                          : "text-white/70 hover:bg-white/5"
                      }`}
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[11px]">
                        C
                      </span>
                      <span>Company subscriptions</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveItem("payment")}
                      className={`flex w-full items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors ${
                        activeItem === "payment"
                          ? "bg-white text-black"
                          : "text-white/70 hover:bg-white/5"
                      }`}
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[11px]">
                        $
                      </span>
                      <span>Payment</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveItem("vehicles")}
                      className={`flex w-full items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors ${
                        activeItem === "vehicles"
                          ? "bg-white text-black"
                          : "text-white/70 hover:bg-white/5"
                      }`}
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[11px]">
                        V
                      </span>
                      <span>Vehicles</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveItem("promotions")}
                      className={`flex w-full items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors ${
                        activeItem === "promotions"
                          ? "bg-white text-black"
                          : "text-white/70 hover:bg-white/5"
                      }`}
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[11px]">
                        %
                      </span>
                      <span>Promotions</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveItem("rewards")}
                      className={`flex w-full items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors ${
                        activeItem === "rewards"
                          ? "bg-white text-black"
                          : "text-white/70 hover:bg-white/5"
                      }`}
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[11px]">
                        R
                      </span>
                      <span>Rewards</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveItem("help")}
                      className={`flex w-full items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors ${
                        activeItem === "help"
                          ? "bg-white text-black"
                          : "text-white/70 hover:bg-white/5"
                      }`}
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[11px]">
                        ?
                      </span>
                      <span>Help</span>
                    </button>
                    {isAdmin && (
                      <Link
                        href="/resources"
                        className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors text-white/70 hover:bg-white/5"
                      >
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[11px]">
                          S
                        </span>
                        <span>Resources</span>
                      </Link>
                    )}
                  </nav>
                  <div className="border-t border-white/10 px-4 py-4 mt-auto space-y-3">
                    <div className="space-y-1 text-[11px] text-white/70">
                      <p className="font-semibold">
                        Account overview
                      </p>
                      <p className="truncate">
                        {displayEmail}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveItem("account")}
                      className={`w-full inline-flex items-center justify-center px-3 py-2 rounded-xl text-[11px] font-semibold shadow-sm transition-colors ${
                        activeItem === "account"
                          ? "bg-white text-black"
                          : "bg-white/5 text-white hover:bg-white/10"
                      }`}
                    >
                      Account Settings
                    </button>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full inline-flex items-center justify-center px-3 py-2 rounded-xl border border-white/20 text-[11px] font-semibold text-white/80 hover:bg-white/5 transition-colors"
                    >
                      Log out
                    </button>
                  </div>
                </aside>

                <div className="flex-1 bg-[#F5F5F7] text-black overflow-hidden">
                  <div className="h-full p-6 md:p-8 flex flex-col gap-4 overflow-hidden">
                    <div className="text-[11px] uppercase tracking-[0.24em] text-black/50">
                      {activeItem === "account"
                        ? "Account settings"
                        : activeItem === "home"
                        ? "Overview"
                        : activeItem === "monthly"
                        ? "Monthly subscriptions"
                        : activeItem === "activity"
                        ? "Activity"
                        : activeItem === "company"
                        ? "Company subscriptions"
                        : activeItem === "payment"
                        ? "Payment"
                        : activeItem === "vehicles"
                        ? "Vehicles"
                        : activeItem === "promotions"
                        ? "Promotions"
                        : activeItem === "rewards"
                        ? "Rewards"
                        : "Help"}
                    </div>
                    <div className="bg-white p-5 md:p-6 shadow-sm flex-1 flex flex-col justify-between overflow-hidden">
                      {renderActiveContent()}
                      <div className="mt-6 text-[11px] text-black/50">
                        This view is wired for your Supabase project. Connect
                        real data from your parking sessions, permits, and
                        enforcement events to power this workspace.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {!isSignedIn && (
        <footer className="border-t border-white/10 bg-[#05020A] font-apple-ui">
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-[11px] text-white/70">
              <div className="space-y-3">
                <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                  Company
                </p>
                <Link href="/about" className="block hover:text-white transition-colors">
                  About
                </Link>
                <Link href="/careers" className="block hover:text-white transition-colors">
                  Careers
                </Link>
                <Link href="/news" className="block hover:text-white transition-colors">
                  News
                </Link>
              </div>
              <div className="space-y-3">
                <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                  Experience
                </p>
                <Link href="/product" className="block hover:text-white transition-colors">
                  Product
                </Link>
                <Link href="/parking" className="block hover:text-white transition-colors">
                  Parking
                </Link>
                <Link href="/security" className="block hover:text-white transition-colors">
                  Security
                </Link>
              </div>
              <div className="space-y-3">
                <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                  Policies
                </p>
                <Link href="/legal" className="block hover:text-white transition-colors">
                  Legal
                </Link>
                <Link href="/privacy" className="block hover:text-white transition-colors">
                  Privacy
                </Link>
                <Link href="/terms" className="block hover:text-white transition-colors">
                  Terms
                </Link>
              </div>
              <div className="space-y-3">
                <p className="text-[11px] font-semibold text-white uppercase tracking-[0.16em]">
                  Platform
                </p>
                <button
                  type="button"
                  className="block hover:text-white transition-colors text-left"
                  onClick={() => {
                    window.location.assign("/locations");
                  }}
                >
                  Locations
                </button>
                <Link href="/members" className="block hover:text-white transition-colors">
                  Members
                </Link>
                <Link href="/support" className="block hover:text-white transition-colors">
                  Support
                </Link>
              </div>
            </div>
            <div className="mt-12 pt-6 border-t border-white/10">
              <FooterBrand />
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

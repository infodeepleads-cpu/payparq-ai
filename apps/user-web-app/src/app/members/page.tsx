'use client';

import { useEffect, useState, FormEvent, useCallback } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { FooterBrand } from "@/components/FooterBrand";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type NavItemId =
  | "account"
  | "home"
  | "permits"
  | "activity"
  | "payment"
  | "vehicles"
  | "promotions"
  | "rewards"
  | "help";
type FlowType = "park_now" | "monthly" | "reserve";
type HomeWidgetId = "insurance" | "ride" | "extend" | "invoice";
type ActionProcessing = FlowType | HomeWidgetId;
type ActivityRow = {
  id: string;
  email?: string | null;
  contact_email?: string | null;
  created_at?: string | null;
  location_id?: string | null;
  location_display_id?: string | null;
  plate?: string | null;
  price?: number | null;
  currency?: string | null;
  payment_status?: string | null;
  status?: string | null;
  entry_time?: string | null;
  exit_time?: string | null;
  end_time?: string | null;
  stripe_metadata?: Record<string, unknown> | string | null;
  ui_check_in?: string | null;
  ui_check_out?: string | null;
  ui_lifecycle?: "upcoming" | "active" | "expired" | "pending" | "inactive";
};
type PermitRow = {
  id: string;
  plate?: string | null;
  type?: string | null;
  status?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  location_id?: string | null;
  location_display_id?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  created_at?: string | null;
  stripe_metadata?: Record<string, unknown> | string | null;
};
type MembersHomeContext = {
  sessionId: string;
  plate?: string | null;
  locationId: string | null;
  locationDisplayId?: string | null;
  locationName: string | null;
  checkIn: string | null;
  checkOut: string | null;
  stripeSessionId: string | null;
  amount: number | null;
  currency: string | null;
  insuranceUrl: string | null;
  rideUrl: string | null;
  invoiceAvailable: boolean;
  parkTaxiIncluded: boolean;
};
type WalletSummary = {
  balanceCents: number;
  currency: string;
  minimumTopupCents: number;
};
type LoyaltySummary = {
  level: string;
  pointsYear: number;
  pointsTotal: number;
  nextLevel: string | null;
  nextLevelTarget: number | null;
  nextLevelProgressPercent: number;
  bonusRangeByLevel?: Record<string, string>;
};
type RewardWalletLedgerRow = {
  id: string;
  amountCents: number;
  direction: string;
  entryType: string;
  createdAt: string;
};
type RewardLoyaltyLedgerRow = {
  id: string;
  pointsDelta: number;
  source: string;
  createdAt: string;
};
type PaymentMethodRow = {
  id: string;
  brand: string;
  last4: string;
  expMonth: number | null;
  expYear: number | null;
  isDefault: boolean;
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

function parseActivityDate(value: unknown) {
  if (!value) return null;
  const raw = value.toString().trim();
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function parseStripeMetadata(
  value: Record<string, unknown> | string | null | undefined
): Record<string, unknown> {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string") {
    let current: unknown = value;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      if (current && typeof current === "object") {
        return current as Record<string, unknown>;
      }
      if (typeof current !== "string") {
        break;
      }
      try {
        current = JSON.parse(current);
      } catch {
        break;
      }
    }
  }
  return {};
}

function resolveActivityWindow(row: ActivityRow) {
  const metadata = parseStripeMetadata(row.stripe_metadata);
  const metadataCheckIn = parseActivityDate(metadata["check_in"]);
  const metadataCheckOut = parseActivityDate(metadata["check_out"]);
  const createdAt = parseActivityDate(row.created_at);
  const entry = parseActivityDate(row.entry_time);
  const exit = parseActivityDate(row.exit_time);
  const endTime = parseActivityDate(row.end_time);
  return {
    checkIn: metadataCheckIn ?? entry ?? createdAt,
    checkOut: metadataCheckOut ?? exit ?? endTime,
  };
}

function normalizePlateInput(value: string) {
  return value.toString().trim().toUpperCase();
}

function formatLoyaltyLevelLabel(value: string | null | undefined) {
  const normalized = (value ?? "level_1").toString().trim().toLowerCase();
  const match = normalized.match(/^level[_\s-]*(\d+)$/);
  if (match) {
    return `Level ${match[1]}`;
  }
  return normalized
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function readMemberPlates(currentUser: User | null) {
  const metadata = (currentUser?.user_metadata ?? {}) as Record<string, unknown>;
  const fromList = metadata["member_plates"];
  if (Array.isArray(fromList)) {
    const normalized = fromList
      .map((value) => normalizePlateInput(String(value ?? "")))
      .filter((value) => value.length > 0);
    return Array.from(new Set(normalized));
  }
  const fromDefault = normalizePlateInput(String(metadata["default_plate"] ?? ""));
  if (fromDefault) {
    return [fromDefault];
  }
  return [];
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
  const [plateSaving, setPlateSaving] = useState(false);
  const [plateMessage, setPlateMessage] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodRow[]>([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false);
  const [actionProcessing, setActionProcessing] = useState<ActionProcessing | null>(null);
  const [actionError, setActionError] = useState("");
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityRows, setActivityRows] = useState<ActivityRow[]>([]);
  const [permitsRows, setPermitsRows] = useState<PermitRow[]>([]);
  const [permitsLoading, setPermitsLoading] = useState(false);

  const [devSignedIn, setDevSignedIn] = useState(false);

  const isLocalDevOverrideEnabled =
    process.env.NODE_ENV === "development" && !isSupabaseConfigured;

  const displayEmail =
    user?.email || (devSignedIn ? "dev@local.test" : "Unknown email");

  const [homeContext, setHomeContext] = useState<MembersHomeContext | null>(null);
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [loyaltySummary, setLoyaltySummary] = useState<LoyaltySummary | null>(null);
  const [rewardWalletLedger, setRewardWalletLedger] = useState<RewardWalletLedgerRow[]>([]);
  const [rewardLoyaltyLedger, setRewardLoyaltyLedger] = useState<RewardLoyaltyLedgerRow[]>([]);
  const [homeContextLoading, setHomeContextLoading] = useState(false);
  const [homeFeedback, setHomeFeedback] = useState<
    Partial<Record<HomeWidgetId, { type: "success" | "error"; text: string }>>
  >({});
  const [extendMinutes, setExtendMinutes] = useState("120");
  const [extendSyncActive, setExtendSyncActive] = useState(false);

  const isSignedIn = !!user || devSignedIn;
  const normalizedMemberEmail = (user?.email ?? email).trim().toLowerCase();
  const hasMemberIdentity = normalizedMemberEmail.length > 0;
  const isEmailVerified = devSignedIn || Boolean((user as { email_confirmed_at?: string | null } | null)?.email_confirmed_at);

  function parseCurrency(value: string | null | undefined) {
    const normalized = (value ?? "eur").toString().toUpperCase();
    return normalized;
  }

  function formatMoneyFromCents(cents: number | null | undefined, currency: string | null | undefined) {
    const amount = Number(cents ?? 0) / 100;
    return new Intl.NumberFormat("hr-HR", {
      style: "currency",
      currency: parseCurrency(currency),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0);
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
      return "Redirect URL nije dopušten u postavkama prijave. Dodajte Members URL u Auth URL Configuration.";
    }
    if (normalized.includes("error sending magic link email")) {
      return "Pogreška pri slanju e-pošte s čarobnom vezom. Provjerite Email provider, SMTP postavke i Redirect URL.";
    }
    if (normalized.includes("email address not authorized")) {
      return "Adresa e-pošte nije odobrena za slanje. Potvrdite sender domenu i mailbox u SMTP servisu.";
    }
    if (normalized.includes("signups not allowed")) {
      return "Registracije su isključene u projektu. Uključite Email sign-in i dopustite kreiranje korisnika.";
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
    if (!isSignedIn || !user) {
      setPlates([]);
      return;
    }
    setPlates(readMemberPlates(user));
  }, [isSignedIn, user]);

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
      tab === "activity" ||
      tab === "account"
    ) {
      setActiveItem(tab as NavItemId);
    }
  }, []);

  const refreshActivity = useCallback(async () => {
    if (!normalizedMemberEmail) {
      setActivityRows([]);
      return;
    }
    setActivityLoading(true);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (supabase && isSupabaseConfigured) {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
      }
      const userMetadata = ((user?.user_metadata ?? {}) as Record<string, unknown>) ?? {};
      const appMetadata = ((user?.app_metadata ?? {}) as Record<string, unknown>) ?? {};
      const roleValue =
        (userMetadata.role ?? appMetadata.role ?? userMetadata.user_role ?? appMetadata.user_role ?? "")
          .toString()
          .trim();
      const locationValue =
        (userMetadata.location_id ?? userMetadata.locationId ?? userMetadata.selected_location_id ?? "")
          .toString()
          .trim();
      const displayIdValue =
        (userMetadata.display_id ?? userMetadata.displayId ?? userMetadata.selected_display_id ?? "")
          .toString()
          .trim();
      if (user?.id) {
        headers["x-member-id"] = user.id;
      }
      if (roleValue) {
        headers["x-member-role"] = roleValue;
      }
      if (locationValue) {
        headers["x-member-location-id"] = locationValue;
      }
      if (displayIdValue) {
        headers["x-member-display-id"] = displayIdValue;
      }
      if (normalizedMemberEmail) {
        headers["x-member-email"] = normalizedMemberEmail;
      }
      const activityQuery = new URLSearchParams({
        include_activity: "1",
        include_permits: "0",
        include_rewards: "0",
        _ts: Date.now().toString(),
      });
      const response = await fetch(`/api/members/context?${activityQuery.toString()}`, {
        method: "GET",
        headers,
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            activity?: ActivityRow[] | null;
          }
        | null;
      const contextRows = response.ok && payload ? payload.activity ?? [] : [];
      if (response.ok && payload) {
        setActivityRows(contextRows);
        return;
      }
      setActivityRows([]);
    } catch {
      setActivityRows([]);
    } finally {
      setActivityLoading(false);
    }
  }, [normalizedMemberEmail, user?.app_metadata, user?.id, user?.user_metadata]);

  useEffect(() => {
    if (activeItem === "activity") {
      void refreshActivity();
    }
  }, [activeItem, refreshActivity]);
  useEffect(() => {
    if (!hasMemberIdentity) {
      setActivityRows([]);
    }
  }, [hasMemberIdentity]);

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
      const activityWindow = resolveActivityWindow(row);
      if (!activityWindow.checkOut) continue;
      const exitDate = activityWindow.checkOut;
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
  const getMemberAuthHeaders = useCallback(async () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (supabase && isSupabaseConfigured) {
      let token = "";
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token ?? "";
      if (!token) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        token = refreshed.session?.access_token ?? "";
      }
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }
    if (user?.email) {
      headers["x-member-email"] = user.email;
    }
    if (!headers["x-member-email"]) {
      const fallbackEmail = (email ?? "").trim().toLowerCase();
      if (fallbackEmail) {
        headers["x-member-email"] = fallbackEmail;
      }
    }
    const userMetadata = ((user?.user_metadata ?? {}) as Record<string, unknown>) ?? {};
    const appMetadata = ((user?.app_metadata ?? {}) as Record<string, unknown>) ?? {};
    const roleValue =
      (userMetadata.role ?? appMetadata.role ?? userMetadata.user_role ?? appMetadata.user_role ?? "")
        .toString()
        .trim();
    const locationValue =
      (userMetadata.location_id ?? userMetadata.locationId ?? userMetadata.selected_location_id ?? "")
        .toString()
        .trim();
    const displayIdValue =
      (userMetadata.display_id ?? userMetadata.displayId ?? userMetadata.selected_display_id ?? "")
        .toString()
        .trim();
    if (user?.id) {
      headers["x-member-id"] = user.id;
    }
    if (roleValue) {
      headers["x-member-role"] = roleValue;
    }
    if (locationValue) {
      headers["x-member-location-id"] = locationValue;
    }
    if (displayIdValue) {
      headers["x-member-display-id"] = displayIdValue;
    }
    return headers;
  }, [email, user?.app_metadata, user?.email, user?.id, user?.user_metadata]);

  const persistMemberPlates = useCallback(async (nextPlates: string[]) => {
    if (!user || !supabase || !isSupabaseConfigured) {
      return false;
    }
    const normalizedPlates = Array.from(new Set(nextPlates.map((plate) => normalizePlateInput(plate)).filter(Boolean)));
    setPlateSaving(true);
    setPlateMessage("");
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          ...(user.user_metadata ?? {}),
          member_plates: normalizedPlates,
          default_plate: normalizedPlates[0] ?? null,
        },
      });
      if (error) {
        setPlateMessage("Unable to save plates right now.");
        return false;
      }
      setUser(data.user ?? user);
      setPlates(normalizedPlates);
      setPlateMessage("Plates saved.");
      return true;
    } catch {
      setPlateMessage("Unable to save plates right now.");
      return false;
    } finally {
      setPlateSaving(false);
    }
  }, [user]);

  const refreshPaymentMethods = useCallback(async () => {
    if (!isSignedIn || !user?.email) {
      setPaymentMethods([]);
      return;
    }
    setPaymentMethodsLoading(true);
    try {
      const response = await fetch("/api/members/payment-methods", {
        method: "GET",
        headers: await getMemberAuthHeaders(),
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | { paymentMethods?: PaymentMethodRow[] | null }
        | null;
      if (!response.ok || !payload) {
        setPaymentMethods([]);
        return;
      }
      setPaymentMethods(payload.paymentMethods ?? []);
    } finally {
      setPaymentMethodsLoading(false);
    }
  }, [getMemberAuthHeaders, isSignedIn, user?.email]);

  const handleRemovePaymentMethod = useCallback(async (paymentMethodId: string) => {
    setActionError("");
    try {
      const response = await fetch("/api/members/payment-methods", {
        method: "DELETE",
        headers: await getMemberAuthHeaders(),
        body: JSON.stringify({ paymentMethodId }),
      });
      if (!response.ok) {
        setActionError("Unable to remove payment method.");
        return;
      }
      await refreshPaymentMethods();
    } catch {
      setActionError("Unable to remove payment method.");
    }
  }, [getMemberAuthHeaders, refreshPaymentMethods]);

  useEffect(() => {
    void refreshPaymentMethods();
  }, [refreshPaymentMethods]);

  const refreshHomeContext = useCallback(async (options?: { silent?: boolean }) => {
    const shouldSilentlyRefresh = Boolean(options?.silent);
    if (!normalizedMemberEmail) {
      setHomeContext(null);
      setWalletSummary(null);
      setLoyaltySummary(null);
      setRewardWalletLedger([]);
      setRewardLoyaltyLedger([]);
      setPermitsRows([]);
      return null;
    }
    if (!shouldSilentlyRefresh) {
      setHomeContextLoading(true);
      setPermitsLoading(true);
    }
    try {
      const includePermits = activeItem === "permits";
      const includeRewards = activeItem === "rewards";
      const query = new URLSearchParams({
        include_activity: "1",
        include_permits: includePermits ? "1" : "0",
        include_rewards: includeRewards ? "1" : "0",
        _ts: Date.now().toString(),
      });
      const response = await fetch(`/api/members/context?${query.toString()}`, {
        method: "GET",
        headers: await getMemberAuthHeaders(),
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            context?: MembersHomeContext | null;
            wallet?: WalletSummary | null;
            loyalty?: LoyaltySummary | null;
            rewards?: {
              walletLedger?: RewardWalletLedgerRow[];
              loyaltyLedger?: RewardLoyaltyLedgerRow[];
            } | null;
            permits?: PermitRow[] | null;
            error?: string;
          }
        | null;
      if (!response.ok || !payload) {
        setHomeContext(null);
        setWalletSummary(null);
        setLoyaltySummary(null);
        if (includeRewards) {
          setRewardWalletLedger([]);
          setRewardLoyaltyLedger([]);
        }
        if (includePermits) {
          setPermitsRows([]);
        }
        return null;
      }
      setHomeContext(payload.context ?? null);
      setWalletSummary(payload.wallet ?? null);
      setLoyaltySummary(payload.loyalty ?? null);
      if (includeRewards) {
        setRewardWalletLedger(payload.rewards?.walletLedger ?? []);
        setRewardLoyaltyLedger(payload.rewards?.loyaltyLedger ?? []);
      }
      if (includePermits) {
        setPermitsRows(payload.permits ?? []);
      }
      return payload.context;
    } finally {
      if (!shouldSilentlyRefresh) {
        setHomeContextLoading(false);
        setPermitsLoading(false);
      }
    }
  }, [activeItem, getMemberAuthHeaders, normalizedMemberEmail]);
  const startExtendSyncPolling = useCallback((previousCheckOut: string | null) => {
    if (typeof window === "undefined") {
      return;
    }
    setExtendSyncActive(true);
    let attempts = 0;
    const maxAttempts = 120;
    const delayMs = 3000;
    const previousCheckOutMillis = toMillis(previousCheckOut);
    const poll = async () => {
      attempts += 1;
      const nextContext =
        activeItem === "activity"
          ? (await Promise.all([refreshHomeContext({ silent: true }), refreshActivity()]))[0]
          : await refreshHomeContext({ silent: true });
      const nextCheckOutMillis = toMillis(nextContext?.checkOut ?? null);
      if (
        previousCheckOutMillis != null &&
        nextCheckOutMillis != null &&
        nextCheckOutMillis > previousCheckOutMillis
      ) {
        setExtendSyncActive(false);
        return;
      }
      if (attempts >= maxAttempts) {
        setExtendSyncActive(false);
        return;
      }
      window.setTimeout(() => {
        void poll();
      }, delayMs);
    };
    window.setTimeout(() => {
      void poll();
    }, delayMs);
  }, [activeItem, refreshActivity, refreshHomeContext]);
  useEffect(() => {
    if (!hasMemberIdentity) {
      setHomeContext(null);
      setExtendSyncActive(false);
      return;
    }
    void refreshHomeContext();
  }, [hasMemberIdentity, refreshHomeContext]);
  useEffect(() => {
    if (!hasMemberIdentity || typeof window === "undefined") {
      return;
    }
    const refreshNow = () => {
      if (activeItem === "activity") {
        void Promise.all([refreshHomeContext({ silent: true }), refreshActivity()]);
        return;
      }
      void refreshHomeContext({ silent: true });
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshNow();
      }
    };
    const intervalId = window.setInterval(refreshNow, 15000);
    window.addEventListener("focus", refreshNow);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshNow);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [activeItem, extendSyncActive, hasMemberIdentity, refreshActivity, refreshHomeContext]);
  useEffect(() => {
    if (!hasMemberIdentity) {
      return;
    }
    if (activeItem === "activity") {
      void refreshActivity();
      return;
    }
    if (activeItem === "permits" || activeItem === "rewards") {
      void refreshHomeContext({ silent: true });
    }
  }, [activeItem, hasMemberIdentity, refreshActivity, refreshHomeContext]);
  async function downloadInvoicePdf(actionUrl: string) {
    const isMembersInvoiceEndpoint = /^\/api\/members\/invoice(?:\?|$)/i.test(actionUrl);
    try {
      const response = await fetch(actionUrl, {
        method: "GET",
        headers: isMembersInvoiceEndpoint ? await getMemberAuthHeaders() : undefined,
      });
      if (!response.ok) {
        throw new Error("invoice_fetch_failed");
      }
      const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
      const isPdf = contentType.includes("application/pdf");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = isPdf ? "payparq-receipt.pdf" : "payparq-receipt.html";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      if (!isPdf && !isMembersInvoiceEndpoint) {
        window.open(actionUrl, "_blank", "noopener,noreferrer");
      }
      window.URL.revokeObjectURL(blobUrl);
      return true;
    } catch {
      if (!isMembersInvoiceEndpoint) {
        window.open(actionUrl, "_blank", "noopener,noreferrer");
      }
      return false;
    }
  }
  async function runHomeAction(
    action: HomeWidgetId,
    endpoint: string,
    body?: Record<string, unknown>
  ) {
    setActionProcessing(action);
    setActionError("");
    setHomeFeedback((current) => {
      const next = { ...current };
      delete next[action];
      return next;
    });
    try {
      const response = await fetch(endpoint, {
        method: body ? "POST" : "GET",
        headers: await getMemberAuthHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; message?: string; actionUrl?: string; error?: string }
        | null;
      if (!response.ok || !payload?.ok) {
        const text = payload?.error || "Action failed. Please try again.";
        setHomeFeedback((current) => ({
          ...current,
          [action]: { type: "error", text },
        }));
        return;
      }
      if (payload.actionUrl) {
        if (action === "invoice") {
          const downloaded = await downloadInvoicePdf(payload.actionUrl);
          if (!downloaded) {
            setHomeFeedback((current) => ({
              ...current,
              [action]: { type: "error", text: "Unable to download receipt. Please refresh and try again." },
            }));
            return;
          }
        } else {
          window.open(payload.actionUrl, "_blank", "noopener,noreferrer");
        }
      }
      setHomeFeedback((current) => ({
        ...current,
        [action]: {
          type: "success",
          text: payload.message || "Done.",
        },
      }));
      const previousCheckOut = homeContext?.checkOut ?? null;
      if (activeItem === "activity") {
        await Promise.all([refreshHomeContext({ silent: true }), refreshActivity()]);
      } else {
        await refreshHomeContext({ silent: true });
      }
      if (action === "extend") {
        startExtendSyncPolling(previousCheckOut);
      }
    } catch {
      setHomeFeedback((current) => ({
        ...current,
        [action]: { type: "error", text: "Network error. Please try again." },
      }));
    } finally {
      setActionProcessing(null);
    }
  }
  function toMillis(value: string | null | undefined) {
    const parsed = new Date((value ?? "").toString());
    const millis = parsed.getTime();
    if (!Number.isFinite(millis) || Number.isNaN(millis)) {
      return null;
    }
    return millis;
  }
  function resolveActivityLifecycleForView(row: ActivityRow) {
    const now = Date.now();
    const checkInMs = toMillis(row.ui_check_in || row.entry_time || row.created_at);
    const checkOutMs = toMillis(row.ui_check_out || row.exit_time || row.end_time);
    const paymentStatus = (row.payment_status ?? "").toString().trim().toLowerCase();
    const status = (row.status ?? "").toString().trim().toLowerCase();
    const isPending =
      paymentStatus === "pending" ||
      paymentStatus === "unpaid" ||
      paymentStatus === "open" ||
      paymentStatus === "requires_payment_method" ||
      paymentStatus === "requires_action" ||
      status === "pending" ||
      status === "open";
    if (checkInMs != null && checkOutMs != null) {
      if (now < checkInMs) {
        return "upcoming";
      }
      if (now >= checkOutMs) {
        return "expired";
      }
      return "active";
    }
    if (isPending) {
      return "pending";
    }
    return "inactive";
  }
  function handleInsuranceAction() {
    const rawUrl = (homeContext?.insuranceUrl ?? "").toString().trim();
    const url =
      rawUrl === "/insurance" || rawUrl === "/insurance/"
        ? "/insurance/apply"
        : rawUrl || "/insurance/apply";
    if (/^https?:\/\//i.test(url)) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    window.location.href = url;
  }
  async function handleRideAction() {
    await runHomeAction("ride", "/api/members/ride", {});
  }
  function handleUberAction() {
    const url =
      homeContext?.rideUrl ||
      "https://m.uber.com/";
    window.open(url, "_blank", "noopener,noreferrer");
  }
  async function handleExtendAction() {
    const parsedMinutes = Number.parseInt(extendMinutes, 10);
    const safeMinutes = Number.isFinite(parsedMinutes)
      ? Math.min(2880, Math.max(60, parsedMinutes))
      : 120;
    const sessionId = (homeContext?.sessionId ?? "").toString().trim();
    const locationId = (homeContext?.locationId ?? "").toString().trim();
    const checkIn = (homeContext?.checkIn ?? "").toString().trim();
    const checkOut = (homeContext?.checkOut ?? "").toString().trim();
    const plate = (homeContext?.plate ?? "").toString().trim();
    await runHomeAction("extend", "/api/members/extend", {
      minutes: safeMinutes,
      session_id: sessionId || undefined,
      fallback_location_id: locationId || undefined,
      fallback_check_in: checkIn || undefined,
      fallback_check_out: checkOut || undefined,
      fallback_plate: plate || undefined,
    });
  }
  async function handleInvoiceAction() {
    const stripeSessionId = (homeContext?.stripeSessionId ?? "").toString().trim();
    const sessionId = (homeContext?.sessionId ?? "").toString().trim();
    const plate = (homeContext?.plate ?? "").toString().trim();
    const locationName = (homeContext?.locationName ?? "").toString().trim();
    const locationId = (homeContext?.locationId ?? "").toString().trim();
    const checkIn = (homeContext?.checkIn ?? "").toString().trim();
    const checkOut = (homeContext?.checkOut ?? "").toString().trim();
    const amount = Number(homeContext?.amount ?? 0);
    const currency = (homeContext?.currency ?? "").toString().trim();
    const params = new URLSearchParams();
    if (stripeSessionId) {
      params.set("stripe_session_id", stripeSessionId);
      params.set("fallback_stripe_session_id", stripeSessionId);
    }
    if (sessionId) {
      params.set("session_id", sessionId);
    }
    if (plate) {
      params.set("fallback_plate", plate);
    }
    if (locationName) {
      params.set("fallback_location_name", locationName);
    } else if (locationId) {
      params.set("fallback_location_id", locationId);
    }
    if (checkIn) {
      params.set("fallback_check_in", checkIn);
    }
    if (checkOut) {
      params.set("fallback_check_out", checkOut);
    }
    if (Number.isFinite(amount) && amount > 0) {
      params.set("fallback_amount", amount.toFixed(2));
    }
    if (currency) {
      params.set("fallback_currency", currency);
    }
    const endpoint = params.toString() ? `/api/members/invoice?${params.toString()}` : "/api/members/invoice";
    await runHomeAction("invoice", endpoint);
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
          auto_charge_opt_in: true,
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
          </div>
        </div>
      );
    }

    if (activeItem === "home") {
      return (
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight text-black">
                Members Home
              </h2>
              <p className="text-sm text-black/70">Brzi pregled i akcije.</p>
            </div>
            <div className="shrink-0 space-y-2">
              <div className="rounded-lg border border-[#5F3DFC]/25 bg-[#F5F2FF] px-3 py-2 text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#3E22C6]/70">Wallet</p>
                <p className="text-sm font-semibold text-[#3E22C6]">
                  {formatMoneyFromCents(walletSummary?.balanceCents, walletSummary?.currency || "EUR")}
                </p>
                <p className="text-[11px] text-[#3E22C6]/85">
                  {formatLoyaltyLevelLabel(loyaltySummary?.level)}
                  {(loyaltySummary?.pointsYear ?? 0) > 0 ? ` · ${loyaltySummary?.pointsYear ?? 0} pts` : ""}
                </p>
                {loyaltySummary?.nextLevel && (
                  <p className="text-[10px] text-[#3E22C6]/70">
                    {loyaltySummary.nextLevelProgressPercent}% do {formatLoyaltyLevelLabel(loyaltySummary.nextLevel)}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-black/10 bg-white p-4">
            <div className="space-y-1.5">
              {homeContextLoading ? (
                <p className="text-sm text-black/60">Učitavanje...</p>
              ) : homeContext ? (
                <>
                  <p className="text-sm text-black/80">
                    <span className="font-semibold">
                      {homeContext.locationName || homeContext.locationDisplayId || homeContext.locationId || "N/A"}
                    </span>
                  </p>
                  <p className="text-[11px] text-black/60">
                    {formatCroatianDateTime(homeContext.checkIn)} — {formatCroatianDateTime(homeContext.checkOut)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-black/60">Nema aktivne rezervacije.</p>
              )}
            </div>
            <div className="mt-3 border-t border-black/10 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-black/60">Potvrda računa</p>
              <button
                type="button"
                onClick={handleInvoiceAction}
                disabled={actionProcessing === "invoice"}
                className="mt-1 inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-black text-white text-xs font-semibold shadow-sm hover:bg-gray-900 transition-colors disabled:opacity-60"
              >
                {actionProcessing === "invoice" ? "Obrada..." : "Preuzmi PDF"}
              </button>
              {homeFeedback.invoice && (
                <p className={`mt-1 text-[11px] ${homeFeedback.invoice.type === "error" ? "text-red-600" : "text-black/70"}`}>
                  {homeFeedback.invoice.text}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            <div className="min-w-[210px] rounded-xl border border-black/10 bg-white p-3 space-y-2">
              <p className="text-sm font-semibold text-black">Produženje boravka</p>
              <div className="flex items-center gap-2">
                <select
                  value={extendMinutes}
                  onChange={(event) => setExtendMinutes(event.target.value)}
                  className="rounded-lg border border-black/10 px-2 py-1.5 text-xs text-black bg-white outline-none focus:border-black/40"
                >
                  <option value="60">+1h</option>
                  <option value="120">+2h</option>
                  <option value="1440">+1d</option>
                  <option value="2880">+2d</option>
                </select>
                <button
                  type="button"
                  onClick={handleExtendAction}
                  disabled={actionProcessing === "extend"}
                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-black text-white text-xs font-semibold shadow-sm hover:bg-gray-900 transition-colors disabled:opacity-60"
                >
                  {actionProcessing === "extend" ? "Obrada..." : "Produži"}
                </button>
              </div>
              {homeFeedback.extend && (
                <p className={`text-[11px] ${homeFeedback.extend.type === "error" ? "text-red-600" : "text-black/70"}`}>
                  {homeFeedback.extend.text}
                </p>
              )}
            </div>
            {homeContext?.parkTaxiIncluded ? (
              <div className="min-w-[210px] rounded-xl border border-black/10 bg-white p-3 space-y-2">
                <p className="text-sm font-semibold text-black">Park&Taxi</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRideAction}
                    disabled={actionProcessing === "ride"}
                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-black text-white text-xs font-semibold shadow-sm hover:bg-gray-900 transition-colors disabled:opacity-60"
                  >
                    {actionProcessing === "ride" ? "Obrada..." : "Ride"}
                  </button>
                  <button
                    type="button"
                    onClick={handleUberAction}
                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-full border border-black/15 bg-white text-black text-xs font-semibold hover:bg-black/5 transition-colors"
                  >
                    Uber
                  </button>
                </div>
                {homeFeedback.ride && (
                  <p className={`text-[11px] ${homeFeedback.ride.type === "error" ? "text-red-600" : "text-black/70"}`}>
                    {homeFeedback.ride.text}
                  </p>
                )}
              </div>
            ) : (
              <div className="min-w-[210px] rounded-xl border border-black/10 bg-white p-3 space-y-2">
                <p className="text-sm font-semibold text-black">Vožnja</p>
                <button
                  type="button"
                  onClick={handleUberAction}
                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-full border border-black/15 bg-white text-black text-xs font-semibold hover:bg-black/5 transition-colors"
                >
                  Uber
                </button>
              </div>
            )}
            <div className="min-w-[210px] rounded-xl border border-black/10 bg-white p-3 space-y-2">
              <p className="text-sm font-semibold text-black">Osiguranje</p>
              <button
                type="button"
                onClick={handleInsuranceAction}
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-black text-white text-xs font-semibold shadow-sm hover:bg-gray-900 transition-colors disabled:opacity-60"
              >
                Apliciraj
              </button>
              {homeFeedback.insurance && (
                <p className={`text-[11px] ${homeFeedback.insurance.type === "error" ? "text-red-600" : "text-black/70"}`}>
                  {homeFeedback.insurance.text}
                </p>
              )}
            </div>
          </div>
          {actionError && (
            <p className="text-[11px] text-red-600">{actionError}</p>
          )}
        </div>
      );
    }

    if (activeItem === "permits") {
      return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight text-black">
            Permits & Subs
          </h2>
          <p className="text-sm text-black/70">
            All permits and subscriptions linked to your member account.
          </p>
          {permitsLoading && (
            <p className="text-xs text-black/60">Loading permits...</p>
          )}
          {!permitsLoading && permitsRows.length === 0 && (
            <p className="text-xs text-black/60">
              No permits or subscriptions found for this account yet.
            </p>
          )}
          {!permitsLoading && permitsRows.length > 0 && (
            <div className="rounded-xl border border-black/10 bg-white p-3 space-y-2">
              {permitsRows.map((row) => {
                const metadata = parseStripeMetadata(row.stripe_metadata);
                const sourceType = (row.type ?? metadata["type"] ?? metadata["billing_type"] ?? "permit")
                  .toString()
                  .trim();
                const accessWindow = [
                  formatCroatianDateTime(row.start_time || row.created_at),
                  formatCroatianDateTime(row.end_time),
                ].join(" — ");
                const statusValue = (row.status ?? "active").toString().trim().toUpperCase();
                return (
                  <div key={row.id} className="rounded-lg border border-black/10 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-black">
                        {row.plate || "Unknown plate"} · {row.location_display_id || row.location_id || "Unknown location"}
                      </p>
                      <p className="text-[11px] text-black/60">{statusValue}</p>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-black/70">
                      <span>{sourceType}</span>
                      <span>{row.contact_name || row.contact_email || "Member permit"}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-black/70">
                      Vrijedi: {accessWindow}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    if (activeItem === "activity") {
      const rowsWithLifecycle = activityRows.map((row) => ({
        row,
        lifecycle: resolveActivityLifecycleForView(row),
      }));
      const upcomingRows = rowsWithLifecycle
        .filter((item) => item.lifecycle === "upcoming" || item.lifecycle === "pending")
        .map((item) => item.row);
      const activeRows = rowsWithLifecycle
        .filter((item) => item.lifecycle === "active")
        .map((item) => item.row);
      const expiredRows = rowsWithLifecycle
        .filter((item) => item.lifecycle === "expired")
        .map((item) => item.row);
      return (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight text-black">
            Activity
          </h2>
          <p className="text-sm text-black/70">
            A timeline of upcoming, active, and expired parking sessions.
          </p>
          {activityLoading && (
            <p className="text-xs text-black/60">Loading live activity...</p>
          )}
          {!activityLoading && activityRows.length === 0 && (
            <p className="text-xs text-black/60">
              No sessions yet. Complete a checkout and this list updates automatically.
            </p>
          )}
          {!activityLoading && (
            <div className="rounded-xl border border-black/10 bg-white p-3 space-y-2">
              <p className="pt-2 text-[11px] font-semibold uppercase tracking-wide text-black/60">Active ({activeRows.length})</p>
              {activeRows.length === 0 && <p className="text-[11px] text-black/50">No active reservations.</p>}
              {activeRows.map((row) => (
                <div key={`active-${row.id}`} className="rounded-lg border border-black/10 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-black">
                      {row.plate || "Unknown plate"} · {row.location_display_id || row.location_id || "Unknown location"}
                    </p>
                    <p className="text-[11px] text-black/60">{formatActivityDate(row.ui_check_in || row.entry_time || row.created_at)}</p>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-black/70">
                    <span>{Number(row.price ?? 0).toFixed(2)} {parseCurrency(row.currency)}</span>
                    <span>ACTIVE</span>
                  </div>
                  <div className="mt-1 text-[11px] text-black/70">
                    Vrijedi: {formatCroatianDateTime(row.ui_check_in || row.entry_time || row.created_at)} — {formatCroatianDateTime(row.ui_check_out || row.exit_time)}
                  </div>
                </div>
              ))}
              <p className="pt-2 text-[11px] font-semibold uppercase tracking-wide text-black/60">NADOLAZEĆI ({upcomingRows.length})</p>
              {upcomingRows.length === 0 && <p className="text-[11px] text-black/50">No upcoming reservations.</p>}
              {upcomingRows.map((row) => (
                <div key={`upcoming-${row.id}`} className="rounded-lg border border-black/10 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-black">
                      {row.plate || "Unknown plate"} · {row.location_display_id || row.location_id || "Unknown location"}
                    </p>
                    <p className="text-[11px] text-black/60">{formatActivityDate(row.ui_check_in || row.entry_time || row.created_at)}</p>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-black/70">
                    <span>{Number(row.price ?? 0).toFixed(2)} {parseCurrency(row.currency)}</span>
                    <span>{resolveActivityLifecycleForView(row) === "pending" ? "NA ČEKANJU · NADOLAZEĆI" : "NADOLAZEĆI"}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-black/70">
                    Vrijedi: {formatCroatianDateTime(row.ui_check_in || row.entry_time || row.created_at)} — {formatCroatianDateTime(row.ui_check_out || row.exit_time)}
                  </div>
                </div>
              ))}
              <p className="pt-2 text-[11px] font-semibold uppercase tracking-wide text-black/60">Expired ({expiredRows.length})</p>
              {expiredRows.length === 0 && <p className="text-[11px] text-black/50">No expired reservations.</p>}
              {expiredRows.map((row) => (
                <div key={`expired-${row.id}`} className="rounded-lg border border-black/10 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-black">
                      {row.plate || "Unknown plate"} · {row.location_display_id || row.location_id || "Unknown location"}
                    </p>
                    <p className="text-[11px] text-black/60">{formatActivityDate(row.ui_check_in || row.entry_time || row.created_at)}</p>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-black/70">
                    <span>{Number(row.price ?? 0).toFixed(2)} {parseCurrency(row.currency)}</span>
                    <span>EXPIRED</span>
                  </div>
                  <div className="mt-1 text-[11px] text-black/70">
                    Vrijedi: {formatCroatianDateTime(row.ui_check_in || row.entry_time || row.created_at)} — {formatCroatianDateTime(row.ui_check_out || row.exit_time)}
                  </div>
                </div>
              ))}
            </div>
          )}
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
              Manage saved cards that can be charged for future sessions.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-black/70">
              Saved payment methods
            </p>
            {paymentMethodsLoading && (
              <p className="text-sm text-black/60">Loading payment methods...</p>
            )}
            {paymentMethods.length === 0 && (
              <p className="text-sm text-black/60">
                No payment methods added yet.
              </p>
            )}
            {paymentMethods.length > 0 && (
              <ul className="space-y-2 text-sm text-black/80">
                {paymentMethods.map((method) => (
                  <li
                    key={method.id}
                    className="flex items-center justify-between rounded-lg border border-black/10 bg-white px-3 py-2"
                  >
                    <span>
                      {method.brand.toUpperCase()} •••• {method.last4}
                      {method.expMonth && method.expYear ? ` · ${method.expMonth}/${method.expYear}` : ""}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-black/50">
                        {method.isDefault ? "Default card" : "Card on file"}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleRemovePaymentMethod(method.id)}
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
              Opens secure Stripe setup and stores cards on your customer profile.
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
                      onClick={() => void persistMemberPlates(plates.filter((value) => value !== plate))}
                      disabled={plateSaving}
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
                  const value = normalizePlateInput(newPlate);
                  if (!value) return;
                  if (plates.includes(value)) {
                    setNewPlate("");
                    return;
                  }
                  void persistMemberPlates([...plates, value]);
                  setNewPlate("");
                }}
                disabled={plateSaving}
                className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-black text-white text-xs font-semibold shadow-md hover:bg-gray-900 transition-colors"
              >
                {plateSaving ? "Saving..." : "Add plate"}
              </button>
            </div>
            {plateMessage && <p className="text-[11px] text-black/60">{plateMessage}</p>}
            <p className="text-[11px] text-black/60">
              Saved plates sync to your account and are available on next sign-in.
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
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight text-black">
            Rewards
          </h2>
          <p className="text-sm text-black/70">
            Track rewards and benefits earned across the Payparq network.
          </p>
          <div className="rounded-xl border border-[#5F3DFC]/20 bg-[#F5F2FF] p-4 space-y-2">
            <p className="text-sm font-semibold text-[#3E22C6]">
              {formatLoyaltyLevelLabel(loyaltySummary?.level)}
            </p>
            <p className="text-xs text-[#3E22C6]/80">
              Points this year: <span className="font-semibold">{loyaltySummary?.pointsYear ?? 0}</span>
            </p>
            <p className="text-xs text-[#3E22C6]/80">
              Total points: <span className="font-semibold">{loyaltySummary?.pointsTotal ?? 0}</span>
            </p>
            <p className="text-xs text-[#3E22C6]/80">
              Bonus bands: L2 {loyaltySummary?.bonusRangeByLevel?.level_2 ?? "1% - 15%"} · L3{" "}
              {loyaltySummary?.bonusRangeByLevel?.level_3 ?? "5% - 20%"}
            </p>
            {loyaltySummary?.nextLevel && (
              <p className="text-[11px] text-[#3E22C6]/70">
                Next level: {formatLoyaltyLevelLabel(loyaltySummary.nextLevel)} ·{" "}
                {loyaltySummary.nextLevelProgressPercent}% complete
              </p>
            )}
          </div>
          <div className="rounded-xl border border-black/10 bg-white p-4 space-y-2">
            <p className="text-sm font-semibold text-black">Wallet history</p>
            {rewardWalletLedger.length === 0 && (
              <p className="text-xs text-black/60">No wallet entries yet.</p>
            )}
            {rewardWalletLedger.map((row) => (
              <div key={row.id} className="flex items-center justify-between text-xs text-black/75">
                <span>{row.entryType.replaceAll("_", " ")}</span>
                <span className={row.direction === "credit" ? "text-green-700" : "text-black"}>
                  {row.direction === "credit" ? "+" : "-"}
                  {formatMoneyFromCents(row.amountCents, walletSummary?.currency || "EUR")}
                </span>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-black/10 bg-white p-4 space-y-2">
            <p className="text-sm font-semibold text-black">Loyalty history</p>
            {rewardLoyaltyLedger.length === 0 && (
              <p className="text-xs text-black/60">No loyalty entries yet.</p>
            )}
            {rewardLoyaltyLedger.map((row) => (
              <div key={row.id} className="flex items-center justify-between text-xs text-black/75">
                <span>{row.source.replaceAll("_", " ")}</span>
                <span>+{row.pointsDelta} pts</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-black">
          Help
        </h2>
        <p className="text-sm text-black/70">
          Find answers, raise a ticket, or reach the Payparq team for support.
        </p>
        <p className="text-sm text-black/80">
          Email: <a className="underline" href="mailto:payparq@outlook.com">payparq@outlook.com</a>
        </p>
        <p className="text-sm text-black/80">
          WhatsApp: <a className="underline" href="https://wa.me/385915963139">+385915963139</a>
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        isSignedIn
          ? "h-screen min-h-0 overflow-hidden bg-[#05020A] text-white flex flex-col"
          : "min-h-screen bg-[#05020A] text-white flex flex-col"
      }
    >
      {!isSignedIn && <SiteHeader />}

      <main
        className={
          isSignedIn
            ? "min-h-0 flex-1 bg-[#05020A] overflow-hidden flex flex-col"
            : "flex-1 bg-[#05020A] pt-24 md:pt-28"
        }
      >
        <section
          className={
            isSignedIn
              ? "w-full px-0 md:px-0 py-0 min-h-0 flex-1 flex flex-col overflow-hidden"
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
                    Authentication is not configured. Add the required environment variables and restart the server.
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
                  Authentication uses your project settings. Configure email
                  sign-in policies, confirmations, and SMTP in your dashboard.
                </p>
                {isLocalDevOverrideEnabled && (
                  <div className="mt-6 rounded-2xl border border-dashed border-black/15 bg-black/[0.02] p-3 text-[11px]">
                    <p className="font-semibold text-black/80">
                      Local-only preview
                    </p>
                    <p className="mt-1 text-black/70">
                      Authentication is not configured locally. You can still open the
                      Members dashboard layout without signing in.
                    </p>
                    <button
                      type="button"
                      onClick={() => setDevSignedIn(true)}
                      className="mt-3 inline-flex items-center px-3 py-1.5 rounded-full bg-black text-white text-[11px] font-semibold hover:bg-gray-900 transition-colors"
                    >
                      Continue to dashboard (no sign-in backend)
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
            <div className="min-h-0 flex-1 flex flex-col bg-[#05020A] overflow-hidden">
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
                    onClick={() => setActiveItem("permits")}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap ${
                      activeItem === "permits"
                        ? "bg-white text-black border-white"
                        : "border-white/20 text-white/80"
                    }`}
                  >
                    <span>Permits & Subs</span>
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

              <div className="min-h-0 flex-1 flex bg-[#05020A] overflow-hidden">
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
                      onClick={() => setActiveItem("permits")}
                      className={`flex w-full items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors ${
                        activeItem === "permits"
                          ? "bg-white text-black"
                          : "text-white/70 hover:bg-white/5"
                      }`}
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[11px]">
                        P
                      </span>
                      <span>Permits & Subs</span>
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

                <div className="min-h-0 flex-1 bg-[#F5F5F7] text-black overflow-hidden">
                  <div className="min-h-0 h-full p-6 md:p-8 flex flex-col gap-4 overflow-hidden">
                    <div className="text-[11px] uppercase tracking-[0.24em] text-black/50">
                      {activeItem === "account"
                        ? "Account settings"
                        : activeItem === "home"
                        ? "Overview"
                        : activeItem === "permits"
                        ? "Permits & Subs"
                        : activeItem === "activity"
                        ? "Activity"
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
                    <div className="bg-white p-5 md:p-6 shadow-sm min-h-0 flex-1 flex flex-col overflow-hidden">
                      <div className="min-h-0 flex-1 overflow-y-auto">
                        {renderActiveContent()}
                      </div>
                      <div className="mt-6 text-[11px] text-black/50">
                        This workspace shows your live sessions, permits,
                        subscriptions, and rewards.
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

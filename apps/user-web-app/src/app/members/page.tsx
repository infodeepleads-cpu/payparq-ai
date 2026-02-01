'use client';

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { FooterBrand } from "@/components/FooterBrand";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type NavItemId =
  | "home"
  | "monthly"
  | "activity"
  | "company"
  | "payment"
  | "vehicles"
  | "promotions"
  | "rewards"
  | "help";

type AuthMode = "sign_in" | "sign_up";

export default function MembersPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [businessOpen, setBusinessOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const [activeItem, setActiveItem] = useState<NavItemId>("home");
  const [sidebarVisible, setSidebarVisible] = useState(true);

  useEffect(() => {
    let cancelled = false;

    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  async function handleAuth(event: FormEvent) {
    event.preventDefault();
    if (!email || !password) {
      setAuthError("Enter your email and password.");
      return;
    }

    setAuthLoading(true);
    setAuthError("");

    try {
      if (authMode === "sign_in") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setAuthError(error.message);
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) {
          setAuthError(error.message);
        }
      }
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  function renderActiveContent() {
    if (activeItem === "home") {
      return (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight text-black">
            Welcome back
          </h2>
          <p className="text-sm text-black/70">
            Select a section in the sidebar to review your activity, manage
            subscriptions, or update your details.
          </p>
        </div>
      );
    }

    if (activeItem === "monthly") {
      return (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight text-black">
            Monthly subscriptions
          </h2>
          <p className="text-sm text-black/70">
            View and manage recurring permits connected to your plate or
            company.
          </p>
        </div>
      );
    }

    if (activeItem === "activity") {
      return (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight text-black">
            Activity
          </h2>
          <p className="text-sm text-black/70">
            A timeline of recent sessions, payments, and enforcement outcomes.
          </p>
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
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight text-black">
            Payment
          </h2>
          <p className="text-sm text-black/70">
            Update saved cards, receipts, and invoicing preferences for your
            account.
          </p>
        </div>
      );
    }

    if (activeItem === "vehicles") {
      return (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight text-black">
            Vehicles
          </h2>
          <p className="text-sm text-black/70">
            Keep your plates up to date so arrivals stay seamless across
            connected locations.
          </p>
        </div>
      );
    }

    if (activeItem === "promotions") {
      return (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight text-black">
            Promotions
          </h2>
          <p className="text-sm text-black/70">
            Redeem and manage promotional codes connected to your profile.
          </p>
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
    <div className="min-h-screen bg-[#05020A] text-white flex flex-col">
      <header className="fixed inset-x-0 top-0 z-40 pointer-events-none font-apple-ui">
        <div className="w-full px-4 md:px-10 pt-3 md:pt-4 pointer-events-auto">
          <div className="bg-white/95 shadow-lg border border-black/5">
            <div className="h-14 md:h-16 grid grid-cols-3 items-center px-4 md:px-8 text-[11px] font-medium text-black">
              <div className="flex items-center justify-start md:justify-center gap-4">
                <button
                  type="button"
                  className="md:hidden flex flex-col justify-center gap-[3px]"
                  onClick={() => setMobileOpen((open) => !open)}
                  aria-label="Toggle navigation"
                  aria-expanded={mobileOpen}
                >
                  <span className="h-[1.5px] w-4 bg-black" />
                  <span className="h-[1.5px] w-4 bg-black" />
                </button>
                <div className="hidden md:flex items-center justify-center gap-7 text-[10px] uppercase tracking-[0.24em]">
                  <Link href="/experience" className="hover:text-gray-700 transition-colors">
                    Experience
                  </Link>
                  <div className="relative">
                    <button
                      className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                      onClick={() => {
                        setBusinessOpen((open) => !open);
                        setCompanyOpen(false);
                      }}
                    >
                      <span>Business</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {businessOpen && (
                      <div className="absolute left-0 mt-2 bg-white shadow-lg border border-black/5 rounded-xl text-[11px] text-black min-w-[180px] z-50">
                        <Link
                          href="/business"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors"
                          onClick={() => setBusinessOpen(false)}
                        >
                          Smart City
                        </Link>
                        <Link
                          href="/parking"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors"
                          onClick={() => setBusinessOpen(false)}
                        >
                          Parking
                        </Link>
                        <Link
                          href="/security"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors"
                          onClick={() => setBusinessOpen(false)}
                        >
                          Security
                        </Link>
                      </div>
                    )}
                  </div>
                  <Link href="/technology" className="hover:text-gray-700 transition-colors">
                    Technology
                  </Link>
                  <div className="relative">
                    <button
                      className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                      onClick={() => {
                        setCompanyOpen((open) => !open);
                        setBusinessOpen(false);
                      }}
                    >
                      <span>Company</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {companyOpen && (
                      <div className="absolute left-0 mt-2 bg-white shadow-lg border border-black/5 rounded-xl text-[11px] text-black min-w-[180px] z-50">
                        <Link
                          href="/about"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors"
                          onClick={() => setCompanyOpen(false)}
                        >
                          About
                        </Link>
                        <Link
                          href="/careers"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors"
                          onClick={() => setCompanyOpen(false)}
                        >
                          Careers
                        </Link>
                        <Link
                          href="/news"
                          className="block px-4 py-2 text-center hover:bg-gray-50 transition-colors"
                          onClick={() => setCompanyOpen(false)}
                        >
                          News
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <Link href="/" className="inline-flex items-center gap-2">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-black flex items-center justify-center">
                    <span className="text-xs md:text-sm font-semibold tracking-tight text-white">
                      P
                    </span>
                  </div>
                  <span className="text-xs md:text-sm font-semibold tracking-tight">
                    payparq members
                  </span>
                </Link>
              </div>
              <div className="flex items-center justify-end gap-2">
                {user && (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="hidden md:inline-flex items-center px-3 py-1.5 rounded-full border border-black/10 text-[10px] font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Log out
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden w-full px-4 md:px-10 pb-3 pointer-events-auto">
            <div className="bg-white shadow-lg border border-black/5 px-4 py-3 text-[11px] text-black space-y-3">
              <div className="flex items-center justify-between">
                <span className="uppercase tracking-[0.24em] text-[10px]">
                  Navigate
                </span>
                {user && (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="text-[10px] font-semibold underline"
                  >
                    Log out
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Link href="/experience">Experience</Link>
                <Link href="/business">Smart City</Link>
                <Link href="/parking">Parking</Link>
                <Link href="/security">Security</Link>
                <Link href="/technology">Technology</Link>
                <Link href="/about">About</Link>
                <Link href="/careers">Careers</Link>
                <Link href="/news">News</Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 pt-20 md:pt-24 bg-[#05020A]">
        <section className="max-w-6xl mx-auto px-4 md:px-10 py-10 md:py-16">
          {!user && (
            <div className="max-w-md mx-auto">
              <div className="rounded-3xl border border-white/10 bg-white text-black p-6 md:p-8 shadow-lg">
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/50 mb-3">
                  Members
                </p>
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
                  Sign in to your Payparq account
                </h1>
                <p className="text-sm text-black/70 mb-6">
                  Use your email to access member tools, subscriptions, and
                  activity.
                </p>
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
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-black/70">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-black bg-white outline-none focus:border-black/40"
                      placeholder="Create a strong password"
                    />
                  </div>
                  {authError && (
                    <p className="text-[11px] text-red-600">{authError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-full bg-black text-white text-xs font-semibold shadow-md hover:bg-gray-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {authMode === "sign_in" ? "Sign in" : "Create account"}
                  </button>
                </form>
                <div className="mt-4 flex items-center justify-between text-[11px] text-black/70">
                  <button
                    type="button"
                    onClick={() =>
                      setAuthMode((mode) =>
                        mode === "sign_in" ? "sign_up" : "sign_in"
                      )
                    }
                    className="underline underline-offset-2"
                  >
                    {authMode === "sign_in"
                      ? "New to Payparq? Create an account"
                      : "Already a member? Sign in"}
                  </button>
                  <Link href="/support" className="hover:text-black">
                    Need help?
                  </Link>
                </div>
                <p className="mt-4 text-[10px] text-black/60">
                  Authentication uses your Supabase project settings. Configure
                  email sign-in policies, confirmations, and SMTP inside your
                  Supabase dashboard.
                </p>
              </div>
            </div>
          )}

          {user && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/60 mb-2">
                    Members
                  </p>
                  <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                    Platform workspace
                  </h1>
                  <p className="text-sm text-white/70">
                    A single place to manage your activity, subscriptions, and
                    vehicles.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSidebarVisible((visible) => !visible)
                  }
                  className="inline-flex items-center px-3 py-1.5 rounded-full border border-white/15 text-[10px] font-semibold hover:bg-white/10 transition-colors"
                >
                  {sidebarVisible ? "Hide sidebar" : "Show sidebar"}
                </button>
              </div>

              <div className="rounded-3xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur">
                <div className="bg-[#5F3DFC] px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/70">
                      Payparq platform
                    </p>
                    <p className="text-sm md:text-base font-semibold">
                      Member dashboard
                    </p>
                  </div>
                  <div className="text-[11px] text-white/80 text-right">
                    <p>Signed in as</p>
                    <p className="font-semibold truncate max-w-[180px]">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row bg-[#05020A]">
                  {sidebarVisible && (
                    <aside className="w-full md:w-72 border-b md:border-b-0 md:border-r border-white/10 bg-[#05020A]">
                      <div className="p-5 space-y-4">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold">
                            {user.email?.split("@")[0] || "Member"}
                          </p>
                          <p className="text-[11px] text-white/60">
                            Account overview
                          </p>
                        </div>
                        <button className="w-full inline-flex items-center justify-center px-3 py-2 rounded-xl bg-white text-black text-[11px] font-semibold shadow-sm hover:bg-gray-100 transition-colors">
                          Account Settings
                        </button>
                      </div>
                      <nav className="px-2 pb-4 space-y-1 text-[12px]">
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
                      </nav>
                      <div className="border-t border-white/10 px-4 py-4">
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="w-full inline-flex items-center justify-center px-3 py-2 rounded-xl border border-white/20 text-[11px] font-semibold text-white/80 hover:bg-white/5 transition-colors"
                        >
                          Log out
                        </button>
                      </div>
                    </aside>
                  )}
                  <div className="flex-1 bg-[#F5F5F7] text-black">
                    <div className="h-full p-6 md:p-8 flex flex-col gap-4">
                      <div className="text-[11px] uppercase tracking-[0.24em] text-black/50">
                        {activeItem === "home"
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
                      <div className="rounded-2xl border border-black/5 bg-white p-5 md:p-6 shadow-sm flex-1 flex flex-col justify-between">
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
            </div>
          )}
        </section>
      </main>

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
              <button className="block hover:text-white transition-colors">
                Partners
              </button>
              <Link href="/support" className="block hover:text-white transition-colors">
                Support
              </Link>
              <Link href="/members" className="block hover:text-white transition-colors">
                Members
              </Link>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t border-white/10">
            <FooterBrand />
          </div>
        </div>
      </footer>
    </div>
  );
}


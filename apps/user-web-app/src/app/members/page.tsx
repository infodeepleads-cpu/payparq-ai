'use client';

import { useEffect, useState, FormEvent, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { FooterBrand } from "@/components/FooterBrand";
import { OperationsPanel } from "@/components/OperationsPanel";
import { ManagementPanel } from "@/components/ManagementPanel";
import { CampaignsPanel } from "@/components/CampaignsPanel";
import { SocialPanel } from "@/components/SocialPanel";
import { ShuttleReservationCard } from "@/components/ShuttleReservationCard";
import { LotCalendarPricing } from "@/components/LotCalendarPricing";
import { NotificationCenter } from "@/components/NotificationCenter";
import { ArrivalsPanel } from "@/components/ArrivalsPanel";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useDeviceToken } from "@/hooks/useDeviceToken";
import { useLocale } from "@/components/LocaleProvider";
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
  | "reviews"
  | "help"
  | "admin"
  | "operations"
  | "management"
  | "campaigns"
  | "social"
  | "arrivals"
  | "moji-prostori"
  | "payouts"
  | "list-lot";
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
  valetEnabled: boolean;
  shuttleEnabled: boolean;
  valetCode?: string | null;
  purchasedAddons?: string[];
  addonsConfig?: Record<string, unknown> | null;
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
function deriveValetCode(sessionId: string | null | undefined): string {
  const id = (sessionId ?? '').trim();
  if (!id) return 'VLT-0000';
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
  }
  return `VLT-${1000 + (Math.abs(hash) % 9000)}`;
}

function deriveShuttleCode(sessionId: string | null | undefined): string {
  const id = (sessionId ?? '').trim();
  if (!id) return 'SHT-0000';
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 37 + id.charCodeAt(i)) & 0xffffffff;
  }
  return `SH-${1000 + (Math.abs(hash) % 9000)}`;
}

function parseActivityAddons(row: ActivityRow): string[] {
  const meta = typeof row.stripe_metadata === 'object' && row.stripe_metadata
    ? row.stripe_metadata as Record<string, unknown>
    : {};
  const raw = (meta['purchased_addons'] ?? '').toString().trim();
  if (!raw) return [];
  return raw.split(',').map((s) => s.split(':')[0].trim()).filter(Boolean);
}

function formatCents(cents: number, currency = 'EUR') {
  return new Intl.NumberFormat('hr-HR', { style: 'currency', currency: currency.toUpperCase(), minimumFractionDigits: 2 }).format(cents / 100);
}

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
  if (normalized.startsWith("member")) {
    return "member";
  }
  return "member";
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

function PayoutsPanel({ user, locale }: { user: User | null; locale: 'en' | 'hr' }) {
  const [earnings, setEarnings] = useState<{ pending_cents: number; total_earned_cents: number; ledger: any[]; payouts: any[] } | null>(null);
  const [bankDetails, setBankDetails] = useState<{ bank_iban: string | null; bank_account_holder: string | null; bank_country: string; configured: boolean } | null>(null);
  const [editingBank, setEditingBank] = useState(false);
  const [ibanInput, setIbanInput] = useState('');
  const [holderInput, setHolderInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase?.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token;
      if (!token) return;
      fetch('/api/owners/earnings', { headers: { authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(setEarnings).catch(() => {});
      fetch('/api/owners/bank-details', { headers: { authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(setBankDetails).catch(() => {});
    });
  }, [user]);

  async function saveBank() {
    if (!ibanInput || !holderInput) return;
    setSaving(true);
    setSaveMsg('');
    const { data } = await supabase!.auth.getSession();
    const token = data.session?.access_token;
    const res = await fetch('/api/owners/bank-details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ bank_iban: ibanInput, bank_account_holder: holderInput }),
    });
    setSaving(false);
    if (res.ok) {
      setSaveMsg('Saved');
      setEditingBank(false);
      const details = await fetch('/api/owners/bank-details', { headers: { authorization: `Bearer ${token}` } }).then(r => r.json());
      setBankDetails(details);
    } else {
      setSaveMsg('Error saving');
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-black">{membersT('Payouts', locale)}</h2>
        <p className="text-sm text-black/70">{membersT('Your earnings and bank account for payouts.', locale)}</p>
      </div>

      {/* Earnings summary */}
      <div className="rounded-lg border border-black/10 p-4 space-y-3">
        <p className="text-xs font-semibold text-black/50 uppercase">{membersT('Earnings', locale)}</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] text-black/50 uppercase font-semibold">{membersT('Pending', locale)}</p>
            <p className="text-xl font-bold text-black">€{((earnings?.pending_cents ?? 0) / 100).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[11px] text-black/50 uppercase font-semibold">{membersT('Total Earned', locale)}</p>
            <p className="text-xl font-bold text-black">€{((earnings?.total_earned_cents ?? 0) / 100).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Bank details */}
      <div className="rounded-lg border border-black/10 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-black/50 uppercase">{membersT('Bank Account', locale)}</p>
          <button type="button" onClick={() => { setEditingBank(!editingBank); setIbanInput(''); setHolderInput(''); }} className="text-xs text-blue-600 underline">
            {editingBank ? membersT('Cancel', locale) : bankDetails?.configured ? membersT('Edit', locale) : membersT('Add', locale)}
          </button>
        </div>
        {!editingBank && bankDetails?.configured && (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-black">{bankDetails.bank_account_holder}</p>
            <p className="text-sm text-black/60 font-mono">{bankDetails.bank_iban}</p>
          </div>
        )}
        {!editingBank && !bankDetails?.configured && (
          <p className="text-sm text-black/50">{membersT('No bank account added. Add your IBAN to receive payouts.', locale)}</p>
        )}
        {editingBank && (
          <div className="space-y-2">
            <input type="text" placeholder="IBAN (e.g. HR1210010051863000160)" value={ibanInput} onChange={e => setIbanInput(e.target.value)} className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm font-mono" />
            <input type="text" placeholder={locale === 'en' ? 'Account Holder Name' : 'Ime vlasnika računa'} value={holderInput} onChange={e => setHolderInput(e.target.value)} className="w-full px-3 py-2 border border-black/20 rounded-lg text-sm" />
            <button type="button" onClick={saveBank} disabled={saving} className="w-full px-3 py-2 rounded-lg bg-black text-white text-sm font-semibold disabled:opacity-50">
              {saving ? membersT('Saving...', locale) : membersT('Save Bank Details', locale)}
            </button>
            {saveMsg && <p className="text-xs text-center text-black/60">{saveMsg}</p>}
          </div>
        )}
      </div>

      {/* Payout history */}
      {(earnings?.payouts?.length ?? 0) > 0 && (
        <div className="rounded-lg border border-black/10 p-4 space-y-2">
          <p className="text-xs font-semibold text-black/50 uppercase">{membersT('Payout History', locale)}</p>
          {earnings!.payouts.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-black/5 last:border-0">
              <div>
                <p className="text-sm font-semibold text-black">€{(p.owner_amount_cents / 100).toFixed(2)}</p>
                <p className="text-[11px] text-black/50">{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : new Date(p.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const MEMBERS_TRANSLATIONS = {
  'Brza rezervacija': { en: 'Quick Reservation', hr: 'Brza rezervacija' },
  'Kopiraj link': { en: 'Copy link', hr: 'Kopiraj link' },
  'Link kopiran': { en: 'Link copied', hr: 'Link kopiran' },
  'Moji prostori': { en: 'My Spaces', hr: 'Moji prostori' },
  'Korisnik': { en: 'Account', hr: 'Korisnik' },
  'Aktivnost': { en: 'Activity', hr: 'Aktivnost' },
  'Vozila': { en: 'Vehicles', hr: 'Vozila' },
  'Plaćanje': { en: 'Payment', hr: 'Plaćanje' },
  'Pomoć': { en: 'Help', hr: 'Pomoć' },
  'Promocije': { en: 'Promotions', hr: 'Promocije' },
  'Nemaš verificiranih prostora. Provjeri status u Moji prostori.': { en: 'No verified spaces. Check status in My Spaces.', hr: 'Nemaš verificiranih prostora. Provjeri status u Moji prostori.' },
  'Nemaš objavljenih prostora. Klikni': { en: 'No listings yet. Click', hr: 'Nemaš objavljenih prostora. Klikni' },
  'za početak': { en: 'to get started', hr: 'za početak' },
  'Operacije': { en: 'Operations', hr: 'Operacije' },
  'Plaćanja': { en: 'Payments', hr: 'Plaćanja' },
  'Dozvole': { en: 'Permits', hr: 'Dozvole' },
  'Recenzije': { en: 'Reviews', hr: 'Recenzije' },
  'Promidžba': { en: 'Promotions', hr: 'Promidžba' },
  'Kampanje': { en: 'Campaigns', hr: 'Kampanje' },
  'Društvene mreže': { en: 'Social Media', hr: 'Društvene mreže' },
  'Dolasci': { en: 'Arrivals', hr: 'Dolasci' },
  'Upravljanje': { en: 'Management', hr: 'Upravljanje' },
  'Upravljaj kalendarima': { en: 'Manage calendars', hr: 'Upravljaj kalendarima' },
  'Signed in as': { en: 'Signed in as', hr: 'Prijavljeni ste kao' },
  'ACTIVE': { en: 'ACTIVE', hr: 'AKTIVNA' },
  'EXPIRED': { en: 'EXPIRED', hr: 'ISTEKLA' },
  'Home': { en: 'Home', hr: 'Početna' },
  'Instant listing': { en: 'Instant listing', hr: 'Trenutna objava' },
  'Arrivals': { en: 'Arrivals', hr: 'Dolasci' },
  'Reviews you gave for parking on PayParq locations': { en: 'Reviews you gave for parking on PayParq locations', hr: 'Recenzije koje ste dali za parkiranje na PayParq lokacijama.' },
  'Arrivals panel': { en: 'Arrivals panel', hr: 'Panel dolazaka' },
  'Manage your parking lots': { en: 'Manage your parking lots', hr: 'Upravljaj svojim parkiralištima.' },
  'Driver scans code': { en: 'Driver scans code', hr: 'Vozač skenira kod' },
  'Shuttle drives directly — no stops': { en: 'Shuttle drives directly — no stops', hr: 'Shuttle vozi izravno — bez zaustavljanja.' },
  // Payouts
  'Payouts': { en: 'Payouts', hr: 'Isplate' },
  'Your earnings and bank account for payouts.': { en: 'Your earnings and bank account for payouts.', hr: 'Vaša zarada i bankovni račun za isplate.' },
  'Earnings': { en: 'Earnings', hr: 'Zarada' },
  'Pending': { en: 'Pending', hr: 'Na čekanju' },
  'Total Earned': { en: 'Total Earned', hr: 'Ukupno zarađeno' },
  'Bank Account': { en: 'Bank Account', hr: 'Bankovni račun' },
  'Cancel': { en: 'Cancel', hr: 'Odustani' },
  'Edit': { en: 'Edit', hr: 'Uredi' },
  'Add': { en: 'Add', hr: 'Dodaj' },
  'No bank account added. Add your IBAN to receive payouts.': { en: 'No bank account added. Add your IBAN to receive payouts.', hr: 'Nema dodanog bankovnog računa. Dodajte IBAN za primanje isplata.' },
  'Saving...': { en: 'Saving...', hr: 'Spremanje...' },
  'Save Bank Details': { en: 'Save Bank Details', hr: 'Spremi podatke o banci' },
  'Payout History': { en: 'Payout History', hr: 'Povijest isplata' },
  // Permits
  'Permits & Subs': { en: 'Permits & Subs', hr: 'Dozvole i pretplate' },
  'All permits and subscriptions linked to your member account.': { en: 'All permits and subscriptions linked to your member account.', hr: 'Sve dozvole i pretplate vezane uz vaš članski račun.' },
  'Loading permits...': { en: 'Loading permits...', hr: 'Učitavanje dozvola...' },
  'No permits or subscriptions found for this account yet.': { en: 'No permits or subscriptions found for this account yet.', hr: 'Za ovaj račun još nema dozvola ili pretplata.' },
  'Unknown plate': { en: 'Unknown plate', hr: 'Nepoznata tablica' },
  'Unknown location': { en: 'Unknown location', hr: 'Nepoznata lokacija' },
  'Member permit': { en: 'Member permit', hr: 'Članska dozvola' },
  'Vrijedi': { en: 'Valid', hr: 'Vrijedi' },
  // Activity
  'Activity': { en: 'Activity', hr: 'Aktivnost' },
  'A timeline of upcoming, active, and expired parking sessions.': { en: 'A timeline of upcoming, active, and expired parking sessions.', hr: 'Pregled nadolazećih, aktivnih i isteklih parkirnih sesija.' },
  'Loading live activity...': { en: 'Loading live activity...', hr: 'Učitavanje aktivnosti...' },
  'No sessions yet. Complete a checkout and this list updates automatically.': { en: 'No sessions yet. Complete a checkout and this list updates automatically.', hr: 'Još nema sesija. Završite naplatu i ovaj popis se automatski ažurira.' },
  'Active': { en: 'Active', hr: 'Aktivne' },
  'No active reservations.': { en: 'No active reservations.', hr: 'Nema aktivnih rezervacija.' },
  'UPCOMING': { en: 'UPCOMING', hr: 'NADOLAZEĆI' },
  'No upcoming reservations.': { en: 'No upcoming reservations.', hr: 'Nema nadolazećih rezervacija.' },
  'Expired': { en: 'Expired', hr: 'Istekle' },
  'No expired reservations.': { en: 'No expired reservations.', hr: 'Nema isteklih rezervacija.' },
  'Unknown email': { en: 'Unknown email', hr: 'Nepoznati email' },
  // Payment
  'Payment': { en: 'Payment', hr: 'Plaćanje' },
  'Manage saved cards that can be charged for future sessions.': { en: 'Manage saved cards that can be charged for future sessions.', hr: 'Upravljajte spremljenim karticama za buduće sesije.' },
  'Payments': { en: 'Payments', hr: 'Plaćanja' },
  'Saved payment methods': { en: 'Saved payment methods', hr: 'Spremljeni načini plaćanja' },
  'Loading payment methods...': { en: 'Loading payment methods...', hr: 'Učitavanje načina plaćanja...' },
  'No payment methods added yet.': { en: 'No payment methods added yet.', hr: 'Još nema dodanih načina plaćanja.' },
  'Default card': { en: 'Default card', hr: 'Zadana kartica' },
  'Card on file': { en: 'Card on file', hr: 'Kartica na računu' },
  'Remove': { en: 'Remove', hr: 'Ukloni' },
  'Add a payment method': { en: 'Add a payment method', hr: 'Dodaj način plaćanja' },
  'Add payment method': { en: 'Add payment method', hr: 'Dodaj način plaćanja' },
  'Opens secure Stripe setup and stores cards on your customer profile.': { en: 'Opens secure Stripe setup and stores cards on your customer profile.', hr: 'Otvara sigurno Stripe postavljanje i sprema kartice na vaš profil.' },
  // Vehicles
  'Vehicles': { en: 'Vehicles', hr: 'Vozila' },
  'Add license plates you use for work so Payparq can recognise your arrivals.': { en: 'Add license plates you use for work so Payparq can recognise your arrivals.', hr: 'Dodajte tablice koje koristite kako bi Payparq prepoznao vaše dolaske.' },
  'Saved plates': { en: 'Saved plates', hr: 'Spremljene tablice' },
  'No plates added yet. Add your first plate below.': { en: 'No plates added yet. Add your first plate below.', hr: 'Još nema dodanih tablica. Dodajte svoju prvu tablicu ispod.' },
  'Add a license plate': { en: 'Add a license plate', hr: 'Dodaj tablicu' },
  'Add plate': { en: 'Add plate', hr: 'Dodaj tablicu' },
  'Saved plates sync to your account and are available on next sign-in.': { en: 'Saved plates sync to your account and are available on next sign-in.', hr: 'Tablice se sinkroniziraju s vašim računom i dostupne su pri sljedećoj prijavi.' },
  // Promotions
  'Promotions are locked until your email is verified.': { en: 'Promotions are locked until your email is verified.', hr: 'Promocije su zaključane dok ne verificirate email.' },
  'Before verifying, check Inbox and Junk/Spam folders.': { en: 'Before verifying, check Inbox and Junk/Spam folders.', hr: 'Prije provjere, provjerite Inbox i mapu Spam.' },
  'Verify email': { en: 'Verify email', hr: 'Verificiraj email' },
  'Resend email': { en: 'Resend email', hr: 'Pošalji ponovo' },
  'Sending...': { en: 'Sending...', hr: 'Slanje...' },
  // Navigation
  'Account overview': { en: 'Account overview', hr: 'Pregled računa' },
  'Account Settings': { en: 'Account Settings', hr: 'Postavke računa' },
  'Help': { en: 'Help', hr: 'Pomoć' },
  'Resources': { en: 'Resources', hr: 'Resursi' },
  'For Hosts': { en: 'For Hosts', hr: 'Za domaćine' },
  'Support': { en: 'Support', hr: 'Podrška' },
  'Log out': { en: 'Log out', hr: 'Odjava' },
} as const;

const membersT = (key: string, locale: 'en' | 'hr'): string => {
  const trans = MEMBERS_TRANSLATIONS[key as keyof typeof MEMBERS_TRANSLATIONS];
  return trans ? trans[locale] : key;
};

export default function MembersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, setLocale } = useLocale();

  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [loginNotice, setLoginNotice] = useState("");
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationNotice, setVerificationNotice] = useState("");

  const [activeItem, setActiveItem] = useState<NavItemId>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [plates, setPlates] = useState<string[]>([]);
  const [newPlate, setNewPlate] = useState("");
  const [plateSaving, setPlateSaving] = useState(false);
  const [plateMessage, setPlateMessage] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodRow[]>([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false);
  const [isStripeConnectExpanded, setIsStripeConnectExpanded] = useState(false);
  const [isStripeConnectConnected, setIsStripeConnectConnected] = useState(false);
  const [copiedLotId, setCopiedLotId] = useState<string | null>(null);
  const [actionProcessing, setActionProcessing] = useState<ActionProcessing | null>(null);
  const [actionError, setActionError] = useState("");
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityRows, setActivityRows] = useState<ActivityRow[]>([]);
  const [permitsRows, setPermitsRows] = useState<PermitRow[]>([]);
  const [reviewsRows, setReviewsRows] = useState<Array<{
    id: string; location_id: string | null; overall_score: number | null;
    score_security: number; score_accessibility: number; score_cleanliness: number;
    score_staff: number; score_value: number; score_location: number;
    comment: string | null; submitted_at: string | null; email_sent_at: string;
    location_name?: string | null;
  }>>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [permitsLoading, setPermitsLoading] = useState(false);

  const [devSignedIn, setDevSignedIn] = useState(false);

  const isLocalDevOverrideEnabled =
    process.env.NODE_ENV === "development" && (!isSupabaseConfigured || searchParams.get('dev') === 'true');

  const displayEmail =
    user?.email || (devSignedIn ? "dev@local.test" : "Unknown email");

  const [homeContext, setHomeContext] = useState<MembersHomeContext | null>(null);
  const [ownerListings, setOwnerListings] = useState<Array<{id: string; name: string; address: string; verification_status: string; capacity: number; display_id: string; verification_metadata?: any}>>([]);
  const [ownerListingsLoading, setOwnerListingsLoading] = useState(true);
  const [selectedLotForManagement, setSelectedLotForManagement] = useState<string | null>(null);
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [loyaltySummary, setLoyaltySummary] = useState<LoyaltySummary | null>(null);
  const [rewardWalletLedger, setRewardWalletLedger] = useState<RewardWalletLedgerRow[]>([]);
  const [rewardLoyaltyLedger, setRewardLoyaltyLedger] = useState<RewardLoyaltyLedgerRow[]>([]);
  const [homeContextLoading, setHomeContextLoading] = useState(true);
  const [homeFeedback, setHomeFeedback] = useState<
    Partial<Record<HomeWidgetId, { type: "success" | "error"; text: string }>>
  >({});
  const [extendMinutes, setExtendMinutes] = useState("120");
  const [extendSyncActive, setExtendSyncActive] = useState(false);
  const [valetToggled, setValetToggled] = useState(false);
  const [shuttleToggled, setShuttleToggled] = useState(true);
  const [summonStatus, setSummonStatus] = useState<string | null>(null);
  const [buyAddonValetOn, setBuyAddonValetOn] = useState(false);
  const [buyAddonValetDays, setBuyAddonValetDays] = useState(1);
  const [buyAddonShuttleOn, setBuyAddonShuttleOn] = useState(false);
  const [buyAddonEvOn, setBuyAddonEvOn] = useState(false);
  const [buyAddonWashOn, setBuyAddonWashOn] = useState(false);
  const [buyAddonWashTier, setBuyAddonWashTier] = useState<'basic' | 'premium'>('basic');
  const [buyAddonFuelOn, setBuyAddonFuelOn] = useState(false);
  const [buyAddonFuelType, setBuyAddonFuelType] = useState<'diesel' | 'benzin'>('diesel');
  const [addonsBuyLoading, setAddonsBuyLoading] = useState(false);
  const [addonsBuyError, setAddonsBuyError] = useState('');
  const [referralCodes, setReferralCodes] = useState<Array<{locationId: string; locationName: string; code: string; expiresAt: string}>>([]);
  const [referralCodesLoading, setReferralCodesLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Localhost bypass - force signed in state
  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  const isSignedIn = (!!user || devSignedIn || isLocalhost);
  const normalizedMemberEmail = (user?.email ?? email ?? 'dev@localhost').trim().toLowerCase();
  const hasMemberIdentity = normalizedMemberEmail.length > 0;

  const isEmailVerified = devSignedIn || Boolean((user as { email_confirmed_at?: string | null } | null)?.email_confirmed_at);
  const pageReady = !homeContextLoading && !ownerListingsLoading;

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
      setIsManager(false);
      setRole(null);
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
      setRole(role);
      setIsAdmin(role === "admin" || role === "super_admin" || role === "officer");
      setIsManager(role === "manager" || role === "admin" || role === "super_admin");
    } catch {
      const fallbackRole = normalizeRole(
        currentUser.user_metadata?.role ?? currentUser.app_metadata?.role
      );
      setRole(fallbackRole);
      setIsAdmin(fallbackRole === "admin" || fallbackRole === "super_admin" || fallbackRole === "officer");
      setIsManager(fallbackRole === "manager" || fallbackRole === "admin" || fallbackRole === "super_admin");
    }
  }

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      setUser(null);
      setIsAdmin(false);
      setIsManager(false);
      return;
    }

    let cancelled = false;

    // Localhost development bypass
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    if (isLocalhost) {
      if (cancelled) return;
      const mockUser = {
        id: 'dev-user-' + Math.random().toString(36).substr(2, 9),
        aud: 'authenticated',
        role: 'authenticated',
        email: 'dev@localhost',
        email_confirmed_at: new Date().toISOString(),
        phone: '',
        confirmed_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        app_metadata: { role: 'super_admin' },
        user_metadata: { role: 'super_admin' },
        identities: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any as User;
      setUser(mockUser);
      setDevSignedIn(true);
      void resolveIsAdmin(mockUser);
      return;
    }

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
          setIsManager(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setIsAdmin(false);
          setIsManager(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setUser(session?.user ?? null);
      if (!session?.user) {
        setIsAdmin(false);
        setIsManager(false);
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
          // Wait for session cookie to be set (OAuth redirect timing)
          await new Promise(resolve => setTimeout(resolve, 500));

          // Check if user is already logged in despite the error
          const { data: sessionData } = await client.auth.getUser();
          if (sessionData.user) {
            setUser(sessionData.user);
            void resolveIsAdmin(sessionData.user);
            setLoginNotice("");
            const cleaned = new URL(window.location.href);
            cleaned.searchParams.delete("token_hash");
            cleaned.searchParams.delete("type");
            cleaned.searchParams.delete("code");
            window.history.replaceState({}, "", `${cleaned.pathname}${cleaned.search}${cleaned.hash}`);
            return;
          }
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

  // Store device token for push notifications
  useDeviceToken(user?.id ?? null);

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
      tab === "account" ||
      tab === "moji-prostori"
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
    if (activeItem === "reviews" && normalizedMemberEmail && !reviewsLoading && reviewsRows.length === 0) {
      setReviewsLoading(true);
      fetch(`/api/members/reviews?email=${encodeURIComponent(normalizedMemberEmail)}`)
        .then((r) => r.json())
        .then((j) => { setReviewsRows(j.reviews ?? []); })
        .catch(() => {})
        .finally(() => setReviewsLoading(false));
    }
  }, [activeItem, refreshActivity, normalizedMemberEmail]);
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
      const redirect = searchParams.get('redirect') || '';
      const redirectTo = redirect || "/members";
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

  async function callService(type: 'valet' | 'shuttle', ticketNo: string, plate?: string | null) {
    try {
      const body: Record<string, unknown> = {
        type,
        location_id: homeContext?.locationId ?? null,
        session_id: homeContext?.sessionId ?? null,
        ticket_no: ticketNo,
        guest_name: displayEmail || null,
        pickup_label: homeContext?.locationName ?? homeContext?.locationDisplayId ?? null,
        plate: plate ?? null,
      };
      const res = await fetch('/api/service-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json();
      if (json.request) {
        setSummonStatus(type === 'valet' ? 'Vaš automobil je na putu · ETA ~6 min' : 'Shuttle je pozvan · Dolazi za ~4 min');
        setTimeout(() => setSummonStatus(null), 6000);
      } else {
        setSummonStatus('Zahtjev nije uspio · Pokušajte ponovo');
        setTimeout(() => setSummonStatus(null), 4000);
      }
    } catch {
      setSummonStatus('Greška · Pokušajte ponovo');
      setTimeout(() => setSummonStatus(null), 4000);
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
    if (!normalizedMemberEmail || !isSignedIn) {
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
  }, [activeItem, getMemberAuthHeaders, isSignedIn, normalizedMemberEmail]);
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
    if (devSignedIn) {
      setOwnerListingsLoading(true);
      setTimeout(() => {
        setOwnerListings([
          {
            id: 'dev-1',
            name: 'Parkiranje Ivica',
            address: 'Ivanova ulica 10, Split',
            verification_status: 'verified',
            capacity: 5,
            display_id: 'IVA-001',
            verification_metadata: { section_status: { section1: true, section2: true, section3: true } }
          },
          {
            id: 'dev-2',
            name: 'Safe Parking Center',
            address: 'Centar grada, Split',
            verification_status: 'verified',
            capacity: 20,
            display_id: 'SPC-001',
            verification_metadata: { section_status: { section1: true, section2: true, section3: true } }
          }
        ]);
        setOwnerListingsLoading(false);
      }, 500);
      return;
    }
    if (!user || !supabase) { setOwnerListingsLoading(false); return; }
    setOwnerListingsLoading(true);
    supabase
      .from('locations')
      .select('id, name, address, verification_status, capacity, display_id, verification_metadata')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOwnerListings(data ?? []);
        setOwnerListingsLoading(false);
      });
  }, [user, supabase]);

  // Fetch referral codes for all owner listings
  useEffect(() => {
    if (ownerListings.length === 0) {
      setReferralCodes([]);
      return;
    }

    setReferralCodesLoading(true);
    Promise.all(
      ownerListings.map(async (listing) => {
        try {
          const res = await fetch(`/api/promo/auto?location_id=${encodeURIComponent(listing.id)}`);
          if (res.ok) {
            const data = (await res.json()) as { code?: string; error?: string } | null;
            if (data?.code) {
              return { locationId: listing.id, locationName: listing.name, code: data.code, expiresAt: '' };
            }
          }
        } catch {}
        return null;
      })
    ).then((codes) => {
      setReferralCodes(codes.filter((c) => c !== null) as Array<{locationId: string; locationName: string; code: string; expiresAt: string}>);
      setReferralCodesLoading(false);
    });
  }, [ownerListings]);

  const refreshStripeConnectStatus = useCallback(async () => {
    if (!user || !supabase) return;
    const { data, error } = await supabase
      .from('stripe_accounts')
      .select('stripe_account_id, is_connected')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.warn('[StripeConnect] status check failed:', error.message);
      return;
    }
    setIsStripeConnectConnected(
      Boolean(data?.is_connected) || Boolean(data?.stripe_account_id)
    );
  }, [user]);

  useEffect(() => {
    void refreshStripeConnectStatus();
  }, [refreshStripeConnectStatus]);

  useEffect(() => {
    if (activeItem === 'payouts') {
      void refreshStripeConnectStatus();
    }
  }, [activeItem, refreshStripeConnectStatus]);

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
      let authToken: string | undefined = undefined;
      if (supabase && isSupabaseConfigured) {
        const { data } = await supabase.auth.getSession();
        authToken = data.session?.access_token || undefined;
      }
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers,
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

  async function handleAddonsBuyCheckout() {
    if (!homeContext) return;
    const cfg = (homeContext.addonsConfig ?? {}) as Record<string, unknown>;
    const purchased = homeContext.purchasedAddons ?? [];
    type AddonItem = { id: string; label: string; price_cents: number; quantity?: number };
    const items: AddonItem[] = [];
    if (buyAddonValetOn && (cfg.valet as Record<string,unknown>)?.enabled && !homeContext.valetEnabled) {
      const priceCents = Number((cfg.valet as Record<string,unknown>)?.price_cents ?? 500);
      items.push({ id: 'valet', label: `Valet parking (${buyAddonValetDays} dan/a)`, price_cents: priceCents, quantity: buyAddonValetDays });
    }
    if (buyAddonShuttleOn && (cfg.shuttle as Record<string,unknown>)?.enabled && !homeContext.shuttleEnabled) {
      items.push({ id: 'shuttle', label: 'Prijevoz (1 smjer)', price_cents: Number((cfg.shuttle as Record<string,unknown>)?.price_cents ?? 200) });
    }
    if (buyAddonEvOn && (cfg.ev_charging as Record<string,unknown>)?.enabled && !purchased.includes('ev_charging')) {
      items.push({ id: 'ev_charging', label: 'EV punjenje', price_cents: Number((cfg.ev_charging as Record<string,unknown>)?.price_cents ?? 2000) });
    }
    if (buyAddonWashOn && (cfg.car_wash as Record<string,unknown>)?.enabled && !purchased.some(p => p.startsWith('car_wash'))) {
      const opts = (cfg.car_wash as Record<string,unknown>)?.options as Array<{id:string;price_cents:number}> | undefined;
      const opt = opts?.find(o => o.id === buyAddonWashTier);
      items.push({ id: `car_wash_${buyAddonWashTier}`, label: `Pranje vozila (${buyAddonWashTier === 'premium' ? 'Premium' : 'Basic'})`, price_cents: opt?.price_cents ?? (buyAddonWashTier === 'premium' ? 3000 : 1500) });
    }
    if (buyAddonFuelOn && (cfg.fuel as Record<string,unknown>)?.enabled && !purchased.some(p => p.startsWith('fuel'))) {
      const opts = (cfg.fuel as Record<string,unknown>)?.options as Array<{id:string;price_cents:number}> | undefined;
      const opt = opts?.find(o => o.id === buyAddonFuelType);
      items.push({ id: `fuel_${buyAddonFuelType}`, label: `Punjenje gorivom (${buyAddonFuelType === 'diesel' ? 'Diesel' : 'Benzin'})`, price_cents: opt?.price_cents ?? (buyAddonFuelType === 'diesel' ? 6000 : 5500) });
    }
    if (items.length === 0) return;
    setAddonsBuyLoading(true);
    setAddonsBuyError('');
    try {
      let authToken: string | undefined = undefined;
      if (supabase && isSupabaseConfigured) {
        const { data } = await supabase.auth.getSession();
        authToken = data.session?.access_token || undefined;
      }
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }
      const res = await fetch('/api/stripe/addons-checkout', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          session_id: homeContext.stripeSessionId ?? homeContext.sessionId ?? '',
          location_id: homeContext.locationId ?? '',
          location_display_id: homeContext.locationDisplayId ?? '',
          location_name: homeContext.locationName ?? '',
          email: normalizedMemberEmail,
          addons: items,
        }),
      });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !data?.url) {
        setAddonsBuyError(data?.error || 'Greška pri kreiranju plaćanja.');
        return;
      }
      window.location.href = data.url;
    } catch {
      setAddonsBuyError('Greška pri kreiranju plaćanja.');
    } finally {
      setAddonsBuyLoading(false);
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
                {membersT('Signed in as', locale)} <span className="font-semibold">{displayEmail}</span>
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {!isEmailVerified && (
                  <button
                    type="button"
                    onClick={handleSendVerificationEmail}
                    disabled={verificationLoading}
                    className="inline-flex items-center px-3 py-1.5 rounded-full bg-[black] text-white text-[11px] font-semibold hover:bg-[#4330c4] transition-colors disabled:opacity-60"
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
            <div className="rounded-xl border border-black/5 bg-black/[0.02] p-4 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/60">
                Language
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLocale('en')}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors ${
                    locale === 'en'
                      ? 'bg-black text-white'
                      : 'border border-black/10 hover:bg-black/5'
                  }`}
                >
                  Engleski
                </button>
                <button
                  type="button"
                  onClick={() => setLocale('hr')}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors ${
                    locale === 'hr'
                      ? 'bg-black text-white'
                      : 'border border-black/10 hover:bg-black/5'
                  }`}
                >
                  Hrvatski
                </button>
              </div>
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
              <div className="rounded-lg border border-[black]/25 bg-[#EFF6FF] px-3 py-2 text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#2563EB]/70">Wallet</p>
                <p className="text-sm font-semibold text-[#2563EB]">
                  {formatMoneyFromCents(walletSummary?.balanceCents, walletSummary?.currency || "EUR")}
                </p>
                <p className="text-[11px] text-[#2563EB]/85">
                  {formatLoyaltyLevelLabel(loyaltySummary?.level)}
                  {(loyaltySummary?.pointsYear ?? 0) > 0 ? ` · ${loyaltySummary?.pointsYear ?? 0} pts` : ""}
                </p>
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
          {/* Shuttle confirmation card — shown when shuttle is included in price */}
          {homeContext?.shuttleEnabled && (() => {
            const cfg = (homeContext.addonsConfig ?? {}) as Record<string, unknown>;
            const phoneSms = ((cfg.phone_sms as string | undefined) ?? '385915963139').replace(/\D/g, '') || '385915963139';
            const pickup = (cfg.pickup_point as { lat?: number; lng?: number; label?: string } | undefined) ?? null;
            const shtCode = deriveShuttleCode(homeContext.stripeSessionId);
            const mapHref = pickup?.lat && pickup?.lng
              ? `https://www.google.com/maps?q=${pickup.lat},${pickup.lng}`
              : pickup?.label
                ? `https://www.google.com/maps/search/${encodeURIComponent(pickup.label)}`
                : null;
            return (
              <div className="rounded-xl border border-[#0F6E56]/20 overflow-hidden">
                {/* Header */}
                <div className="bg-[#0F6E56] px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <rect x="1" y="8" width="22" height="10" rx="2"/><path d="M5 18v2M19 18v2"/><path d="M1 12h22"/><path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/>
                    </svg>
                    <span className="text-white text-[11px] font-semibold uppercase tracking-widest">Shuttle potvrda</span>
                  </div>
                  <span className="text-white/80 text-[11px] font-mono font-bold">{shtCode}</span>
                </div>
                {/* Steps */}
                <div className="bg-[#E1F5EE] px-4 py-3 space-y-3 text-[12px]">
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#0F6E56] flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[9px] font-bold text-white">1</span>
                    </div>
                    <div>
                      <p className="font-semibold text-black">Dođite na ukrcajnu točku</p>
                      {pickup?.label && <p className="text-black/60 mt-0.5">{pickup.label}</p>}
                      {mapHref && (
                        <a href={mapHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-0.5 text-[#0F6E56] font-semibold underline underline-offset-2">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          Prikaži pick-up / drop-off zonu
                        </a>
                      )}
                      <p className="text-black/60 mt-0.5">Po dolasku pritisnite &ldquo;Pozovi shuttle&rdquo; · <strong className="text-black">ETA 3–8 min</strong></p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#0F6E56] flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[9px] font-bold text-white">2</span>
                    </div>
                    <div>
                      <p className="font-semibold text-black">Ukrcaj i vožnja</p>
                      <p className="text-black/60 mt-0.5">{membersT('Driver scans code', locale)} <span className="font-mono font-bold text-[#0F6E56]">{shtCode}</span>. {membersT('Shuttle drives directly — no stops', locale)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#0F6E56] flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[9px] font-bold text-white">3</span>
                    </div>
                    <div>
                      <p className="font-semibold text-black">{locale === 'en' ? 'Back' : 'Povratak'}</p>
                      <p className="text-black/60 mt-0.5">Pozovite shuttle putem gumba &ldquo;Pozovi shuttle&rdquo; ispod.</p>
                    </div>
                  </div>
                </div>
                {/* Footer */}
                <div className="bg-white border-t border-[#0F6E56]/10 px-4 py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-black/50">Hitni kontakt · 24/7</p>
                    <a href={`tel:+${phoneSms}`} className="text-[12px] font-bold text-[#0F6E56]">+{phoneSms}</a>
                  </div>
                  <a
                    href={`https://wa.me/${phoneSms}?text=${encodeURIComponent(`Shuttle zahtjev · ${homeContext.locationName ?? homeContext.locationDisplayId ?? ''} · ${shtCode}`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-[#0F6E56] underline underline-offset-2"
                  >
                    Chat s vozačem
                  </a>
                </div>
              </div>
            );
          })()}

          <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}>
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
            {homeContext?.valetEnabled && (() => {
              const cfg = (homeContext.addonsConfig ?? {}) as Record<string, unknown>;
              const valetCfg = cfg.valet as Record<string, unknown> | undefined;
              const phoneSms = ((cfg.phone_sms as string | undefined) ?? '385915963139').replace(/\D/g, '') || '385915963139';
              const valetCode = homeContext.valetCode ?? deriveValetCode(homeContext.stripeSessionId);
              const priceCents = Number(valetCfg?.price_cents ?? 500);
              return (
                <div className="min-w-[210px] rounded-xl border border-[black]/20 bg-[#EFF6FF] p-3 space-y-2">
                  <p className="text-sm font-semibold text-[black]">Valet parking</p>
                  <p className="text-[11px] text-[black]/70">Uključeno u cijenu · kod <span className="font-mono font-bold">{valetCode}</span></p>
                  <p className="text-[10px] text-black/40">Vrijednost: {formatCents(priceCents)}</p>
                  <button type="button" onClick={() => setValetToggled(v => !v)} className="flex items-center gap-2">
                    <div className="w-10 h-[22px] rounded-full border transition-colors duration-200 relative shrink-0" style={{ background: valetToggled ? 'black' : '#f3f4f6', borderColor: valetToggled ? 'black' : '#e5e7eb' }}>
                      <div className="w-[18px] h-[18px] rounded-full bg-white absolute top-[2px] transition-all duration-200 shadow-sm" style={{ left: valetToggled ? '18px' : '2px' }} />
                    </div>
                    <span className="text-xs font-medium text-black">{valetToggled ? 'Uključeno' : 'Isključeno'}</span>
                  </button>
                  {valetToggled && (
                    <button
                      type="button"
                      onClick={() => callService('valet', valetCode, homeContext.plate ?? null)}
                      className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-[black] text-white text-xs font-semibold hover:bg-[#2563EB] transition-colors"
                    >
                      Pozovi auto
                    </button>
                  )}
                </div>
              );
            })()}
            {homeContext?.shuttleEnabled && (() => {
              const cfg = (homeContext.addonsConfig ?? {}) as Record<string, unknown>;
              const shuttleCfg = cfg.shuttle as Record<string, unknown> | undefined;
              const isReserved = (shuttleCfg?.reservation_required as boolean) ?? false;
              const shtCode = deriveShuttleCode(homeContext.stripeSessionId);
              const priceCents = Number(shuttleCfg?.price_cents ?? 200);

              // If reserved shuttle, show reservation card instead of on-demand button
              if (isReserved) {
                return <ShuttleReservationCard sessionId={homeContext.sessionId ?? undefined} locationId={homeContext.locationId ?? undefined} />;
              }

              return (
                <div className="min-w-[210px] rounded-xl border border-[#0F6E56]/20 bg-[#E1F5EE] p-3 space-y-2">
                  <p className="text-sm font-semibold text-[#0F6E56]">Shuttle prijevoz</p>
                  <p className="text-[11px] text-[#0F6E56]/70">Uključeno u cijenu · kod <span className="font-mono font-bold">{shtCode}</span></p>
                  <p className="text-[10px] text-black/40">Vrijednost: {formatCents(priceCents)}</p>
                  <button type="button" onClick={() => setShuttleToggled(s => !s)} className="flex items-center gap-2">
                    <div className="w-10 h-[22px] rounded-full border transition-colors duration-200 relative shrink-0" style={{ background: shuttleToggled ? '#1D9E75' : '#f3f4f6', borderColor: shuttleToggled ? '#0F6E56' : '#e5e7eb' }}>
                      <div className="w-[18px] h-[18px] rounded-full bg-white absolute top-[2px] transition-all duration-200 shadow-sm" style={{ left: shuttleToggled ? '18px' : '2px' }} />
                    </div>
                    <span className="text-xs font-medium text-black">{shuttleToggled ? 'Uključeno' : 'Isključeno'}</span>
                  </button>
                  {shuttleToggled && (
                    <button
                      type="button"
                      onClick={() => callService('shuttle', shtCode, null)}
                      className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-[#1D9E75] text-white text-xs font-semibold hover:bg-[#0F6E56] transition-colors"
                    >
                      Pozovi shuttle
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
          {summonStatus && (
            <div className="mt-2 rounded-xl bg-[#E1F5EE] border border-[#0F6E56]/20 px-3 py-2.5 text-[13px] text-[#0F6E56] text-center">
              {summonStatus}
            </div>
          )}

          {/* Purchased addon tracker */}
          {homeContext && (homeContext.purchasedAddons ?? []).length > 0 && (() => {
            const purchased = homeContext.purchasedAddons ?? [];
            const sid = homeContext.stripeSessionId ?? homeContext.sessionId ?? '';
            const cfg = (homeContext.addonsConfig ?? {}) as Record<string, unknown>;
            const phoneSms = ((cfg.phone_sms as string | undefined) ?? '385915963139').replace(/\D/g, '') || '385915963139';
            const badgeMap: Record<string, { label: string; color: string; bg: string }> = {
              valet: { label: 'VLT', color: 'black', bg: '#EFF6FF' },
              shuttle: { label: 'SHT', color: '#0F6E56', bg: '#E1F5EE' },
              ev_charging: { label: 'EV', color: '#2E7D32', bg: '#E8F5E9' },
              car_wash_basic: { label: 'WASH', color: '#1565C0', bg: '#E3F2FD' },
              car_wash_premium: { label: 'WASH+', color: '#1565C0', bg: '#E3F2FD' },
              fuel_diesel: { label: 'FUEL', color: '#F57F17', bg: '#FFF8E1' },
              fuel_benzin: { label: 'FUEL', color: '#F57F17', bg: '#FFF8E1' },
            };
            return (
              <div className="rounded-xl border border-black/10 bg-white p-3 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-black/50">Kupljene usluge</p>
                <div className="flex flex-wrap gap-2">
                  {purchased.map((addonId) => {
                    const badge = badgeMap[addonId] ?? { label: addonId.toUpperCase(), color: '#333', bg: '#f3f4f6' };
                    return (
                      <span key={addonId} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold" style={{ background: badge.bg, color: badge.color }}>
                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: badge.color }} />
                        {badge.label}
                      </span>
                    );
                  })}
                </div>
                {(purchased.includes('valet') || purchased.includes('shuttle')) && (
                  <div className="pt-1 space-y-1 text-[12px]">
                    {purchased.includes('valet') && (
                      <div className="flex items-center justify-between">
                        <span className="text-black/50">Valet kod</span>
                        <a
                          href={`https://wa.me/${phoneSms}?text=${encodeURIComponent(`${deriveValetCode(sid)} - Poziv vozila`)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="font-mono font-bold text-[black]"
                        >
                          {deriveValetCode(sid)}
                        </a>
                      </div>
                    )}
                    {purchased.includes('shuttle') && (
                      <div className="flex items-center justify-between">
                        <span className="text-black/50">Shuttle kod</span>
                        <a
                          href={`https://wa.me/${phoneSms}?text=${encodeURIComponent(`Shuttle zahtjev · ${homeContext.locationName ?? ''} · ${deriveShuttleCode(sid)}`)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="font-mono font-bold text-[#0F6E56]"
                        >
                          {deriveShuttleCode(sid)}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Purchasable addons section */}
          {homeContext && (() => {
            const cfg = (homeContext.addonsConfig ?? {}) as Record<string, unknown>;
            const purchased = homeContext.purchasedAddons ?? [];
            const valetCfg = cfg.valet as Record<string, unknown> | undefined;
            const shuttleCfg = cfg.shuttle as Record<string, unknown> | undefined;
            const evCfg = cfg.ev_charging as Record<string, unknown> | undefined;
            const washCfg = cfg.car_wash as Record<string, unknown> | undefined;
            const fuelCfg = cfg.fuel as Record<string, unknown> | undefined;
            const showBuyValet = Boolean(valetCfg?.enabled && !homeContext.valetEnabled);
            const showBuyShuttle = Boolean(shuttleCfg?.enabled && !homeContext.shuttleEnabled);
            const showBuyEv = Boolean(evCfg?.enabled && !purchased.includes('ev_charging'));
            const showBuyWash = Boolean(washCfg?.enabled && !purchased.some(p => p.startsWith('car_wash')));
            const showBuyFuel = Boolean(fuelCfg?.enabled && !purchased.some(p => p.startsWith('fuel')));
            if (!showBuyValet && !showBuyShuttle && !showBuyEv && !showBuyWash && !showBuyFuel) return null;
            const valetPriceCents = Number(valetCfg?.price_cents ?? 500) * buyAddonValetDays;
            const shuttlePriceCents = Number(shuttleCfg?.price_cents ?? 200);
            const evPriceCents = Number(evCfg?.price_cents ?? 2000);
            const washOpts = washCfg?.options as Array<{id:string;price_cents:number}> | undefined;
            const washPriceCents = washOpts?.find(o => o.id === buyAddonWashTier)?.price_cents ?? (buyAddonWashTier === 'premium' ? 3000 : 1500);
            const fuelOpts = fuelCfg?.options as Array<{id:string;price_cents:number}> | undefined;
            const fuelPriceCents = fuelOpts?.find(o => o.id === buyAddonFuelType)?.price_cents ?? (buyAddonFuelType === 'diesel' ? 6000 : 5500);
            const totalCents =
              (buyAddonValetOn && showBuyValet ? valetPriceCents : 0) +
              (buyAddonShuttleOn && showBuyShuttle ? shuttlePriceCents : 0) +
              (buyAddonEvOn && showBuyEv ? evPriceCents : 0) +
              (buyAddonWashOn && showBuyWash ? washPriceCents : 0) +
              (buyAddonFuelOn && showBuyFuel ? fuelPriceCents : 0);
            const anySelected = (buyAddonValetOn && showBuyValet) || (buyAddonShuttleOn && showBuyShuttle) || (buyAddonEvOn && showBuyEv) || (buyAddonWashOn && showBuyWash) || (buyAddonFuelOn && showBuyFuel);
            return (
              <div className="rounded-xl border border-black/10 bg-white p-4 space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-black/50">Dodaj usluge</p>
                <div className="space-y-2">
                  {showBuyValet && (
                    <div className="flex items-center justify-between rounded-xl border border-black/10 p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect x="9" y="11" width="14" height="10" rx="1"/><path d="M13 16v-1a2 2 0 1 1 4 0v1"/></svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-black">Valet parking</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <select value={buyAddonValetDays} onChange={e => setBuyAddonValetDays(Number(e.target.value))} className="text-[11px] border border-black/10 rounded px-1 py-0.5 bg-white text-black outline-none">
                              {[1,2,3,4,5,6,7].map(d => <option key={d} value={d}>{d} dan{d > 1 ? 'a' : ''}</option>)}
                            </select>
                            <span className="text-[11px] text-black/50">{formatCents(valetPriceCents)}</span>
                          </div>
                        </div>
                      </div>
                      <button type="button" onClick={() => setBuyAddonValetOn(v => !v)} className="shrink-0">
                        <div className="w-10 h-[22px] rounded-full border transition-colors duration-200 relative" style={{ background: buyAddonValetOn ? 'black' : '#f3f4f6', borderColor: buyAddonValetOn ? 'black' : '#e5e7eb' }}>
                          <div className="w-[18px] h-[18px] rounded-full bg-white absolute top-[2px] transition-all duration-200 shadow-sm" style={{ left: buyAddonValetOn ? '18px' : '2px' }} />
                        </div>
                      </button>
                    </div>
                  )}
                  {showBuyShuttle && (
                    <div className="flex items-center justify-between rounded-xl border border-black/10 p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#E1F5EE] flex items-center justify-center shrink-0">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2"><rect x="1" y="8" width="22" height="10" rx="2"/><path d="M5 18v2M19 18v2"/><path d="M1 12h22"/><path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/></svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-black">Shuttle prijevoz</p>
                          <p className="text-[11px] text-black/50">{formatCents(shuttlePriceCents)} / smjer</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => setBuyAddonShuttleOn(v => !v)} className="shrink-0">
                        <div className="w-10 h-[22px] rounded-full border transition-colors duration-200 relative" style={{ background: buyAddonShuttleOn ? '#0F6E56' : '#f3f4f6', borderColor: buyAddonShuttleOn ? '#0F6E56' : '#e5e7eb' }}>
                          <div className="w-[18px] h-[18px] rounded-full bg-white absolute top-[2px] transition-all duration-200 shadow-sm" style={{ left: buyAddonShuttleOn ? '18px' : '2px' }} />
                        </div>
                      </button>
                    </div>
                  )}
                  {showBuyEv && (
                    <div className="flex items-center justify-between rounded-xl border border-black/10 p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] flex items-center justify-center shrink-0">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-black">EV punjenje</p>
                          <p className="text-[11px] text-black/50">{formatCents(evPriceCents)}</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => setBuyAddonEvOn(v => !v)} className="shrink-0">
                        <div className="w-10 h-[22px] rounded-full border transition-colors duration-200 relative" style={{ background: buyAddonEvOn ? '#2E7D32' : '#f3f4f6', borderColor: buyAddonEvOn ? '#2E7D32' : '#e5e7eb' }}>
                          <div className="w-[18px] h-[18px] rounded-full bg-white absolute top-[2px] transition-all duration-200 shadow-sm" style={{ left: buyAddonEvOn ? '18px' : '2px' }} />
                        </div>
                      </button>
                    </div>
                  )}
                  {showBuyWash && (
                    <div className="flex items-center justify-between rounded-xl border border-black/10 p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#E3F2FD] flex items-center justify-center shrink-0">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1565C0" strokeWidth="2"><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 6a6 6 0 0 1 6 6"/><path d="M12 10a2 2 0 0 1 2 2"/><path d="M5 12H2"/><path d="M5.5 15.5L3 18"/><path d="M5.5 8.5L3 6"/></svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-black">Pranje vozila</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <select value={buyAddonWashTier} onChange={e => setBuyAddonWashTier(e.target.value as 'basic'|'premium')} className="text-[11px] border border-black/10 rounded px-1 py-0.5 bg-white text-black outline-none">
                              <option value="basic">Basic</option>
                              <option value="premium">Premium</option>
                            </select>
                            <span className="text-[11px] text-black/50">{formatCents(washPriceCents)}</span>
                          </div>
                        </div>
                      </div>
                      <button type="button" onClick={() => setBuyAddonWashOn(v => !v)} className="shrink-0">
                        <div className="w-10 h-[22px] rounded-full border transition-colors duration-200 relative" style={{ background: buyAddonWashOn ? '#1565C0' : '#f3f4f6', borderColor: buyAddonWashOn ? '#1565C0' : '#e5e7eb' }}>
                          <div className="w-[18px] h-[18px] rounded-full bg-white absolute top-[2px] transition-all duration-200 shadow-sm" style={{ left: buyAddonWashOn ? '18px' : '2px' }} />
                        </div>
                      </button>
                    </div>
                  )}
                  {showBuyFuel && (
                    <div className="flex items-center justify-between rounded-xl border border-black/10 p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#FFF8E1] flex items-center justify-center shrink-0">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F57F17" strokeWidth="2"><path d="M3 22V8l7-6 7 6v14"/><path d="M10 22V12h4v10"/><path d="M18 10h1a2 2 0 0 1 2 2v3a1 1 0 0 0 1 1 1 1 0 0 1-1 1v3a2 2 0 0 1-2 2h-1"/></svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-black">Punjenje gorivom</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <select value={buyAddonFuelType} onChange={e => setBuyAddonFuelType(e.target.value as 'diesel'|'benzin')} className="text-[11px] border border-black/10 rounded px-1 py-0.5 bg-white text-black outline-none">
                              <option value="diesel">Diesel</option>
                              <option value="benzin">Benzin</option>
                            </select>
                            <span className="text-[11px] text-black/50">{formatCents(fuelPriceCents)}</span>
                          </div>
                        </div>
                      </div>
                      <button type="button" onClick={() => setBuyAddonFuelOn(v => !v)} className="shrink-0">
                        <div className="w-10 h-[22px] rounded-full border transition-colors duration-200 relative" style={{ background: buyAddonFuelOn ? '#F57F17' : '#f3f4f6', borderColor: buyAddonFuelOn ? '#F57F17' : '#e5e7eb' }}>
                          <div className="w-[18px] h-[18px] rounded-full bg-white absolute top-[2px] transition-all duration-200 shadow-sm" style={{ left: buyAddonFuelOn ? '18px' : '2px' }} />
                        </div>
                      </button>
                    </div>
                  )}
                </div>
                {anySelected && (
                  <div className="pt-1 space-y-2">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-black/50">Ukupno</span>
                      <span className="font-semibold text-black">{formatCents(totalCents)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddonsBuyCheckout}
                      disabled={addonsBuyLoading}
                      className="w-full py-3 rounded-xl bg-black text-white text-[14px] font-semibold text-center hover:bg-gray-900 disabled:opacity-50 transition-colors"
                    >
                      {addonsBuyLoading ? 'Preusmjeravanje...' : 'Plati usluge'}
                    </button>
                    {addonsBuyError && <p className="text-[11px] text-red-600">{addonsBuyError}</p>}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      );
    }

    if (activeItem === "permits") {
      return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight text-black">
            {membersT('Permits & Subs', locale)}
          </h2>
          <p className="text-sm text-black/70">
            {membersT('All permits and subscriptions linked to your member account.', locale)}
          </p>
          {permitsLoading && (
            <p className="text-xs text-black/60">{membersT('Loading permits...', locale)}</p>
          )}
          {!permitsLoading && permitsRows.length === 0 && (
            <p className="text-xs text-black/60">
              {membersT('No permits or subscriptions found for this account yet.', locale)}
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
                const statusDisplay = statusValue === "PROĆE" || statusValue === "VALID" ? "VALIDNO" : statusValue === "ACTIVE" ? "AKTIVNO" : statusValue;
                return (
                  <div key={row.id} className="rounded-lg border border-black/10 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-black">
                        {row.plate || membersT('Unknown plate', locale)} · {row.location_display_id || row.location_id || membersT('Unknown location', locale)}
                      </p>
                      <p className="text-[11px] text-black/60">{statusDisplay}</p>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-black/70">
                      <span>{sourceType}</span>
                      <span>{row.contact_name || row.contact_email || membersT('Member permit', locale)}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-black/70">
                      {membersT('Vrijedi', locale)}: {accessWindow}
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
            {membersT('Activity', locale)}
          </h2>
          <p className="text-sm text-black/70">
            {membersT('A timeline of upcoming, active, and expired parking sessions.', locale)}
          </p>
          {activityLoading && (
            <p className="text-xs text-black/60">{membersT('Loading live activity...', locale)}</p>
          )}
          {!activityLoading && activityRows.length === 0 && (
            <p className="text-xs text-black/60">
              {membersT('No sessions yet. Complete a checkout and this list updates automatically.', locale)}
            </p>
          )}
          {!activityLoading && (
            <div className="rounded-xl border border-black/10 bg-white p-3 space-y-2">
              <p className="pt-2 text-[11px] font-semibold uppercase tracking-wide text-black/60">{membersT('Active', locale)} ({activeRows.length})</p>
              {activeRows.length === 0 && <p className="text-[11px] text-black/50">{membersT('No active reservations.', locale)}</p>}
              {activeRows.map((row) => {
                const addons = parseActivityAddons(row);
                return (
                  <div key={`active-${row.id}`} className="rounded-lg border border-black/10 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-black">
                        {row.plate || membersT('Unknown plate', locale)} · {row.location_display_id || row.location_id || membersT('Unknown location', locale)}
                      </p>
                      <p className="text-[11px] text-black/60">{formatActivityDate(row.ui_check_in || row.entry_time || row.created_at)}</p>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-black/70">
                      <span>{Number(row.price ?? 0).toFixed(2)} {parseCurrency(row.currency)}</span>
                      <span>{membersT('ACTIVE', locale)}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-black/70">
                      {membersT('Vrijedi', locale)}: {formatCroatianDateTime(row.ui_check_in || row.entry_time || row.created_at)} — {formatCroatianDateTime(row.ui_check_out || row.exit_time)}
                    </div>
                    {addons.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {addons.map(a => <span key={a} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-black/5 text-black/60">{a.replace(/_/g,' ').toUpperCase()}</span>)}
                      </div>
                    )}
                  </div>
                );
              })}
              <p className="pt-2 text-[11px] font-semibold uppercase tracking-wide text-black/60">{membersT('UPCOMING', locale)} ({upcomingRows.length})</p>
              {upcomingRows.length === 0 && <p className="text-[11px] text-black/50">{membersT('No upcoming reservations.', locale)}</p>}
              {upcomingRows.map((row) => {
                const addons = parseActivityAddons(row);
                return (
                  <div key={`upcoming-${row.id}`} className="rounded-lg border border-black/10 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-black">
                        {row.plate || membersT('Unknown plate', locale)} · {row.location_display_id || row.location_id || membersT('Unknown location', locale)}
                      </p>
                      <p className="text-[11px] text-black/60">{formatActivityDate(row.ui_check_in || row.entry_time || row.created_at)}</p>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-black/70">
                      <span>{Number(row.price ?? 0).toFixed(2)} {parseCurrency(row.currency)}</span>
                      <span>{resolveActivityLifecycleForView(row) === "pending" ? "NA ČEKANJU · NADOLAZEĆI" : "NADOLAZEĆI"}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-black/70">
                      {membersT('Vrijedi', locale)}: {formatCroatianDateTime(row.ui_check_in || row.entry_time || row.created_at)} — {formatCroatianDateTime(row.ui_check_out || row.exit_time)}
                    </div>
                    {addons.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {addons.map(a => <span key={a} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-black/5 text-black/60">{a.replace(/_/g,' ').toUpperCase()}</span>)}
                      </div>
                    )}
                  </div>
                );
              })}
              <p className="pt-2 text-[11px] font-semibold uppercase tracking-wide text-black/60">{membersT('Expired', locale)} ({expiredRows.length})</p>
              {expiredRows.length === 0 && <p className="text-[11px] text-black/50">{membersT('No expired reservations.', locale)}</p>}
              {expiredRows.map((row) => {
                const addons = parseActivityAddons(row);
                return (
                  <div key={`expired-${row.id}`} className="rounded-lg border border-black/10 px-3 py-2 opacity-70">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-black">
                        {row.plate || membersT('Unknown plate', locale)} · {row.location_display_id || row.location_id || membersT('Unknown location', locale)}
                      </p>
                      <p className="text-[11px] text-black/60">{formatActivityDate(row.ui_check_in || row.entry_time || row.created_at)}</p>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-black/70">
                      <span>{Number(row.price ?? 0).toFixed(2)} {parseCurrency(row.currency)}</span>
                      <span>{membersT('EXPIRED', locale)}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-black/70">
                      {membersT('Vrijedi', locale)}: {formatCroatianDateTime(row.ui_check_in || row.entry_time || row.created_at)} — {formatCroatianDateTime(row.ui_check_out || row.exit_time)}
                    </div>
                    {addons.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {addons.map(a => <span key={a} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-black/5 text-black/60">{a.replace(/_/g,' ').toUpperCase()}</span>)}
                      </div>
                    )}
                  </div>
                );
              })}
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
              {membersT('Payment', locale)}
            </h2>
            <p className="text-sm text-black/70">
              {membersT('Manage saved cards that can be charged for future sessions.', locale)}
            </p>
          </div>
          {/* PAYMENTS SECTION */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-black">{membersT('Payments', locale)}</h3>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-black/70">
                {membersT('Saved payment methods', locale)}
              </p>
              {paymentMethodsLoading && (
                <p className="text-sm text-black/60">{membersT('Loading payment methods...', locale)}</p>
              )}
              {paymentMethods.length === 0 && (
                <p className="text-sm text-black/60">
                  {membersT('No payment methods added yet.', locale)}
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
                          {method.isDefault ? membersT('Default card', locale) : membersT('Card on file', locale)}
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleRemovePaymentMethod(method.id)}
                          className="text-[11px] underline underline-offset-2 text-black/60 hover:text-black"
                        >
                          {membersT('Remove', locale)}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-black/70">
                {membersT('Add a payment method', locale)}
              </p>
              <div className="flex flex-col md:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleAddPaymentMethod}
                  disabled={!!actionProcessing}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-black text-white text-xs font-semibold shadow-md hover:bg-gray-900 transition-colors disabled:opacity-60"
                >
                  {membersT('Add payment method', locale)}
                </button>
              </div>
              <p className="text-[11px] text-black/60">
                {membersT('Opens secure Stripe setup and stores cards on your customer profile.', locale)}
              </p>
              {actionError && (
                <p className="text-[11px] text-red-600">{actionError}</p>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (activeItem === "vehicles") {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight text-black">
              {membersT('Vehicles', locale)}
            </h2>
            <p className="text-sm text-black/70">
              {membersT('Add license plates you use for work so Payparq can recognise your arrivals.', locale)}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-black/70">
              {membersT('Saved plates', locale)}
            </p>
            {plates.length === 0 && (
              <p className="text-sm text-black/60">
                {membersT('No plates added yet. Add your first plate below.', locale)}
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
                      {membersT('Remove', locale)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-black/70">
              {membersT('Add a license plate', locale)}
            </p>
            <div className="flex flex-col md:flex-row gap-2">
              <input
                type="text"
                value={newPlate}
                onChange={(event) => setNewPlate(event.target.value)}
                className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm text-black bg-white outline-none focus:border-black/40 uppercase"
                placeholder={locale === 'en' ? 'e.g. ZG-123-AB' : 'npr. ZG-123-AB'}
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
                {plateSaving ? membersT('Saving...', locale) : membersT('Add plate', locale)}
              </button>
            </div>
            {plateMessage && <p className="text-[11px] text-black/60">{plateMessage}</p>}
            <p className="text-[11px] text-black/60">
              {membersT('Saved plates sync to your account and are available on next sign-in.', locale)}
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
              {membersT('Promocije', locale)}
            </h2>
            <p className="text-sm text-black/70">
              {membersT('Promotions are locked until your email is verified.', locale)}
            </p>
            <div className="rounded-xl border border-black/10 bg-white p-4 space-y-3">
              <p className="text-xs text-black/70">
                {membersT('Before verifying, check Inbox and Junk/Spam folders.', locale)}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSendVerificationEmail}
                  disabled={verificationLoading}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-[black] text-white text-xs font-semibold shadow-md hover:bg-[#4330c4] transition-colors disabled:opacity-60"
                >
                  {verificationLoading ? membersT('Sending...', locale) : membersT('Verify email', locale)}
                </button>
                <button
                  type="button"
                  onClick={handleSendVerificationEmail}
                  disabled={verificationLoading}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-black/10 text-xs font-semibold hover:bg-black/5 transition-colors disabled:opacity-60"
                >
                  {membersT('Resend email', locale)}
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
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight text-black">{membersT('Promocije', locale)}</h2>
            <p className="text-sm text-black/70">{membersT('Share referral codes & earn 10% commission.', locale)}</p>
          </div>

          {referralCodesLoading ? (
            <div className="rounded-xl border border-black/10 bg-white p-4">
              <p className="text-sm text-black/50">Loading codes...</p>
            </div>
          ) : referralCodes.length === 0 ? (
            <div className="rounded-xl border border-black/10 bg-white p-4">
              <p className="text-sm text-black/80">No listings yet. Create one to get a shareable code.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referralCodes.map((rc) => (
                <div key={rc.locationId} className="rounded-xl border border-[#0F6E56]/30 bg-white overflow-hidden">
                  <div className="bg-gradient-to-r from-[#0F6E56] to-[#1a9d7f] px-4 py-3">
                    <p className="text-white font-semibold text-sm">{rc.locationName}</p>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={rc.code}
                        className="flex-1 px-3 py-2 rounded-lg bg-[#E1F5EE] border border-[#0F6E56]/30 text-center font-mono font-bold text-[#0F6E56] text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(rc.code);
                          setCopiedCode(rc.code);
                          setTimeout(() => setCopiedCode(null), 1500);
                        }}
                        className="px-3 py-2 rounded-lg bg-[#0F6E56] text-white text-xs font-semibold hover:bg-[#0a5241] transition-colors"
                      >
                        {copiedCode === rc.code ? '✓' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-xs text-[#0F6E56]/70">10% off next stay • 10% commission</p>
                  </div>
                </div>
              ))}
            </div>
          )}
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
          <div className="rounded-xl border border-[black]/20 bg-[#EFF6FF] p-4 space-y-2">
            <p className="text-sm font-semibold text-[#2563EB]">
              {formatLoyaltyLevelLabel(loyaltySummary?.level)}
            </p>
            <p className="text-xs text-[#2563EB]/80">
              Points this year: <span className="font-semibold">{loyaltySummary?.pointsYear ?? 0}</span>
            </p>
            <p className="text-xs text-[#2563EB]/80">
              Total points: <span className="font-semibold">{loyaltySummary?.pointsTotal ?? 0}</span>
            </p>
            <p className="text-xs text-[#2563EB]/80">
              Bonus bands: L2 {loyaltySummary?.bonusRangeByLevel?.level_2 ?? "1% - 15%"} · L3{" "}
              {loyaltySummary?.bonusRangeByLevel?.level_3 ?? "5% - 20%"}
            </p>
            {loyaltySummary?.nextLevel && (
              <p className="text-[11px] text-[#2563EB]/70">
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

    if (activeItem === "reviews") {
      const CATEGORY_LABELS: Record<string, string> = {
        score_security: locale === 'en' ? 'Security' : 'Sigurnost',
        score_accessibility: locale === 'en' ? 'Accessibility' : 'Pristupačnost',
        score_cleanliness: locale === 'en' ? 'Cleanliness' : 'Čistoća',
        score_staff: locale === 'en' ? 'Staff' : 'Osoblje',
        score_value: locale === 'en' ? 'Value' : 'Vrijednost',
        score_location: locale === 'en' ? 'Location' : 'Lokacija',
      };
      function scoreLabel(v: number) {
        if (locale === 'en') {
          if (v >= 9) return 'Excellent'; if (v >= 8) return 'Very Good';
          if (v >= 7) return 'Good'; if (v >= 6) return 'Satisfactory'; return 'Poor';
        }
        if (v >= 9) return 'Izvrsno'; if (v >= 8) return 'Odlično';
        if (v >= 7) return 'Dobro'; if (v >= 6) return 'Zadovoljava'; return 'Loše';
      }
      function scoreColor(v: number) {
        if (v >= 9) return '#003580'; if (v >= 7) return 'black'; return '#dc2626';
      }
      return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight text-black">{locale === 'en' ? 'My Reviews' : 'Moje recenzije'}</h2>
          <p className="text-sm text-black/70">{membersT('Reviews you gave for parking on PayParq locations', locale)}</p>
          {reviewsLoading && (
            <div className="flex items-center gap-2 text-sm text-black/50">
              <div className="w-4 h-4 border-2 border-[black] border-t-transparent rounded-full animate-spin" />
              {locale === 'en' ? 'Loading...' : 'Učitavanje...'}
            </div>
          )}
          {!reviewsLoading && reviewsRows.length === 0 && (
            <div className="rounded-xl border border-black/10 bg-white p-4 text-sm text-black/60">
              {locale === 'en' ? "You haven't given any reviews yet. After completing a parking session, you'll receive an email with a link to review." : 'Još niste dali nijednu recenziju. Nakon završetka parkinga dobit ćete e-mail s linkom za recenziju.'}
            </div>
          )}
          {!reviewsLoading && reviewsRows.map((row) => (
            <div key={row.id} className="rounded-2xl border border-black/10 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
                <div>
                  <p className="text-sm font-semibold text-black">{row.location_name ?? 'PayParq'}</p>
                  <p className="text-[11px] text-black/40">
                    {row.submitted_at ? new Date(row.submitted_at).toLocaleDateString('hr-HR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[22px] font-black leading-none" style={{ color: scoreColor(row.overall_score ?? 0) }}>{row.overall_score?.toFixed(1) ?? '—'}</p>
                  <p className="text-[11px] text-black/40">{row.overall_score ? scoreLabel(row.overall_score) : ''}</p>
                </div>
              </div>
              <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                {(['score_security','score_accessibility','score_cleanliness','score_staff','score_value','score_location'] as const).map((key) => {
                  const v = row[key] ?? 0;
                  return (
                    <div key={key} className="flex items-center justify-between rounded-lg bg-[#F9FAFB] px-2 py-1.5">
                      <span className="text-[11px] text-black/60">{CATEGORY_LABELS[key]}</span>
                      <span className="text-[13px] font-black" style={{ color: v > 0 ? scoreColor(v) : '#9ca3af' }}>{v > 0 ? v : '—'}</span>
                    </div>
                  );
                })}
              </div>
              {row.comment && (
                <div className="px-4 pb-3">
                  <p className="text-[12px] text-black/60 italic">"{row.comment}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (activeItem === "admin" && role === "super_admin") {
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-black">
              Admin Panel
            </h2>
            <p className="text-sm text-black/70">Manage platform features and communications.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setActiveItem("operations")}
              className="rounded-xl border border-black/10 bg-white p-6 text-left hover:border-black/20 hover:bg-black/5 transition-all"
            >
              <div className="text-2xl mb-2">⚙️</div>
              <h3 className="text-sm font-semibold text-black mb-1">{membersT('Operacije', locale)}</h3>
              <p className="text-xs text-black/60">Platform operations and management</p>
            </button>

            <button
              onClick={() => setActiveItem("campaigns")}
              className="rounded-xl border border-black/10 bg-white p-6 text-left hover:border-black/20 hover:bg-black/5 transition-all"
            >
              <div className="text-2xl mb-2">✉️</div>
              <h3 className="text-sm font-semibold text-black mb-1">{membersT('Kampanje', locale)}</h3>
              <p className="text-xs text-black/60">Email campaigns and communications</p>
            </button>

            <button
              onClick={() => setActiveItem("social")}
              className="rounded-xl border border-black/10 bg-white p-6 text-left hover:border-black/20 hover:bg-black/5 transition-all"
            >
              <div className="text-2xl mb-2">📱</div>
              <h3 className="text-sm font-semibold text-black mb-1">{membersT('Društvene mreže', locale)}</h3>
              <p className="text-xs text-black/60">Social media management</p>
            </button>

            <a
              href="/resources"
              className="rounded-xl border border-black/10 bg-white p-6 text-left hover:border-black/20 hover:bg-black/5 transition-all"
            >
              <div className="text-2xl mb-2">📚</div>
              <h3 className="text-sm font-semibold text-black mb-1">Resursi</h3>
              <p className="text-xs text-black/60">Platform resources</p>
            </a>
          </div>
        </div>
      );
    }

    if (activeItem === "operations") {
      return <OperationsPanel />;
    }

    if (activeItem === "management") {
      return <ManagementPanel />;
    }

    if (activeItem === "campaigns" && role === "super_admin") {
      return <CampaignsPanel />;
    }

    if (activeItem === "social" && role === "super_admin") {
      return <SocialPanel />;
    }

    if (activeItem === "arrivals" && (user || devSignedIn)) {
      return user ? <ArrivalsPanel userId={user.id} /> : <div className="text-sm text-black/70">{membersT('Arrivals panel', locale)}</div>;
    }

    if (activeItem === "payouts" && (user || devSignedIn)) {
      return <PayoutsPanel user={user} locale={locale} />;
    }

    if (activeItem === "moji-prostori" && (user || devSignedIn)) {
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-black">
              {membersT('Moji prostori', locale)}
            </h2>
            <p className="text-sm text-black/70">{membersT('Manage your parking lots', locale)}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="rounded-xl border border-black/10 bg-white p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-black/60">{membersT('Moji prostori', locale)}</p>
                  <button
                    type="button"
                    onClick={() => router.push('/host')}
                    className="w-6 h-6 rounded-full bg-[black] text-white flex items-center justify-center hover:bg-[#4330c4] transition-colors"
                    title="Dodaj novi prostor"
                  >
                    <span className="text-base leading-none font-bold">+</span>
                  </button>
                </div>
            {ownerListingsLoading ? (
              <p className="text-xs text-black/50">Učitavanje...</p>
            ) : ownerListings.length === 0 ? (
              <p className="text-xs text-black/50">Nemaš objavljenih prostora. Klikni <span className="font-semibold text-[black]">+</span> za dodavanje.</p>
            ) : (
              <div className="space-y-3">
                {ownerListings.map((loc) => (
                  <div
                    key={loc.id}
                    className="w-full rounded-lg border border-black/10 bg-white hover:bg-black/2 transition-all"
                  >
                    <button
                      onClick={() => {
                        const sections = loc.verification_metadata?.section_status;
                        const isComplete = !sections || (sections.section1 && sections.section2 && sections.section3);
                        if (!isComplete) {
                          router.push(`/list-your-parking?edit=${loc.id}`);
                        } else {
                          router.push(`/members/calendar/${loc.id}`);
                        }
                      }}
                      className="w-full text-left p-3 md:p-4 border-b border-black/5 md:border-b-0"
                    >
                      <p className="text-sm md:text-xs font-semibold text-black truncate">{loc.name || '—'}</p>
                      <p className="text-xs md:text-[10px] text-black/50 truncate mt-1">{loc.address || '—'}</p>
                    </button>

                    <div className="flex items-center justify-between px-3 py-3 md:px-4 md:py-3">
                      <div className="flex items-center gap-3">
                        <span className="hidden md:inline text-[10px] text-black/50">{loc.capacity} mj.</span>
                        <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${
                          loc.verification_status === 'verified' ? 'bg-black text-white' :
                          loc.verification_status === 'pending' ? 'bg-black/20 text-black' :
                          'bg-black/10 text-black/60'
                        }`}>
                          {loc.verification_status === 'verified' ? (locale === 'en' ? 'Active' : 'Aktivno') : loc.verification_status === 'pending' ? (locale === 'en' ? 'Pending' : 'Na čekanju') : (locale === 'en' ? 'Unverified' : 'Neverificirano')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/members/calendar/${loc.id}`);
                          }}
                          className="w-9 h-9 md:w-8 md:h-8 flex items-center justify-center rounded-lg bg-white border border-black/20 hover:bg-black hover:text-white text-black transition-all"
                          title="Upravljaj kalendarom i cijenama"
                        >
                          <svg className="w-5 h-5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6 2a1 1 0 00-1 1v2H4a2 2 0 00-2 2v2h16V7a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v2H7V3a1 1 0 00-1-1zm0 5H4v9a2 2 0 002 2h12a2 2 0 002-2V7h-2v1a1 1 0 11-2 0V7H9v1a1 1 0 11-2 0V7H6v1a1 1 0 11-2 0V7z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/members/edit-listing/${loc.id}`);
                          }}
                          className="w-9 h-9 md:w-8 md:h-8 flex items-center justify-center rounded-lg bg-white border border-black/20 hover:bg-black hover:text-white text-black transition-all"
                          title="Uredi lot"
                        >
                          <svg className="w-5 h-5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {loc.verification_status === 'verified' && (
                      <div className="px-3 md:px-4 py-2 border-t border-black/5 flex items-center justify-between bg-black/2">
                        <Link
                          href={`/search?hubId=${loc.id}`}
                          className="text-xs font-semibold text-black hover:text-black/70 transition-colors"
                        >
                          {membersT('Brza rezervacija', locale)}
                        </Link>
                        <button
                          type="button"
                          title={membersT('Kopiraj link', locale)}
                          onClick={(e) => {
                            e.stopPropagation();
                            const url = `${window.location.origin}/search?hubId=${loc.id}&source=member`;
                            navigator.clipboard.writeText(url).then(() => {
                              setCopiedLotId(loc.id);
                              setTimeout(() => setCopiedLotId(null), 1500);
                            });
                          }}
                          className="text-black/40 hover:text-black/70 transition-colors"
                        >
                          {copiedLotId === loc.id ? (
                            <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
              </div>
            </div>

            <div className="md:col-span-1">
              <div className="sticky top-6 space-y-4">
                <div className="rounded-xl border border-black/10 bg-white p-4">
                  <p className="text-xs text-black/70 leading-snug mb-2">U vašem području, prostori mogu zaraditi i do</p>
                  <p className="text-2xl font-bold text-[black]">
                    €6,912.00
                    <span className="text-sm font-normal text-black/60 block">godišnje</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {actionError && (
            <p className="text-[11px] text-red-600">{actionError}</p>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-black">
          {locale === 'en' ? 'Resources' : 'Resursi'}
        </h2>

        <div className="space-y-2 bg-white border border-black/10 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-black">{locale === 'en' ? 'For Hosts' : 'Za domaćine'}</h3>
          <Link
            href="/list-your-parking"
            className="block px-3 py-2 rounded-lg text-sm text-black/70 hover:bg-black/5 transition-colors"
          >
            + {locale === 'en' ? 'List your parking space' : 'Navedite svoje parkiralište'}
          </Link>
        </div>

        <div className="space-y-2 bg-white border border-black/10 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-black">Support</h3>
          <p className="text-sm text-black/80">
            Email: <a className="underline" href="mailto:payparq@outlook.com">payparq@outlook.com</a>
          </p>
          <p className="text-sm text-black/80">
            WhatsApp: <a className="underline" href="https://wa.me/385915963139">+385915963139</a>
          </p>
        </div>
      </div>
    );
  }

  if (!pageReady && isSignedIn) {
    return (
      <div className="min-h-screen bg-[#05020A] flex items-center justify-center">
        <div className="relative flex items-center justify-center w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-white/10 border-t-white animate-spin" style={{ animationDuration: '1s' }} />
          <div className="animate-pulse w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg z-10">
            <span className="text-lg font-black tracking-tight text-[#05020A] select-none">P</span>
          </div>
        </div>
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
          {googleAuthLoading && (
            <div className="fixed inset-0 bg-[#05020A] z-50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="relative flex items-center justify-center w-20 h-20">
                  <div className="absolute inset-0 rounded-full border-4 border-white/10 border-t-white animate-spin" style={{ animationDuration: '1s' }} />
                  <div className="animate-pulse w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg z-10">
                    <span className="text-lg font-black tracking-tight text-[#05020A] select-none">P</span>
                  </div>
                </div>
                <p className="text-white/60 text-sm">Redirecting to Google...</p>
              </div>
            </div>
          )}

          {!isSignedIn && !googleAuthLoading && (
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
                {authError && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <p className="font-semibold mb-1">Sign-in failed</p>
                    <p className="text-xs">{authError}</p>
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
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex-1 h-px bg-black/10"></div>
                  <span className="text-[11px] text-black/50 font-medium">or</span>
                  <div className="flex-1 h-px bg-black/10"></div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setAuthError('');
                      setGoogleAuthLoading(true);
                      const redirect = searchParams.get('redirect') || '';
                      const origin = typeof window !== 'undefined' ? window.location.origin : '';
                      if (redirect) {
                        sessionStorage.setItem('authRedirect', redirect);
                      }
                      const callbackUrl = `${origin}/auth/callback`;
                      console.log('Starting Google OAuth with callback:', callbackUrl);
                      await supabase?.auth.signInWithOAuth({
                        provider: 'google',
                        options: {
                          redirectTo: callbackUrl,
                          skipBrowserRedirect: false
                        }
                      });
                    } catch (err) {
                      const errorMsg = err instanceof Error ? err.message : 'Failed to sign in with Google';
                      console.error('Google OAuth error:', errorMsg, err);
                      setAuthError(errorMsg);
                      setGoogleAuthLoading(false);
                    }
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-white border border-black/10 text-black text-xs font-semibold shadow-md hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
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
              <div className="bg-[black] px-3 md:px-6 py-3 flex items-center justify-between gap-2 md:gap-4">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="md:hidden inline-flex items-center justify-center w-5 h-5 text-white hover:bg-white/20 rounded transition-colors flex-shrink-0"
                  title="Toggle sidebar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div className="hidden md:block">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/70">
                    Members
                  </p>
                  <p className="text-xs md:text-sm font-semibold">
                    Platform workspace
                  </p>
                </div>
                <div className="text-[11px] text-white/80 text-right flex items-center gap-0 md:gap-3 flex-shrink-0">
                  <NotificationCenter userId={user?.id ?? null} />
                  <div className="hidden md:flex flex-col items-end gap-1">
                    <p>{membersT('Signed in as', locale)}</p>
                    <p className="font-semibold truncate max-w-[180px]">
                      {displayEmail}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="md:hidden inline-flex items-center justify-center w-5 h-5 text-white hover:bg-white/20 rounded transition-colors flex-shrink-0"
                    title="Log out"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="md:hidden h-1 bg-[#05020A] border-t border-white/10" />

              {sidebarOpen && <div className="md:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setSidebarOpen(false)} />}
              <div className="min-h-0 flex-1 flex bg-[#05020A] overflow-hidden">
                <aside className={`${sidebarOpen ? 'fixed md:static' : 'hidden md:flex'} md:flex w-72 border-r border-white/10 bg-[#05020A] flex-col z-40 md:z-0 h-screen md:h-auto left-0 top-0 md:pt-0 overflow-hidden`}>
                  <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0 border-b border-white/10">
                    <div className="w-7 h-7 rounded-full bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.45)] flex items-center justify-center">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#020617] to-[#020617] flex items-center justify-center border border-white/40">
                        <span className="text-[10px] font-semibold tracking-tight leading-none text-white">P</span>
                      </div>
                    </div>
                    <div className="text-sm font-black tracking-tight text-white select-none">payparq</div>
                  </div>
                  <nav className="px-2 py-0 space-y-0 text-[12px] flex-1 overflow-hidden flex flex-col">
                    {/* HOME */}
                    <button
                      type="button"
                      onClick={() => setActiveItem("home")}
                      className={`flex w-full items-center gap-2 px-3 py-1 rounded-xl text-left transition-colors ${
                        activeItem === "home"
                          ? "bg-white text-black"
                          : "text-white/70 hover:bg-white/5"
                      }`}
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[black]/90 text-[11px]">
                        H
                      </span>
                      <span>{membersT('Home', locale)}</span>
                    </button>

                    {/* HOST SECTION */}
                    <div className="space-y-0.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40 px-3 pt-0">Host / Domaćin</p>
                        <button
                          type="button"
                          onClick={() => setActiveItem("moji-prostori")}
                          className={`flex w-full items-center gap-2 px-3 py-1 rounded-xl text-left transition-colors ${
                            activeItem === "moji-prostori"
                              ? "bg-white text-black"
                              : "text-white/70 hover:bg-white/5"
                          }`}
                        >
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[11px]">
                            M
                          </span>
                          <span>{membersT('Moji prostori', locale)}</span>
                        </button>
                        <Link
                          href="/host"
                          className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors text-white/70 hover:bg-white/5"
                        >
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[11px]">
                            +
                          </span>
                          <span>{membersT('Instant listing', locale)}</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => setActiveItem("arrivals")}
                          className={`flex w-full items-center gap-2 px-3 py-1 rounded-xl text-left transition-colors ${
                            activeItem === "arrivals"
                              ? "bg-white text-black"
                              : "text-white/70 hover:bg-white/5"
                          }`}
                        >
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[11px]">
                            A
                          </span>
                          <span>{membersT('Arrivals', locale)}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveItem("payouts")}
                          className={`flex w-full items-center gap-2 px-3 py-1 rounded-xl text-left transition-colors ${
                            activeItem === "payouts"
                              ? "bg-white text-black"
                              : "text-white/70 hover:bg-white/5"
                          }`}
                        >
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[11px]">
                            $
                          </span>
                          <span>Payouts</span>
                        </button>
                        {role === 'super_admin' && (
                          <button
                            type="button"
                            onClick={() => setActiveItem("admin")}
                            className={`flex w-full items-center gap-2 px-3 py-1 rounded-xl text-left transition-colors ${
                              activeItem === "admin"
                                ? "bg-white text-black"
                                : "text-white/70 hover:bg-white/5"
                            }`}
                          >
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[11px]">
                              ⚙
                            </span>
                            <span>Admin</span>
                          </button>
                        )}
                      </div>

                    {/* KORISNIK SECTION */}
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40 px-3 pt-2">{membersT('Korisnik', locale)}</p>
                      <button
                        type="button"
                        onClick={() => setActiveItem("permits")}
                        className={`flex w-full items-center gap-2 px-3 py-1 rounded-xl text-left transition-colors ${
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
                        className={`flex w-full items-center gap-2 px-3 py-1 rounded-xl text-left transition-colors ${
                          activeItem === "activity"
                            ? "bg-white text-black"
                            : "text-white/70 hover:bg-white/5"
                        }`}
                      >
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[11px]">
                          A
                        </span>
                        <span>{membersT('Aktivnost', locale)}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveItem("payment")}
                        className={`flex w-full items-center gap-2 px-3 py-1 rounded-xl text-left transition-colors ${
                          activeItem === "payment"
                            ? "bg-white text-black"
                            : "text-white/70 hover:bg-white/5"
                        }`}
                      >
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[11px]">
                          $
                        </span>
                        <span>{membersT('Plaćanje', locale)}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveItem("vehicles")}
                        className={`flex w-full items-center gap-2 px-3 py-1 rounded-xl text-left transition-colors ${
                          activeItem === "vehicles"
                            ? "bg-white text-black"
                            : "text-white/70 hover:bg-white/5"
                        }`}
                      >
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[11px]">
                          V
                        </span>
                        <span>{membersT('Vozila', locale)}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveItem("promotions")}
                        className={`flex w-full items-center gap-2 px-3 py-1 rounded-xl text-left transition-colors ${
                          activeItem === "promotions"
                            ? "bg-white text-black"
                            : "text-white/70 hover:bg-white/5"
                        }`}
                      >
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[11px]">
                          %
                        </span>
                        <span>{membersT('Promocije', locale)}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveItem("reviews")}
                        className={`flex w-full items-center gap-2 px-3 py-1 rounded-xl text-left transition-colors ${
                          activeItem === "reviews"
                            ? "bg-white text-black"
                            : "text-white/70 hover:bg-white/5"
                        }`}
                      >
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[11px]">
                          ★
                        </span>
                        <span>{membersT('Recenzije', locale)}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveItem("help")}
                        className={`flex w-full items-center gap-2 px-3 py-1 rounded-xl text-left transition-colors ${
                          activeItem === "help"
                            ? "bg-white text-black"
                            : "text-white/70 hover:bg-white/5"
                        }`}
                      >
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[11px]">
                          ?
                        </span>
                        <span>{membersT('Pomoć', locale)}</span>
                      </button>
                    </div>
                    <div className="flex-1" />
                    <div className="border-t border-white/10 px-4 py-0 space-y-0.5 flex-shrink-0">
                      <div className="space-y-1 text-[11px] text-white/70">
                        <p className="font-semibold">
                          Account overview
                        </p>
                        <p className="truncate">
                          {displayEmail}
                        </p>
                        {role && (
                          <p className="text-white/50 uppercase tracking-wide text-[10px] font-semibold">
                            {role.replace(/_/g, " ")}
                          </p>
                        )}
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
                      <a
                        href="/app"
                        className="w-full inline-flex items-center justify-center px-3 py-2 rounded-xl text-[11px] font-semibold shadow-sm transition-colors bg-white/5 text-white hover:bg-white/10"
                      >
                        Povratak
                      </a>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full inline-flex items-center justify-center px-3 py-2 rounded-xl border border-white/20 text-[11px] font-semibold text-white/80 hover:bg-white/5 transition-colors"
                      >
                        Log out
                      </button>
                    </div>
                  </nav>
                </aside>

                <div className="min-h-0 flex-1 bg-[#F5F5F7] text-black overflow-x-hidden overflow-y-auto flex items-start justify-center">
                  <div className="min-h-0 h-full w-full max-w-6xl p-6 md:p-8 flex flex-col gap-4 overflow-hidden">
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
                        ? membersT('Rewards', locale)
                        : activeItem === "reviews"
                        ? membersT('Recenzije', locale)
                        : activeItem === "list-lot"
                        ? "List your parking"
                        : membersT('Help', locale)}
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

import fs from "fs";

const env = {};
const envContent = fs.readFileSync(".env.local", "utf-8");
envContent.split("\n").forEach((line) => {
  const [key, ...rest] = line.split("=");
  if (key && !key.startsWith("#")) {
    env[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
  }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const headers = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

async function diagnose() {
  const locationId = "40058";
  console.log(`\n${"=".repeat(70)}`);
  console.log(`DIAGNOSING LOCATION: ${locationId}`);
  console.log(`${"=".repeat(70)}\n`);

  try {
    // Get location
    const locRes = await fetch(
      `${SUPABASE_URL}/rest/v1/locations?id=eq.${locationId}&select=id,name,owner_id,verification_metadata`,
      { headers }
    );
    const locations = await locRes.json();

    if (!locations || locations.length === 0) {
      console.log("❌ Location 40058 not found");
      process.exit(1);
    }

    const location = locations[0];
    console.log(`📍 LOCATION`);
    console.log(`   Name: ${location.name || "(no name)"}`);
    console.log(`   ID: ${location.id}`);
    console.log(`   Owner ID: ${location.owner_id || "❌ NONE"}\n`);

    const meta = location.verification_metadata || {};
    console.log(`🔧 PAYOUT CONFIG`);
    console.log(`   hub_enabled: ${meta.hub_enabled === true ? "✓ TRUE" : "✗ FALSE"}\n`);

    if (!location.owner_id) {
      console.log(`❌ CRITICAL: Location has no owner_id - no one owns this location!\n`);
      process.exit(1);
    }

    // Get owner
    const ownerRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${location.owner_id}&select=id,email,stripe_account_id,stripe_onboarding_complete`,
      { headers }
    );
    const profiles = await ownerRes.json();

    if (!profiles || profiles.length === 0) {
      console.log(`❌ Owner profile ${location.owner_id} not found\n`);
      process.exit(1);
    }

    const owner = profiles[0];
    console.log(`👤 OWNER`);
    console.log(`   Email: ${owner.email}`);
    console.log(`   ID: ${owner.id}\n`);

    console.log(`💳 STRIPE CONNECT STATUS`);
    const hasAccount = !!owner.stripe_account_id;
    const isOnboarded = owner.stripe_onboarding_complete === true;
    
    console.log(`   Account Connected: ${hasAccount ? "✓ YES" : "❌ NO"}`);
    if (hasAccount) {
      console.log(`   Account ID: ${owner.stripe_account_id.slice(0, 30)}...`);
    }
    console.log(`   Onboarding Complete: ${isOnboarded ? "✓ YES" : "❌ NO"}\n`);

    console.log(`${"=".repeat(70)}`);
    console.log(`🔍 VERDICT`);
    console.log(`${"=".repeat(70)}\n`);

    if (!hasAccount && !isOnboarded) {
      console.log(`❌ Stripe Connect NOT set up`);
      console.log(`   Owner: ${owner.email}`);
      console.log(`   Status: Never connected\n`);
      console.log(`FIX: Owner needs to:`);
      console.log(`   1. Go to http://localhost:3000/members`);
      console.log(`   2. Go to "Payouts" section`);
      console.log(`   3. Click "Connect Stripe Account"`);
      console.log(`   4. Complete Stripe onboarding\n`);
    } else if (hasAccount && !isOnboarded) {
      console.log(`⚠️ Stripe Connect PENDING`);
      console.log(`   Account ID: ${owner.stripe_account_id}`);
      console.log(`   Status: Connected but not fully verified\n`);
      console.log(`FIX: Owner needs to complete Stripe onboarding`);
      console.log(`   Check Stripe dashboard for pending items\n`);
    } else if (hasAccount && isOnboarded) {
      console.log(`✓ Stripe Connect READY`);
      console.log(`   Account ID: ${owner.stripe_account_id}`);
      console.log(`   Status: Fully onboarded\n`);
      if (meta.hub_enabled) {
        console.log(`✓ hub_enabled = true`);
        console.log(`   Split logic SHOULD run for this location\n`);
        console.log(`⚠️ If payment still didn't split, check:`);
        console.log(`   1. Stripe dashboard logs for transfer errors`);
        console.log(`   2. If split plan was actually built`);
        console.log(`   3. Recent code changes\n`);
      } else {
        console.log(`✓ hub_enabled = false`);
        console.log(`   This location is in REGULAR MODE (0% split)`);
        console.log(`   Owner gets 100% of distributable amount (after 7.9% + €0.30)\n`);
      }
    }

  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }

  process.exit(0);
}

diagnose();

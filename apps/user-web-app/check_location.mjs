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

// Create Supabase client
const headers = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

async function checkLocation(locationId) {
  console.log(`\nChecking location: ${locationId}\n`);

  // Get location + owner
  const locRes = await fetch(
    `${SUPABASE_URL}/rest/v1/locations?id=eq.${locationId}&select=id,name,owner_id,verification_metadata`,
    { headers }
  );
  const locations = await locRes.json();

  if (!locations || locations.length === 0) {
    console.log("❌ Location not found");
    return;
  }

  const location = locations[0];
  console.log(`📍 Location: ${location.name || location.id}`);
  console.log(`   Owner ID: ${location.owner_id}`);

  const meta = location.verification_metadata || {};
  console.log(`\n🔧 CONFIG:`);
  console.log(`   hub_enabled: ${meta.hub_enabled === true ? "✓ YES" : "✗ NO"}`);

  if (!location.owner_id) {
    console.log("\n❌ PROBLEM: Location has no owner_id");
    return;
  }

  // Get owner profile
  const ownerRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${location.owner_id}&select=id,role,stripe_account_id,stripe_onboarding_complete`,
    { headers }
  );
  const profiles = await ownerRes.json();

  if (!profiles || profiles.length === 0) {
    console.log("\n❌ PROBLEM: Owner profile not found");
    return;
  }

  const owner = profiles[0];
  console.log(`\n👤 OWNER STRIPE SETUP:`);
  console.log(`   Role: ${owner.role}`);
  console.log(`   Stripe Account ID: ${owner.stripe_account_id ? owner.stripe_account_id.slice(0, 20) + "..." : "❌ NONE"}`);
  console.log(`   Onboarding Complete: ${owner.stripe_onboarding_complete ? "✓ YES" : "❌ NO"}`);

  console.log(`\n⚠️ DIAGNOSIS:`);
  if (!owner.stripe_account_id) {
    console.log("   ❌ Owner has NO Stripe account connected");
    console.log("   → Split logic won't run (no destination to transfer to)");
    console.log("   → Owner needs to connect Stripe in members page");
  } else if (!owner.stripe_onboarding_complete) {
    console.log("   ❌ Stripe onboarding is NOT complete");
    console.log("   → Split logic won't run (account not verified)");
    console.log("   → Check Stripe dashboard for pending items");
  } else {
    console.log("   ✓ Stripe setup looks OK");
    console.log("   → Problem might be elsewhere (check Stripe logs)");
  }
}

// Need location ID - prompt user
console.log("To diagnose the issue, provide the location ID you tested with.");
console.log("(Check your checkout session in Stripe Dashboard)\n");

// For now, show what we're checking
console.log("Will check:");
console.log("1. Location has owner_id");
console.log("2. Owner has stripe_account_id");
console.log("3. stripe_onboarding_complete = true");
console.log("4. Location has hub_enabled = true (if you want splits)");

process.exit(0);

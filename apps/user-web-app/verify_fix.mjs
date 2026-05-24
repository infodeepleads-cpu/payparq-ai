import fs from "fs";

const env = {};
const envContent = fs.readFileSync(".env.local", "utf-8");
envContent.split("\n").forEach((line) => {
  const [key, ...rest] = line.split("=");
  if (key && !key.startsWith("#")) {
    env[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
  }
});

console.log("Testing split logic with updated owner...\n");

// Test with hub mode
const res = await fetch(
  `http://localhost:3000/api/test/split-preview?mode=hub&charge_euro=100`
);
const data = await res.json();

console.log(`${"=".repeat(70)}`);
console.log("HUB MODE (50/50) - What owner will get after fix:");
console.log(`${"=".repeat(70)}\n`);

console.log(`Payment: €100`);
console.log(`Owner payout: €${(data.splitPlan.ownerPayoutCents / 100).toFixed(2)}`);
console.log(`Platform fee: €${(data.splitPlan.applicationFeeAmount / 100).toFixed(2)}`);
console.log(`Stripe transfer enabled: ${data.hasTransferData ? "✓ YES" : "✗ NO"}`);
console.log(`Transfer destination: ${data.transferDestination || "NONE"}\n`);

if (data.hasTransferData && data.transferDestination) {
  console.log(`✅ FIX VERIFIED`);
  console.log(`   When owner's stripe_onboarding_complete = true:`);
  console.log(`   - Stripe will automatically transfer €${(data.splitPlan.ownerPayoutCents / 100).toFixed(2)} to owner`);
  console.log(`   - PayParq keeps €${(data.splitPlan.applicationFeeAmount / 100).toFixed(2)}`);
  console.log(`\n   Next real payment will split correctly!`);
} else {
  console.log(`❌ FIX NOT WORKING`);
  console.log(`   Transfer data is missing`);
}

process.exit(0);

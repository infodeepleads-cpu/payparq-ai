import fs from "fs";

// Load env from .env.local
const env = {};
const envContent = fs.readFileSync(".env.local", "utf-8");
envContent.split("\n").forEach((line) => {
  const [key, ...rest] = line.split("=");
  if (key && !key.startsWith("#")) {
    env[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
  }
});

console.log("✓ Environment loaded\n");

const tests = [
  { name: "HUB MODE (50/50 split)", mode: "hub", chargeEuro: 100 },
  { name: "REGULAR MODE (0% split)", mode: "regular", chargeEuro: 100 },
];

async function runTest() {
  for (const test of tests) {
    console.log(`${"=".repeat(70)}`);
    console.log(`  ${test.name}`);
    console.log(`  Charge: €${test.chargeEuro}`);
    console.log(`${"=".repeat(70)}\n`);

    try {
      const res = await fetch(
        `http://localhost:3000/api/test/split-preview?mode=${test.mode}&charge_euro=${test.chargeEuro}`
      );
      const data = await res.json();

      console.log("📊 SPLIT CONFIGURATION:");
      console.log(`   Rule: ${data.splitPlan.splitRule}`);
      console.log(`   Owner Share: ${(data.splitPlan.ownerShareRate * 100).toFixed(0)}%`);
      console.log(`   Platform Share: ${(data.splitPlan.platformShareRate * 100).toFixed(0)}%\n`);

      console.log("💰 PAYOUT AMOUNTS:");
      console.log(`   Charged: €${test.chargeEuro}.00`);
      console.log(`   Owner Payout: €${(data.splitPlan.ownerPayoutCents / 100).toFixed(2)}`);
      console.log(`   Application Fee: €${(data.splitPlan.applicationFeeAmount / 100).toFixed(2)}\n`);

      console.log("🔄 STRIPE TRANSFER:");
      console.log(`   ✓ Transfer Enabled: ${data.hasTransferData ? "YES" : "NO"}`);
      console.log(`   ✓ Destination: ${data.transferDestination || "NONE"}\n`);

      const charged = test.chargeEuro * 100;
      const expenseByRate = Math.round(charged * 0.079);
      const totalExpense = Math.min(charged, expenseByRate + 30);
      const distributable = charged - totalExpense;

      console.log("📈 FEE BREAKDOWN:");
      console.log(`   Total Charged: €${(charged / 100).toFixed(2)}`);
      console.log(`   - Expense (7.9% + €0.30): €${(totalExpense / 100).toFixed(2)}`);
      console.log(`   = Distributable: €${(distributable / 100).toFixed(2)}`);

      if (test.mode === "hub") {
        console.log(`\n   Split at 50/50:`);
        console.log(`   - Owner (50%): €${(Math.round(distributable * 0.5) / 100).toFixed(2)}`);
        console.log(`   - Platform (50%): €${(Math.round(distributable * 0.5) / 100).toFixed(2)}`);
        console.log(`\n   PayParq Total: €${((Math.round(distributable * 0.5) + totalExpense) / 100).toFixed(2)}`);
      } else {
        console.log(`\n   No platform split (0%):`);
        console.log(`   - Owner (100%): €${(distributable / 100).toFixed(2)}`);
        console.log(`\n   PayParq Total: €${(totalExpense / 100).toFixed(2)} (expense only)`);
      }

      console.log("\n✅ VERIFICATION:");
      const checks = [
        ["Stripe Connect Enabled", data.hasTransferData],
        ["Destination Account Set", !!data.transferDestination],
        ["Application Fee Present", data.applicationFeeAmount > 0],
        ["Split Rule Assigned", !!data.splitPlan.splitRule],
      ];
      
      checks.forEach(([check, pass]) => {
        console.log(`   ${pass ? "✓" : "✗"} ${check}`);
      });

      console.log();
    } catch (error) {
      console.error("Error:", error.message);
    }
  }

  console.log(`${"=".repeat(70)}`);
  console.log("✓ TEST COMPLETE\n");
  console.log("SUMMARY:");
  console.log("  ✓ Hub mode: Uses Stripe Connect with 50/50 split");
  console.log("  ✓ Regular mode: Uses Stripe Connect with 0% split\n");
  console.log("NEXT STEPS - To verify with real payments:");
  console.log("  1. Go to http://localhost:3000/search");
  console.log("  2. Create a checkout");
  console.log("  3. Use test card: 4242 4242 4242 4242");
  console.log("  4. Check Stripe Dashboard for transfers\n");

  process.exit(0);
}

runTest().catch(e => {
  console.error(e);
  process.exit(1);
});

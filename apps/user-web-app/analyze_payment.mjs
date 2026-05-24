import fs from "fs";

console.log("📊 ANALYZING PAYOUT SCENARIOS\n");

const scenarios = [
  {
    name: "HUB MODE (50/50 split) - €100 charge",
    mode: "hub",
    charged: 100,
    expenseRate: 0.079,
    expenseFixed: 0.30,
    ownerSplit: 0.5,
  },
  {
    name: "REGULAR MODE (0% split) - €100 charge",
    mode: "regular",
    charged: 100,
    expenseRate: 0.079,
    expenseFixed: 0.30,
    ownerSplit: 1.0,
  },
];

for (const scenario of scenarios) {
  console.log(`${"=".repeat(70)}`);
  console.log(`${scenario.name}`);
  console.log(`${"=".repeat(70)}\n`);

  const stripeFee = 0.029; // 2.9% Stripe processing
  const stripeFixed = 0.30; // €0.30 Stripe fixed

  // Calculate fees
  const chargedCents = scenario.charged * 100;
  const stripeFeeCents = Math.round(chargedCents * stripeFee) + Math.round(stripeFixed * 100);
  const afterStripeFee = chargedCents - stripeFeeCents;

  // PayParq expense deduction
  const expenseByRate = Math.round(chargedCents * scenario.expenseRate);
  const totalExpense = Math.min(chargedCents, expenseByRate + Math.round(scenario.expenseFixed * 100));
  const distributable = chargedCents - totalExpense;

  // Apply split
  const ownerPayoutCents = Math.round(distributable * scenario.ownerSplit);
  const platformPayoutCents = distributable - ownerPayoutCents;

  console.log("MONEY FLOW:");
  console.log(`  1. Customer charged: €${scenario.charged}.00`);
  console.log(`  2. Stripe takes fee: -€${(stripeFeeCents / 100).toFixed(2)}`);
  console.log(`     After Stripe fee: €${(afterStripeFee / 100).toFixed(2)}`);
  console.log(`  3. PayParq takes expense: -€${(totalExpense / 100).toFixed(2)}`);
  console.log(`  4. Distributable amount: €${(distributable / 100).toFixed(2)}`);
  
  if (scenario.mode === "hub") {
    console.log(`  5. Split 50/50:`);
    console.log(`     ✓ Owner gets: €${(ownerPayoutCents / 100).toFixed(2)}`);
    console.log(`     ✓ PayParq gets: €${(platformPayoutCents / 100).toFixed(2)}`);
  } else {
    console.log(`  5. No platform split (0%):`);
    console.log(`     ✓ Owner gets: €${(ownerPayoutCents / 100).toFixed(2)}`);
    console.log(`     ✓ PayParq gets: €0.00 (split)`);
  }

  console.log(`\n📤 WHAT OWNER SEES IN BANK:`);
  console.log(`  €${(ownerPayoutCents / 100).toFixed(2)} (after Stripe fee & PayParq deduction)`);
  
  console.log(`\n💰 TOTAL TO PAYPARQ:`);
  console.log(`  Expense deduction: €${(totalExpense / 100).toFixed(2)}`);
  console.log(`  Platform split: €${(platformPayoutCents / 100).toFixed(2)}`);
  console.log(`  Service fee: €${(scenario.charged * 0.05 + 0.99).toFixed(2)} (on top, separate)`);
  console.log(`  Total: €${(totalExpense / 100 + platformPayoutCents / 100 + scenario.charged * 0.05 + 0.99).toFixed(2)}`);

  console.log();
}

console.log(`${"=".repeat(70)}`);
console.log("WHAT YOU'RE SEEING:\n");
console.log("If you got 'all the money minus Stripe fee', that means:\n");
console.log("1. ✓ REGULAR MODE: Location has hub_enabled = false");
console.log("   → You get 100% of distributable (7.9% + €0.30 deducted)");
console.log("   → PayParq only gets expense deduction\n");
console.log("2. ✗ HUB MODE: You should have gotten ~50%");
console.log("   → Check if the location is actually hub_enabled = true");
console.log("   → Or check if the split plan was even built\n");

process.exit(0);

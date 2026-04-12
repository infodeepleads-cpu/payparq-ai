import assert from "node:assert/strict";
import test from "node:test";
import {
  buildStripeSplitMetadata,
  buildStripeSplitPaymentIntentData,
  buildStripeSplitPlan,
  resolveAutomaticSplitDestination,
} from "./stripeSplit.ts";

test("buildStripeSplitPlan handles table-driven payout rules", () => {
  const cases = [
    {
      name: "manager standard split stays 50/50",
      params: {
        chargedAmountCents: 2000,
        sessionAmountCents: 2000,
        parkTaxiDailyTicketTotalCents: 0,
        pricingType: "daily" as const,
        flowType: "payment",
        destinationAccountId: "acct_manager",
        expenseRate: 0,
        taxRate: 0,
        fixedExpenseCents: 0,
        caseOwnerFixedPayoutCents: 0,
      },
      expected: {
        ownerPayoutCents: 1000,
        applicationFeeAmount: 1000,
        splitRule: "standard_50_50",
      },
    },
    {
      name: "manager monthly split stays 90/10",
      params: {
        chargedAmountCents: 15000,
        sessionAmountCents: 15000,
        parkTaxiDailyTicketTotalCents: 0,
        pricingType: "monthly" as const,
        flowType: "payment",
        destinationAccountId: "acct_manager",
        expenseRate: 0,
        taxRate: 0,
        fixedExpenseCents: 0,
        caseOwnerFixedPayoutCents: 0,
      },
      expected: {
        ownerPayoutCents: 13500,
        applicationFeeAmount: 1500,
        splitRule: "monthly_90_10",
      },
    },
    {
      name:
        "park taxi charges platform amount but caps manager payout to 50 percent of daily price",
      params: {
        chargedAmountCents: 2000,
        sessionAmountCents: 2000,
        parkTaxiDailyTicketTotalCents: 700,
        pricingType: "daily" as const,
        flowType: "park_now",
        destinationAccountId: "acct_manager",
        expenseRate: 0,
        taxRate: 0,
        fixedExpenseCents: 0,
        caseOwnerFixedPayoutCents: 0,
      },
      expected: {
        ownerPayoutCents: 350,
        applicationFeeAmount: 1650,
        splitRule: "park_taxi_50pct_base",
      },
    },
    {
      name: "park taxi subtracts fees from manager payout base",
      params: {
        chargedAmountCents: 2000,
        sessionAmountCents: 2000,
        parkTaxiDailyTicketTotalCents: 700,
        pricingType: "daily" as const,
        flowType: "park_now",
        destinationAccountId: "acct_manager",
        expenseRate: 0.079,
        taxRate: 0,
        fixedExpenseCents: 30,
        caseOwnerFixedPayoutCents: 0,
      },
      expected: {
        ownerPayoutCents: 292,
        applicationFeeAmount: 1708,
        splitRule: "park_taxi_50pct_base",
      },
    },
    {
      name: "case payouts stay fixed for manager recipients",
      params: {
        chargedAmountCents: 2400,
        sessionAmountCents: 2400,
        parkTaxiDailyTicketTotalCents: 0,
        pricingType: "daily" as const,
        flowType: "cases",
        destinationAccountId: "acct_manager",
        expenseRate: 0,
        taxRate: 0,
        fixedExpenseCents: 0,
        caseOwnerFixedPayoutCents: 400,
      },
      expected: {
        ownerPayoutCents: 400,
        applicationFeeAmount: 2000,
        splitRule: "case_fixed_owner_fee",
      },
    },
    {
      name: "regular lots use 10 percent split on standard payments",
      params: {
        chargedAmountCents: 2000,
        sessionAmountCents: 2000,
        parkTaxiDailyTicketTotalCents: 0,
        sessionQuantity: 1,
        pricingType: "hourly" as const,
        flowType: "payment",
        destinationAccountId: "acct_manager",
        expenseRate: 0.079,
        taxRate: 0,
        fixedExpenseCents: 30,
        caseOwnerFixedPayoutCents: 0,
        payoutMode: "regular" as const,
      },
      expected: {
        ownerPayoutCents: 1800,
        applicationFeeAmount: 200,
        splitRule: "regular_10pct",
      },
    },
    {
      name:
        "regular daily lots apply minimum 99 cents per booked day when 10 percent is lower",
      params: {
        chargedAmountCents: 3500,
        sessionAmountCents: 3500,
        parkTaxiDailyTicketTotalCents: 0,
        sessionQuantity: 5,
        pricingType: "daily" as const,
        flowType: "payment",
        destinationAccountId: "acct_manager",
        expenseRate: 0,
        taxRate: 0,
        fixedExpenseCents: 0,
        caseOwnerFixedPayoutCents: 0,
        payoutMode: "regular" as const,
      },
      expected: {
        ownerPayoutCents: 3005,
        applicationFeeAmount: 495,
        splitRule: "regular_daily_min_099",
      },
    },
  ];

  for (const entry of cases) {
    const result = buildStripeSplitPlan(entry.params);
    assert.equal(
      result.ownerPayoutCents,
      entry.expected.ownerPayoutCents,
      entry.name,
    );
    assert.equal(
      result.applicationFeeAmount,
      entry.expected.applicationFeeAmount,
      entry.name,
    );
    assert.equal(result.splitRule, entry.expected.splitRule, entry.name);
  }
});

test("automatic split destination only enables manager profiles", () => {
  const manager = resolveAutomaticSplitDestination({
    profileRole: "manager",
    stripeAccountId: "acct_manager",
    stripeOnboardingComplete: true,
  });
  const admin = resolveAutomaticSplitDestination({
    profileRole: "admin",
    stripeAccountId: "acct_admin",
    stripeOnboardingComplete: true,
  });
  const officer = resolveAutomaticSplitDestination({
    profileRole: "officer",
    stripeAccountId: "acct_officer",
    stripeOnboardingComplete: true,
  });

  assert.equal(manager.splitEligible, true);
  assert.equal(manager.destinationAccountId, "acct_manager");
  assert.equal(admin.splitEligible, false);
  assert.equal(admin.destinationAccountId, null);
  assert.equal(officer.splitEligible, false);
  assert.equal(officer.destinationAccountId, null);
});

test("stripe payload helpers produce transfer data and metadata assertions", () => {
  const splitPlan = buildStripeSplitPlan({
    chargedAmountCents: 2000,
    sessionAmountCents: 2000,
    parkTaxiDailyTicketTotalCents: 700,
    pricingType: "daily",
    flowType: "park_now",
    destinationAccountId: "acct_manager",
    expenseRate: 0,
    taxRate: 0,
    fixedExpenseCents: 0,
    caseOwnerFixedPayoutCents: 0,
  });

  const metadata: Record<string, string> = {
    location_id: "loc_1",
    ...buildStripeSplitMetadata({ splitPlan, caseOwnerFixedPayoutCents: 0 }),
  };
  const payload = {
    metadata,
    payment_intent_data: {
      setup_future_usage: "off_session",
      ...buildStripeSplitPaymentIntentData(splitPlan),
    },
  };

  assert.deepEqual(payload.payment_intent_data, {
    setup_future_usage: "off_session",
    transfer_data: { destination: "acct_manager" },
    application_fee_amount: 1650,
  });
  assert.equal(payload.metadata.split_enabled, "1");
  assert.equal(payload.metadata.split_owner_payout_cents, "350");
  assert.equal(payload.metadata.split_destination_account_id, "acct_manager");
  assert.equal(payload.metadata.split_rule, "park_taxi_50pct_base");
});

test("regular lot metadata exposes payout mode and minimum daily fee rule", () => {
  const splitPlan = buildStripeSplitPlan({
    chargedAmountCents: 3500,
    sessionAmountCents: 3500,
    parkTaxiDailyTicketTotalCents: 0,
    sessionQuantity: 5,
    pricingType: "daily",
    flowType: "payment",
    destinationAccountId: "acct_manager",
    expenseRate: 0,
    taxRate: 0,
    fixedExpenseCents: 0,
    payoutMode: "regular",
  });

  const metadata = buildStripeSplitMetadata({
    splitPlan,
    caseOwnerFixedPayoutCents: 0,
  });
  assert.equal(metadata.split_payout_mode, "regular");
  assert.equal(metadata.split_application_fee_cents, "495");
  assert.equal(metadata.split_rule, "regular_daily_min_099");
});

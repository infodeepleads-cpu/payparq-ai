import { NextRequest, NextResponse } from "next/server";
import {
  buildStripeSplitPlan,
  buildStripeSplitPaymentIntentData,
} from "@shared/stripeSplit";

function toCents(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") || "hub";
  const chargeEuro = url.searchParams.get("charge_euro") || "100";
  const stripeAccountId = url.searchParams.get("stripe_account_id") || "acct_test";

  const chargedCents = toCents(parseFloat(chargeEuro) * 100);

  // Test both hub and regular modes with identical parameters
  const splitPlan = buildStripeSplitPlan({
    chargedAmountCents: chargedCents,
    sessionAmountCents: chargedCents,
    pricingType: "hourly",
    flowType: "reserve",
    destinationAccountId: stripeAccountId,
    expenseRate: 0.079,
    taxRate: 0,
    fixedExpenseCents: 30,
    payoutMode: mode === "regular" ? "regular" : "hub",
  });

  const paymentIntentData = buildStripeSplitPaymentIntentData(splitPlan);

  return NextResponse.json({
    mode,
    chargeEuro: parseFloat(chargeEuro),
    chargedCents,
    splitPlan: {
      splitRule: splitPlan.splitRule,
      ownerPayoutCents: splitPlan.ownerPayoutCents,
      applicationFeeAmount: splitPlan.applicationFeeAmount,
      ownerShareRate: splitPlan.ownerShareRate,
      platformShareRate: splitPlan.platformShareRate,
    },
    paymentIntentData,
    hasTransferData: !!paymentIntentData.transfer_data,
    transferDestination: (paymentIntentData.transfer_data as any)?.destination || null,
    applicationFeeAmount: paymentIntentData.application_fee_amount || 0,
  });
}

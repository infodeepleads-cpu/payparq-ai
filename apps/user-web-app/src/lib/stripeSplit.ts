export type PricingType = "hourly" | "daily" | "monthly";

export type StripeSplitRule =
  | "monthly_90_10"
  | "standard_50_50"
  | "park_taxi_50pct_base"
  | "case_fixed_owner_fee"
  | "regular_10pct"
  | "regular_daily_min_099"
  | "regular_0pct";

export type LotPayoutMode = "hub" | "regular";

export type StripeSplitPlan = {
  destinationAccountId: string;
  applicationFeeAmount: number;
  ownerPayoutCents: number;
  splitBaseCents: number;
  expenseCents: number;
  taxCents: number;
  distributableCents: number;
  ownerShareRate: number;
  platformShareRate: number;
  splitRule: StripeSplitRule;
};

function toCents(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

function resolveRateValue(raw: unknown, fallback: number): number {
  const numeric = Number(raw);
  if (!Number.isFinite(numeric)) return fallback;
  if (numeric <= 0) return 0;
  if (numeric > 1) return Math.min(1, numeric / 100);
  return Math.min(1, numeric);
}

export function normalizeRole(value: string | null | undefined): string {
  return (value ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}

export function isAutomaticSplitEligibleRole(
  value: string | null | undefined,
): boolean {
  return normalizeRole(value) === "manager";
}

export function resolveAutomaticSplitDestination(params: {
  profileRole: unknown;
  stripeAccountId: unknown;
  stripeOnboardingComplete: unknown;
}) {
  const normalizedRole = normalizeRole(
    typeof params.profileRole === "string"
      ? params.profileRole
      : String(params.profileRole ?? ""),
  );
  const destinationAccountId = typeof params.stripeAccountId === "string"
    ? params.stripeAccountId.trim()
    : String(params.stripeAccountId ?? "").trim();
  const stripeReady = params.stripeOnboardingComplete === true;
  const splitEligible = isAutomaticSplitEligibleRole(normalizedRole) &&
    destinationAccountId.length > 0 && stripeReady;
  return {
    normalizedRole,
    destinationAccountId: splitEligible ? destinationAccountId : null,
    splitEligible,
  };
}

export function resolveSplitExpenseRate(
  metadata: Record<string, unknown>,
  envValue?: unknown,
): number {
  const metadataRate = metadata.split_expense_rate ??
    metadata.expense_rate ??
    metadata.shared_expense_rate ??
    metadata.processing_expense_rate;
  return resolveRateValue(metadataRate ?? envValue ?? null, 0.079);
}

export function resolveSplitTaxRate(
  metadata: Record<string, unknown>,
  envValue?: unknown,
): number {
  const metadataRate = metadata.split_tax_rate ??
    metadata.tax_rate ??
    metadata.vat_rate ??
    metadata.pdv_rate;
  return resolveRateValue(metadataRate ?? envValue ?? null, 0);
}

export function resolveSplitFixedExpenseCents(
  metadata: Record<string, unknown>,
  envValue?: unknown,
): number {
  const metadataValue = metadata.split_fixed_expense_cents ??
    metadata.fixed_expense_cents ??
    metadata.processing_fixed_fee_cents;
  const numeric = Number(metadataValue ?? envValue ?? null);
  if (!Number.isFinite(numeric) || numeric < 0) return 30;
  return Math.max(0, Math.round(numeric));
}

export function resolveCaseOwnerFixedPayoutCents(
  metadata: Record<string, unknown>,
  envValue?: unknown,
): number {
  const metadataValue = metadata.owner_case_process_fee_cents ??
    metadata.case_owner_process_fee_cents ??
    metadata.case_owner_fixed_payout_cents;
  const numeric = Number(metadataValue ?? envValue ?? null);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return Math.max(0, Math.round(numeric));
}

export function resolveLotPayoutMode(
  metadata: Record<string, unknown>,
): LotPayoutMode {
  return metadata.hub_enabled === true ? "hub" : "regular";
}

function resolveDistributionAmounts(params: {
  chargedCents: number;
  expenseRate: number;
  taxRate: number;
  fixedExpenseCents: number;
}) {
  const chargedCents = toCents(params.chargedCents);
  const expenseByRate = Math.round(
    chargedCents * Math.max(0, params.expenseRate),
  );
  const expenseCents = Math.max(
    0,
    Math.min(
      chargedCents,
      expenseByRate + Math.max(0, params.fixedExpenseCents),
    ),
  );
  const taxableBase = Math.max(0, chargedCents - expenseCents);
  const taxCents = Math.max(
    0,
    Math.min(
      taxableBase,
      Math.round(taxableBase * Math.max(0, params.taxRate)),
    ),
  );
  const distributableCents = Math.max(
    0,
    chargedCents - expenseCents - taxCents,
  );
  return {
    splitBaseCents: chargedCents,
    expenseCents,
    taxCents,
    distributableCents,
  };
}

export function buildStripeSplitPlan(params: {
  chargedAmountCents: number;
  sessionAmountCents?: number;
  parkTaxiDailyTicketTotalCents?: number;
  sessionQuantity?: number;
  pricingType: PricingType;
  flowType: string;
  destinationAccountId: string;
  expenseRate: number;
  taxRate: number;
  fixedExpenseCents: number;
  caseOwnerFixedPayoutCents?: number;
  payoutMode?: LotPayoutMode;
  regularDailyMinimumPlatformFeeCents?: number;
}): StripeSplitPlan {
  const charged = toCents(params.chargedAmountCents);
  const sessionAmount = toCents(
    params.sessionAmountCents ?? params.chargedAmountCents,
  );
  const parkTaxiDailyTicketTotalCents = toCents(
    params.parkTaxiDailyTicketTotalCents ?? 0,
  );
  const caseOwnerFixedPayoutCents = toCents(
    params.caseOwnerFixedPayoutCents ?? 0,
  );
  const sessionQuantity = Math.max(1, toCents(params.sessionQuantity ?? 1));
  const payoutMode = params.payoutMode ?? "hub";
  const regularDailyMinimumPlatformFeeCents = Math.max(
    0,
    toCents(params.regularDailyMinimumPlatformFeeCents ?? 99),
  );
  const isParkTaxi = params.flowType === "park_now";
  const isCaseFlow = params.flowType === "cases" ||
    params.flowType === "case_payment";
  const distributionAmounts = resolveDistributionAmounts({
    chargedCents: charged,
    expenseRate: params.expenseRate,
    taxRate: params.taxRate,
    fixedExpenseCents: params.fixedExpenseCents,
  });
  if (payoutMode === "regular") {
    const platformSplitCents = 0;
    const ownerPayoutCents = Math.max(
      0,
      distributionAmounts.distributableCents - platformSplitCents,
    );
    const applicationFeeAmount = Math.max(0, charged - ownerPayoutCents);
    const ownerShareRate = distributionAmounts.distributableCents > 0
      ? ownerPayoutCents / distributionAmounts.distributableCents
      : 0;
    const platformShareRate = 0;
    return {
      destinationAccountId: params.destinationAccountId,
      applicationFeeAmount,
      ownerPayoutCents,
      splitBaseCents: distributionAmounts.splitBaseCents,
      expenseCents: distributionAmounts.expenseCents,
      taxCents: distributionAmounts.taxCents,
      distributableCents: distributionAmounts.distributableCents,
      ownerShareRate,
      platformShareRate,
      splitRule: "regular_0pct",
    };
  }
  if (isCaseFlow) {
    const ownerPayoutCents = Math.max(
      0,
      Math.min(charged, caseOwnerFixedPayoutCents),
    );
    const applicationFeeAmount = Math.max(
      0,
      Math.min(charged, charged - ownerPayoutCents),
    );
    const ownerShareRate = charged > 0 ? ownerPayoutCents / charged : 0;
    const platformShareRate = 1 - ownerShareRate;
    return {
      destinationAccountId: params.destinationAccountId,
      applicationFeeAmount,
      ownerPayoutCents,
      splitBaseCents: charged,
      expenseCents: 0,
      taxCents: 0,
      distributableCents: charged,
      ownerShareRate,
      platformShareRate,
      splitRule: "case_fixed_owner_fee",
    };
  }

  const ownerShareRate = isParkTaxi
    ? 1
    : params.pricingType === "monthly"
    ? 0.9
    : 0.5;
  const platformShareRate = 1 - ownerShareRate;
  const baseFromPolicy = isParkTaxi
    ? Math.round(parkTaxiDailyTicketTotalCents * 0.5)
    : sessionAmount;
  const splitBaseCents = Math.max(
    0,
    Math.min(distributionAmounts.distributableCents, baseFromPolicy),
  );
  const expenseCents = distributionAmounts.expenseCents;
  const taxCents = distributionAmounts.taxCents;
  const distributableCents = distributionAmounts.distributableCents;
  const ownerPayoutCents = Math.max(
    0,
    Math.min(
      charged,
      isParkTaxi ? splitBaseCents : Math.round(splitBaseCents * ownerShareRate),
    ),
  );
  const applicationFeeAmount = Math.max(
    0,
    Math.min(charged, charged - ownerPayoutCents),
  );
  const splitRule: StripeSplitRule = isParkTaxi
    ? "park_taxi_50pct_base"
    : params.pricingType === "monthly"
    ? "monthly_90_10"
    : "standard_50_50";

  return {
    destinationAccountId: params.destinationAccountId,
    applicationFeeAmount,
    ownerPayoutCents,
    splitBaseCents,
    expenseCents,
    taxCents,
    distributableCents,
    ownerShareRate,
    platformShareRate,
    splitRule,
  };
}

export function buildStripeSplitMetadata(params: {
  splitPlan: StripeSplitPlan | null;
  caseOwnerFixedPayoutCents?: number;
}): Record<string, string> {
  const splitPlan = params.splitPlan;
  return {
    split_enabled: splitPlan ? "1" : "0",
    split_destination_account_id: splitPlan?.destinationAccountId ?? "",
    split_payout_mode: splitPlan?.splitRule === "regular_10pct" ||
        splitPlan?.splitRule === "regular_daily_min_099"
      ? "regular"
      : splitPlan
      ? "hub"
      : "",
    split_application_fee_cents: String(splitPlan?.applicationFeeAmount ?? 0),
    split_owner_payout_cents: String(splitPlan?.ownerPayoutCents ?? 0),
    split_base_cents: String(splitPlan?.splitBaseCents ?? 0),
    split_expense_cents: String(splitPlan?.expenseCents ?? 0),
    split_tax_cents: String(splitPlan?.taxCents ?? 0),
    split_distributable_cents: String(splitPlan?.distributableCents ?? 0),
    split_owner_rate: splitPlan ? splitPlan.ownerShareRate.toFixed(4) : "",
    split_platform_rate: splitPlan
      ? splitPlan.platformShareRate.toFixed(4)
      : "",
    split_rule: splitPlan?.splitRule ?? "",
    split_case_owner_fixed_payout_cents: String(
      toCents(params.caseOwnerFixedPayoutCents ?? 0),
    ),
  };
}

export function buildStripeSplitPaymentIntentData(
  splitPlan: StripeSplitPlan | null,
) {
  if (!splitPlan) return {};
  return {
    transfer_data: {
      destination: splitPlan.destinationAccountId,
    },
    application_fee_amount: splitPlan.applicationFeeAmount,
  };
}

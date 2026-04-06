import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type PaymentMethodRow = {
  id: string;
  brand: string;
  last4: string;
  expMonth: number | null;
  expYear: number | null;
  isDefault: boolean;
};

function normalizeEmail(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function resolveStripeSecretKey(): string | null {
  const candidates = [
    process.env.STRIPE_SECRET_KEY,
    process.env.STRIPE_SECRET,
    process.env.STRIPE_KEY,
    process.env.STRIPE_API_SECRET,
    process.env.STRIPE_PRIVATE_KEY,
    process.env.STRIPE_LIVE_SECRET_KEY,
    process.env.STRIPE_TEST_SECRET_KEY,
    process.env.NEXT_PRIVATE_STRIPE_SECRET_KEY,
    process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY,
  ];
  for (const rawValue of candidates) {
    const secret = (rawValue ?? "").trim().replace(/^['"]+|['"]+$/g, "");
    if (!secret) continue;
    if (!/^sk_(test|live)_/i.test(secret)) continue;
    if (/your_stripe|replace_me|changeme|example/i.test(secret)) continue;
    return secret;
  }
  return null;
}

async function resolveMember(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (token && supabaseAdmin) {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && data.user) {
      const email = normalizeEmail(data.user.email);
      if (email) {
        return { email, userId: data.user.id };
      }
    }
  }
  const fallbackEmail = normalizeEmail(req.headers.get("x-member-email"));
  if (fallbackEmail) {
    return { email: fallbackEmail, userId: null };
  }
  return { email: "", userId: null };
}

async function resolveStripeCustomerForMember(params: {
  stripe: Stripe;
  email: string;
  userId: string | null;
}) {
  let customerId = "";
  let defaultPaymentMethod = "";
  let metadataByUser: Record<string, unknown> = {};
  if (params.userId && supabaseAdmin) {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(params.userId);
    if (!error && data.user) {
      metadataByUser = (data.user.user_metadata ?? {}) as Record<string, unknown>;
      customerId = (metadataByUser.stripe_customer_id ?? "").toString().trim();
      defaultPaymentMethod = (metadataByUser.default_payment_method ?? "").toString().trim();
    }
  }
  if (!customerId) {
    const customers = await params.stripe.customers.list({
      email: params.email,
      limit: 10,
    });
    const exact = customers.data.find(
      (candidate) => normalizeEmail(candidate.email) === params.email
    );
    const resolved = exact ?? customers.data[0];
    customerId = resolved?.id ?? "";
    if (!defaultPaymentMethod) {
      const invoiceDefault = resolved?.invoice_settings?.default_payment_method;
      defaultPaymentMethod =
        typeof invoiceDefault === "string"
          ? invoiceDefault
          : invoiceDefault?.id ?? "";
    }
  }
  if (customerId && params.userId && supabaseAdmin) {
    await supabaseAdmin.auth.admin.updateUserById(params.userId, {
      user_metadata: {
        ...metadataByUser,
        stripe_customer_id: customerId,
        default_payment_method: defaultPaymentMethod || null,
      },
    });
  }
  return {
    customerId: customerId || null,
    defaultPaymentMethod: defaultPaymentMethod || null,
  };
}

async function listPaymentMethods(params: {
  stripe: Stripe;
  customerId: string;
  defaultPaymentMethod: string | null;
}): Promise<PaymentMethodRow[]> {
  const methods = await params.stripe.paymentMethods.list({
    customer: params.customerId,
    type: "card",
    limit: 100,
  });
  return methods.data.map((method) => ({
    id: method.id,
    brand: method.card?.brand ?? "card",
    last4: method.card?.last4 ?? "0000",
    expMonth: method.card?.exp_month ?? null,
    expYear: method.card?.exp_year ?? null,
    isDefault: method.id === params.defaultPaymentMethod,
  }));
}

export async function GET(req: NextRequest) {
  const member = await resolveMember(req);
  if (!member.email) {
    return NextResponse.json({ error: "unauthorized_member" }, { status: 401 });
  }
  const stripeSecret = resolveStripeSecretKey();
  if (!stripeSecret) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 500 });
  }
  const stripe = new Stripe(stripeSecret, { apiVersion: "2025-03-31.basil" as unknown as Stripe.LatestApiVersion });
  const customer = await resolveStripeCustomerForMember({
    stripe,
    email: member.email,
    userId: member.userId,
  });
  if (!customer.customerId) {
    return NextResponse.json({ paymentMethods: [] });
  }
  const paymentMethods = await listPaymentMethods({
    stripe,
    customerId: customer.customerId,
    defaultPaymentMethod: customer.defaultPaymentMethod,
  });
  return NextResponse.json({ paymentMethods });
}

export async function DELETE(req: NextRequest) {
  const member = await resolveMember(req);
  if (!member.email) {
    return NextResponse.json({ error: "unauthorized_member" }, { status: 401 });
  }
  const stripeSecret = resolveStripeSecretKey();
  if (!stripeSecret) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 500 });
  }
  const payload = (await req.json().catch(() => null)) as { paymentMethodId?: string } | null;
  const paymentMethodId = (payload?.paymentMethodId ?? "").toString().trim();
  if (!paymentMethodId) {
    return NextResponse.json({ error: "missing_payment_method_id" }, { status: 400 });
  }
  const stripe = new Stripe(stripeSecret, { apiVersion: "2025-03-31.basil" as unknown as Stripe.LatestApiVersion });
  const customer = await resolveStripeCustomerForMember({
    stripe,
    email: member.email,
    userId: member.userId,
  });
  if (!customer.customerId) {
    return NextResponse.json({ ok: true });
  }
  try {
    const method = await stripe.paymentMethods.retrieve(paymentMethodId);
    const attachedCustomer =
      typeof method.customer === "string" ? method.customer : method.customer?.id ?? "";
    if (attachedCustomer && attachedCustomer !== customer.customerId) {
      return NextResponse.json({ error: "forbidden_payment_method" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "payment_method_not_found" }, { status: 404 });
  }
  await stripe.paymentMethods.detach(paymentMethodId);
  if (customer.defaultPaymentMethod === paymentMethodId) {
    let nextDefaultPaymentMethod: string | null = null;
    try {
      const remainingMethods = await stripe.paymentMethods.list({
        customer: customer.customerId,
        type: "card",
        limit: 1,
      });
      nextDefaultPaymentMethod = remainingMethods.data[0]?.id ?? null;
      await stripe.customers.update(customer.customerId, {
        invoice_settings: {
          default_payment_method: nextDefaultPaymentMethod ?? undefined,
        },
      });
    } catch {
    }
    if (member.userId && supabaseAdmin) {
      const { data } = await supabaseAdmin.auth.admin.getUserById(member.userId);
      const currentMetadata = (data?.user?.user_metadata ?? {}) as Record<string, unknown>;
      await supabaseAdmin.auth.admin.updateUserById(member.userId, {
        user_metadata: {
          ...currentMetadata,
          default_payment_method: nextDefaultPaymentMethod,
        },
      });
    }
  }
  return NextResponse.json({ ok: true });
}

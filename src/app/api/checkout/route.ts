import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/server/env";
import { priceCart, type CartLineInput } from "@/lib/server/pricing";

type CheckoutPayload = {
  items?: CartLineInput[];
  email?: string | null;
};

async function createStripePaymentIntent(
  amount: number,
  email?: string | null,
  stripeSecret?: string | null,
) {
  if (!stripeSecret) return null;
  const params = new URLSearchParams();
  params.append("amount", String(amount));
  params.append("currency", "brl");
  params.append("automatic_payment_methods[enabled]", "true");
  if (email) params.append("receipt_email", email);

  const response = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "Stripe request failed");
    throw new Error(details);
  }

  return (await response.json()) as { id: string; client_secret: string };
}

export async function POST(request: Request) {
  const stripeSecret = getServerEnv().STRIPE_SECRET_KEY;

  try {
    const payload = (await request.json().catch(() => ({}))) as CheckoutPayload;
    const items = payload.items ?? [];
    const email = payload.email ?? undefined;

    if (!items.length) {
      return NextResponse.json(
        { error: "Itens sao obrigatorios" },
        { status: 400 },
      );
    }

    const priced = await priceCart(items);

    if (!stripeSecret || priced.total === 0) {
      return NextResponse.json({
        mode: "mock",
        pricing: priced,
        clientSecret: `pi_mock_${Date.now()}`,
        paymentIntentId: null,
      });
    }

    const intent = await createStripePaymentIntent(
      priced.total,
      email,
      stripeSecret,
    );
    if (!intent) {
      return NextResponse.json(
        { error: "Nao foi possivel iniciar a finalizacao do pedido" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      mode: "stripe",
      pricing: priced,
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Nao foi possivel iniciar a finalizacao do pedido" },
      { status: 400 },
    );
  }
}

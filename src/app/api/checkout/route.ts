import Stripe from "stripe";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { priceCart } from "@/lib/server/pricing";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret
  ? new Stripe(stripeSecret, {
      typescript: true,
    })
  : null;

export async function POST(request: Request) {
  try {
    const { items, couponCode, email } = await request.json();

    if (!items?.length) {
      return NextResponse.json(
        { error: "Itens são obrigatórios" },
        { status: 400 },
      );
    }

    const priced = await priceCart(prisma, items, couponCode);

    if (!stripe || priced.total === 0) {
      return NextResponse.json({
        mode: "mock",
        pricing: priced,
        clientSecret: `pi_mock_${Date.now()}`,
        paymentIntentId: null,
      });
    }

    const intent = await stripe.paymentIntents.create({
      amount: priced.total,
      currency: "brl",
      receipt_email: email,
      automatic_payment_methods: { enabled: true },
      metadata: {
        coupon: priced.coupon?.code ?? "",
      },
    });

    return NextResponse.json({
      mode: "stripe",
      pricing: priced,
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Não foi possível iniciar o checkout" },
      { status: 400 },
    );
  }
}

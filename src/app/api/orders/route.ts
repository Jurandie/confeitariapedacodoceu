import { NextResponse } from "next/server";
import { createOrder, getOrdersByEmail } from "@/lib/server/orders";
import type { CartLineInput } from "@/lib/server/pricing";

type CreateOrderPayload = {
  customerEmail?: string;
  customerName?: string | null;
  items?: CartLineInput[];
  paymentIntentId?: string | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { error: "Informe o email para recuperar pedidos" },
      { status: 400 },
    );
  }

  const orders = await getOrdersByEmail(email.toLowerCase());
  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => ({}))) as CreateOrderPayload;
    const customerEmail = payload.customerEmail?.trim().toLowerCase();
    const customerName = payload.customerName?.trim() || undefined;
    const items = payload.items ?? [];
    const paymentIntentId = payload.paymentIntentId?.trim() || undefined;

    if (!customerEmail || !items.length) {
      return NextResponse.json(
        { error: "Email e itens sao obrigatorios" },
        { status: 400 },
      );
    }

    const { order, pricing } = await createOrder({
      customerEmail,
      customerName,
      items,
      paymentIntentId,
    });

    return NextResponse.json({ order, pricing }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Nao foi possivel criar o pedido" },
      { status: 400 },
    );
  }
}

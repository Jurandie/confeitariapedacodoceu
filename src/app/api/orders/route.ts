import { NextResponse } from "next/server";
import { createOrder, getOrdersByEmail } from "@/lib/server/orders";

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
    const body = await request.json();
    const { customerEmail, customerName, items, couponCode, paymentIntentId } =
      body;

    if (!customerEmail || !items?.length) {
      return NextResponse.json(
        { error: "Email e itens são obrigatórios" },
        { status: 400 },
      );
    }

    const { order, pricing } = await createOrder({
      customerEmail: String(customerEmail).toLowerCase(),
      customerName: customerName ? String(customerName) : undefined,
      items,
      couponCode: couponCode ? String(couponCode) : undefined,
      paymentIntentId: paymentIntentId ? String(paymentIntentId) : undefined,
    });

    return NextResponse.json({ order, pricing }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Não foi possível criar o pedido" },
      { status: 400 },
    );
  }
}

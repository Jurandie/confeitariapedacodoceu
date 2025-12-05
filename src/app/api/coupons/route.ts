import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { priceCart } from "@/lib/server/pricing";

export async function POST(request: Request) {
  try {
    const { code, items } = await request.json();
    if (!code || !items?.length) {
      return NextResponse.json(
        { error: "Código e itens são obrigatórios" },
        { status: 400 },
      );
    }

    const priced = await priceCart(prisma, items, String(code));

    return NextResponse.json({
      valid: Boolean(priced.coupon),
      coupon: priced.coupon
        ? {
            code: priced.coupon.code,
            type: priced.coupon.type,
            value: priced.coupon.value,
            minValue: priced.coupon.minValue,
          }
        : null,
      discount: priced.discount,
      subtotal: priced.subtotal,
      shipping: priced.shipping,
      total: priced.total,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Falha ao validar cupom" }, { status: 500 });
  }
}

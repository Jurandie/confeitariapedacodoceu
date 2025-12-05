import { prisma } from "../prisma";
import { CartLineInput, priceCart } from "./pricing";

export async function getOrdersByEmail(email: string) {
  return prisma.order.findMany({
    where: { customerEmail: email },
    orderBy: { createdAt: "desc" },
    include: {
      coupon: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });
}

type CreateOrderInput = {
  customerEmail: string;
  customerName?: string;
  items: CartLineInput[];
  couponCode?: string;
  paymentIntentId?: string | null;
  status?: string;
};

export async function createOrder(input: CreateOrderInput) {
  const { items, couponCode } = input;
  if (!items?.length) {
    throw new Error("Carrinho vazio");
  }

  const priced = await priceCart(prisma, items, couponCode);

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        customerEmail: input.customerEmail,
        customerName: input.customerName,
        status: input.status ?? "PENDING",
        subtotal: priced.subtotal,
        discount: priced.discount,
        shipping: priced.shipping,
        total: priced.total,
        paymentIntentId: input.paymentIntentId ?? undefined,
        couponId: priced.coupon?.id,
        items: {
          create: priced.lines.map((line) => ({
            productId: line.product.id,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
          })),
        },
      },
      include: {
        coupon: true,
        items: { include: { product: true } },
      },
    });

    for (const line of priced.lines) {
      await tx.product.update({
        where: { id: line.product.id },
        data: { stock: { decrement: line.quantity } },
      });
    }

    if (priced.coupon) {
      await tx.coupon.update({
        where: { id: priced.coupon.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    return created;
  });

  return { order, pricing: priced };
}

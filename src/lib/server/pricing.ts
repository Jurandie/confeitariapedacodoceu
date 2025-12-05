import { Coupon, PrismaClient, Product } from "@prisma/client";
import { computeTotals } from "../pricing";

export type CartLineInput = { productId: string; quantity: number };

export type PricedLine = {
  product: Product;
  quantity: number;
  unitPrice: number;
};

export type PricingResult = {
  lines: PricedLine[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  coupon: Coupon | null;
};

function validateCoupon(coupon: Coupon | null, subtotal: number) {
  if (!coupon) return null;
  if (!coupon.active) return null;
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return null;
  if (coupon.minValue && subtotal < coupon.minValue) return null;
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) return null;
  return coupon;
}

export async function priceCart(
  prisma: PrismaClient,
  lines: CartLineInput[],
  couponCode?: string,
): Promise<PricingResult> {
  if (!lines.length) {
    return {
      lines: [],
      subtotal: 0,
      discount: 0,
      shipping: 0,
      total: 0,
      coupon: null,
    };
  }

  const ids = lines.map((l) => l.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
  });

  const enriched: PricedLine[] = lines.map((line) => {
    const product = products.find((p) => p.id === line.productId);
    if (!product) {
      throw new Error(`Produto não encontrado: ${line.productId}`);
    }
    if (line.quantity < 1) {
      throw new Error(`Quantidade inválida para ${product.name}`);
    }
    if (product.stock && line.quantity > product.stock) {
      throw new Error(`Estoque insuficiente para ${product.name}`);
    }
    return { product, quantity: line.quantity, unitPrice: product.price };
  });

  const subtotal = enriched.reduce(
    (acc, line) => acc + line.unitPrice * line.quantity,
    0,
  );

  let coupon: Coupon | null = null;
  if (couponCode) {
    coupon = await prisma.coupon.findUnique({
      where: { code: couponCode.toUpperCase() },
    });
  }

  const validCoupon = validateCoupon(coupon, subtotal);
  const { discount, shipping, total } = computeTotals(
    enriched.map((l) => ({
      productId: l.product.id,
      quantity: l.quantity,
      price: l.unitPrice,
    })),
    validCoupon
      ? {
          code: validCoupon.code,
          type: validCoupon.type as "PERCENT" | "FIXED",
          value: validCoupon.value,
          minValue: validCoupon.minValue,
          expiresAt: validCoupon.expiresAt,
          active: validCoupon.active,
        }
      : undefined,
  );

  return {
    lines: enriched,
    subtotal,
    discount,
    shipping,
    total,
    coupon: validCoupon ?? null,
  };
}

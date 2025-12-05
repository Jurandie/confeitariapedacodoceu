export type Money = number; // centavos

export type CartLine = {
  productId: string;
  quantity: number;
  price: number; // centavos
};

export type CouponLike = {
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minValue?: number | null;
  expiresAt?: Date | string | null;
  active?: boolean | null;
};

export const SHIPPING_FLAT = 2500;
export const FREE_SHIPPING_FROM = 30000;

export function formatCurrency(value: Money, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value / 100);
}

export function isCouponValid(coupon: CouponLike | null | undefined, subtotal: Money) {
  if (!coupon) return false;
  if (coupon.active === false) return false;
  if (coupon.minValue && subtotal < coupon.minValue) return false;
  if (coupon.expiresAt) {
    const expires = new Date(coupon.expiresAt);
    if (Number.isFinite(expires.getTime()) && expires.getTime() < Date.now()) {
      return false;
    }
  }
  return true;
}

export function computeDiscount(subtotal: Money, coupon?: CouponLike | null) {
  if (!isCouponValid(coupon, subtotal)) return 0;
  if (!coupon) return 0;
  if (coupon.type === "PERCENT") {
    return Math.floor((subtotal * coupon.value) / 100);
  }
  return Math.min(subtotal, coupon.value);
}

export function computeTotals(lines: CartLine[], coupon?: CouponLike | null) {
  const subtotal = lines.reduce((acc, line) => acc + line.price * line.quantity, 0);
  const shipping = subtotal >= FREE_SHIPPING_FROM || subtotal === 0 ? 0 : SHIPPING_FLAT;
  const discount = computeDiscount(subtotal, coupon);
  const total = Math.max(subtotal + shipping - discount, 0);

  return { subtotal, shipping, discount, total };
}

export type Money = number; // centavos

export type CartLine = {
  productId: string;
  quantity: number;
  price: number; // centavos
};

export const SHIPPING_FLAT = 0;

export function formatCurrency(value: Money, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value / 100);
}

export function computeDiscount() {
  // Cupons desativados: nenhum desconto aplicado.
  return 0;
}

export function computeTotals(lines: CartLine[]) {
  const subtotal = lines.reduce((acc, line) => acc + line.price * line.quantity, 0);
  const shipping = 0;
  const discount = 0;
  const total = Math.max(subtotal + shipping - discount, 0);

  return { subtotal, shipping, discount, total };
}

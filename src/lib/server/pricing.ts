import { computeTotals } from "../pricing";
import { queryAll } from "./d1";

export type CartLineInput = { productId: string; quantity: number };

type ProductRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image?: string | null;
  stock: number;
  category?: string | null;
};

export type PricedLine = {
  product: ProductRecord;
  quantity: number;
  unitPrice: number;
};

export type PricingResult = {
  lines: PricedLine[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
};

export async function priceCart(lines: CartLineInput[]): Promise<PricingResult> {
  if (!lines.length) {
    return {
      lines: [],
      subtotal: 0,
      discount: 0,
      shipping: 0,
      total: 0,
    };
  }

  const ids = Array.from(new Set(lines.map((l) => l.productId)));
  const placeholders = ids.map(() => "?").join(",");
  const products = await queryAll<ProductRecord>(
    `SELECT * FROM Product WHERE id IN (${placeholders})`,
    ids,
  );

  const enriched: PricedLine[] = lines.map((line) => {
    const product = products.find((p) => p.id === line.productId);
    if (!product) {
      throw new Error(`Produto nao encontrado: ${line.productId}`);
    }
    if (line.quantity < 1) {
      throw new Error(`Quantidade invalida para ${product.name}`);
    }
    const hasFiniteStock = product.stock !== null && product.stock !== undefined;
    if (hasFiniteStock && line.quantity > product.stock) {
      throw new Error(`Estoque insuficiente para ${product.name}`);
    }
    return { product, quantity: line.quantity, unitPrice: product.price };
  });

  const subtotal = enriched.reduce(
    (acc, line) => acc + line.unitPrice * line.quantity,
    0,
  );

  const { discount, shipping, total } = computeTotals(
    enriched.map((l) => ({
      productId: l.product.id,
      quantity: l.quantity,
      price: l.unitPrice,
    })),
  );

  return {
    lines: enriched,
    subtotal,
    discount,
    shipping,
    total,
  };
}

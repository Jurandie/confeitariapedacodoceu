import type { D1Database } from "@cloudflare/workers-types";
import { priceCart, CartLineInput, PricingResult } from "./pricing";
import { getDb, withTransaction } from "./d1";

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

type OrderRow = {
  id: string;
  customerEmail: string;
  customerName?: string | null;
  status: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  paymentIntentId?: string | null;
  createdAt: string;
  updatedAt: string;
};

type OrderItemRow = {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product_name: string;
  product_slug: string;
  product_description: string;
  product_price: number;
  product_image?: string | null;
  product_stock: number;
  product_category?: string | null;
};

export type CreateOrderInput = {
  customerEmail: string;
  customerName?: string;
  items: CartLineInput[];
  paymentIntentId?: string | null;
  status?: string;
};

type HydratedOrder = OrderRow & {
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    product: ProductRecord;
  }[];
};

async function hydrateOrders(orderRows: OrderRow[], db = getDb()) {
  if (!orderRows.length) return [];

  const orderIds = orderRows.map((o) => o.id);
  const placeholders = orderIds.map(() => "?").join(",");
  const items = await db
    .prepare(
      `SELECT oi.*, 
        p.name AS product_name,
        p.slug AS product_slug,
        p.description AS product_description,
        p.price AS product_price,
        p.image AS product_image,
        p.stock AS product_stock,
        p.category AS product_category
      FROM OrderItem oi
      INNER JOIN Product p ON p.id = oi.productId
      WHERE oi.orderId IN (${placeholders})`,
    )
    .bind(...orderIds)
    .all<OrderItemRow>()
    .then((res) => res.results ?? []);

  const itemsByOrder = new Map<string, OrderItemRow[]>();
  for (const item of items) {
    const current = itemsByOrder.get(item.orderId) ?? [];
    current.push(item);
    itemsByOrder.set(item.orderId, current);
  }

  return orderRows.map<HydratedOrder>((order) => ({
    ...order,
    items: (itemsByOrder.get(order.id) ?? []).map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      product: {
        id: item.productId,
        name: item.product_name,
        slug: item.product_slug,
        description: item.product_description,
        price: item.product_price,
        image: item.product_image,
        stock: item.product_stock,
        category: item.product_category,
      },
    })),
  }));
}

export async function getOrdersByEmail(email: string) {
  const db = getDb();
  const orders = await db
    .prepare(
      `SELECT * FROM "Order" WHERE customerEmail = ? ORDER BY datetime(createdAt) DESC`,
    )
    .bind(email)
    .all<OrderRow>()
    .then((res) => res.results ?? []);

  return hydrateOrders(orders, db);
}

async function createOrderRecord(db: D1Database, order: OrderRow, priced: PricingResult) {
  await db
    .prepare(
      `INSERT INTO "Order" (
        id, customerEmail, customerName, status, subtotal, discount, shipping, total,
        paymentIntentId, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      order.id,
      order.customerEmail,
      order.customerName ?? null,
      order.status,
      priced.subtotal,
      priced.discount,
      priced.shipping,
      priced.total,
      order.paymentIntentId ?? null,
      order.createdAt,
      order.updatedAt,
    )
    .run();

  for (const line of priced.lines) {
    await db
      .prepare(
        `INSERT INTO OrderItem (id, orderId, productId, quantity, unitPrice)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(crypto.randomUUID(), order.id, line.product.id, line.quantity, line.unitPrice)
      .run();

    await db
      .prepare(`UPDATE Product SET stock = stock - ?, updatedAt = ? WHERE id = ?`)
      .bind(line.quantity, order.updatedAt, line.product.id)
      .run();
  }
}

export async function createOrder(input: CreateOrderInput) {
  if (!input.items?.length) {
    throw new Error("Carrinho vazio");
  }

  const priced = await priceCart(input.items);
  if (!priced.lines.length) {
    throw new Error("Carrinho vazio");
  }

  const now = new Date().toISOString();
  const orderRow: OrderRow = {
    id: crypto.randomUUID(),
    customerEmail: input.customerEmail,
    customerName: input.customerName ?? null,
    status: input.status ?? "PENDING",
    subtotal: priced.subtotal,
    discount: priced.discount,
    shipping: priced.shipping,
    total: priced.total,
    paymentIntentId: input.paymentIntentId ?? null,
    createdAt: now,
    updatedAt: now,
  };

  const order = await withTransaction(async (db) => {
    await createOrderRecord(db, orderRow, priced);
    const [hydrated] = await hydrateOrders([orderRow], db);
    return hydrated;
  });

  return { order, pricing: priced };
}

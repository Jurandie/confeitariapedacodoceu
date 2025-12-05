export type ProductDTO = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image?: string | null;
  stock: number;
  category?: string | null;
};

export type CouponDTO = {
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minValue?: number | null;
};

export type OrderItemDTO = {
  id: string;
  quantity: number;
  unitPrice: number;
  product: ProductDTO;
};

export type OrderDTO = {
  id: string;
  status: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  customerEmail: string;
  customerName?: string | null;
  createdAt: string | Date;
  coupon?: CouponDTO | null;
  items: OrderItemDTO[];
};

export type PricingDTO = {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  coupon?: CouponDTO | null;
};

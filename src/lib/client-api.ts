import { CartItem } from "@/contexts/cart-context";
import { OrderDTO, PricingDTO, ProductDTO } from "@/types";

export async function fetchProducts(): Promise<ProductDTO[]> {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error("Falha ao carregar produtos");
  const data = (await res.json()) as { products: ProductDTO[] };
  return data.products;
}

export async function startCheckout(
  items: CartItem[],
  email?: string,
) {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      email,
    }),
  });

  if (!res.ok) throw new Error("Erro ao iniciar finalizacao do pedido");
  return res.json() as Promise<{
    mode: string;
    pricing: PricingDTO;
    clientSecret: string | null;
    paymentIntentId: string | null;
  }>;
}

export async function createOrder(payload: {
  customerEmail: string;
  customerName?: string;
  items: CartItem[];
  paymentIntentId?: string | null;
}) {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerEmail: payload.customerEmail,
      customerName: payload.customerName,
      paymentIntentId: payload.paymentIntentId,
      items: payload.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    }),
  });

  if (!res.ok) throw new Error("Nao foi possivel salvar o pedido");
  return res.json() as Promise<{ order: OrderDTO; pricing: PricingDTO }>;
}

export async function fetchOrders(email: string) {
  const res = await fetch(`/api/orders?email=${encodeURIComponent(email)}`);
  if (!res.ok) throw new Error("Nao foi possivel carregar o historico");
  const data = (await res.json()) as { orders: OrderDTO[] };
  return data.orders;
}

export async function createProduct(payload: {
  name: string;
  description: string;
  price: number;
  stock?: number;
  category?: string;
  image?: string;
}) {
  const res = await fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as Partial<{
    message: string;
    product: ProductDTO;
  }>;
  if (!res.ok) {
    throw new Error(data?.message ?? "Nao foi possivel criar o doce.");
  }
  return data.product as ProductDTO;
}

export async function updateProductPrice(productId: string, price: number) {
  const res = await fetch(`/api/products/${productId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ price }),
  });
  const data = (await res.json().catch(() => ({}))) as Partial<{
    message: string;
    product: ProductDTO;
  }>;
  if (!res.ok) {
    throw new Error(data?.message ?? "Nao foi possivel atualizar o preco.");
  }
  return data.product as ProductDTO;
}

export async function uploadProductImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/uploads/product-image", {
    method: "POST",
    body: formData,
  });

  const data = (await res.json().catch(() => ({}))) as Partial<{
    message: string;
    path: string;
  }>;
  if (!res.ok) {
    throw new Error(data?.message ?? "Nao foi possivel enviar a imagem.");
  }

  return data.path as string;
}

export async function updateHeroContent(payload: {
  heroTitle: string;
  heroDescription: string;
  heroBadge: string;
  heroPanelTopTitle: string;
  heroPanelTopDescription: string;
  heroPanelBottomTitle: string;
  heroPanelBottomDescription: string;
  heroPanelFooter: string;
}) {
  const res = await fetch("/api/site-config", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as Partial<{
    message: string;
    config: {
      heroTitle: string;
      heroDescription: string;
      heroBadge: string;
      heroPanelTopTitle: string;
      heroPanelTopDescription: string;
      heroPanelBottomTitle: string;
      heroPanelBottomDescription: string;
      heroPanelFooter: string;
    };
  }>;
  if (!res.ok) {
    throw new Error(data?.message ?? "Nao foi possivel atualizar o painel.");
  }
  return data.config as {
    heroTitle: string;
    heroDescription: string;
    heroBadge: string;
    heroPanelTopTitle: string;
    heroPanelTopDescription: string;
    heroPanelBottomTitle: string;
    heroPanelBottomDescription: string;
    heroPanelFooter: string;
  };
}

export async function deleteProduct(productId: string) {
  const res = await fetch(`/api/products/${productId}`, {
    method: "DELETE",
  });
  const data = (await res.json().catch(() => ({}))) as Partial<{ message: string }>;
  if (!res.ok) {
    throw new Error(data?.message ?? "Nao foi possivel remover o doce.");
  }
  return true;
}

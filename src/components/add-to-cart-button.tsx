'use client';

import { ProductDTO } from "@/types";
import { useCartStore } from "@/contexts/cart-context";

export function AddToCartButton({ product }: { product: ProductDTO }) {
  const { addItem } = useCartStore();

  return (
    <button
      onClick={() =>
        addItem({
          productId: product.id,
          name: product.name,
          price: product.price,
          slug: product.slug,
          image: product.image,
          quantity: 1,
        })
      }
      className="rounded-full bg-[var(--jl-crimson)] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[var(--jl-crimson-dark)]"
    >
      Adicionar ao carrinho
    </button>
  );
}

'use client';

import Image from "next/image";
import { ProductDTO } from "@/types";
import { useCartStore } from "@/contexts/cart-context";
import { formatCurrency } from "@/lib/pricing";
import Link from "next/link";
import { resolveProductImage } from "@/lib/images";

export function ProductGrid({ products }: { products: ProductDTO[] }) {
  const { addItem } = useCartStore();

  if (products.length === 0) {
    return (
      <div className="jl-paper jl-reveal rounded-2xl border border-dashed border-[var(--jl-amber)]/60 p-8 text-center text-sm text-[var(--jl-crimson)]">
        <p className="jl-display text-lg font-semibold text-[var(--jl-crimson-dark)]">
          Sem doces publicados ainda.
        </p>
        <p className="mt-2 text-[var(--jl-crimson)]/80">
          Assim que a dona adicionar receitas pelo painel, elas aparecem aqui automaticamente.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product, index) => {
        const imageSrc = resolveProductImage(product.image);
        return (
          <article
            key={product.id}
            className="jl-card jl-reveal group relative overflow-hidden rounded-2xl transition hover:-translate-y-1"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="relative h-56 w-full overflow-hidden rounded-2xl border border-[var(--jl-amber)]/40 bg-[var(--jl-sand)]">
              {imageSrc ? (
                <Image
                  src={imageSrc}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-linear-to-br from-[var(--jl-sand)] to-[var(--jl-gold)] text-[var(--jl-crimson)]/60">
                  sem foto
                </div>
              )}
              <div className="jl-pill absolute left-3 top-3 border-dotted border-[var(--jl-amber)]/70 bg-[var(--jl-cream)] px-3 py-1 text-xs font-semibold text-[var(--jl-crimson)] shadow-sm">
                {product.category ?? "doces"}
              </div>
            </div>
            <div className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="jl-display text-lg font-semibold text-[var(--foreground)]">
                  {product.name}
                </h3>
                <span className="rounded-full bg-[var(--jl-crimson)] px-3 py-1 text-xs font-semibold text-[var(--jl-cream)] shadow-sm">
                  {formatCurrency(product.price)}
                </span>
              </div>
              <p className="text-sm text-[var(--jl-crimson)]/70">{product.description}</p>
              <div className="flex items-center justify-between text-xs text-[var(--jl-crimson)]/60">
                <span>
                  estoque: <strong className="text-[var(--jl-crimson-dark)]">{product.stock}</strong>
                </span>
                <Link href={`/product/${product.slug}`} className="underline">
                  detalhes
                </Link>
              </div>
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
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--jl-crimson)] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[var(--jl-crimson-dark)]"
              >
                Adicionar ao carrinho
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

'use client';

import Image from "next/image";
import { ProductDTO } from "@/types";
import { useCartStore } from "@/contexts/cart-context";
import { formatCurrency } from "@/lib/pricing";
import Link from "next/link";

export function ProductGrid({ products }: { products: ProductDTO[] }) {
  const { addItem } = useCartStore();
  const resolveImage = (image?: string | null) => {
    if (!image) return null;
    if (image.startsWith("http://") || image.startsWith("https://")) return image;
    if (image.startsWith("/")) return image;
    return null;
  };

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--jl-amber)]/60 bg-white/80 p-8 text-center text-sm text-[var(--jl-crimson)]">
        <p className="font-semibold text-[var(--jl-crimson-dark)]">Sem doces publicados ainda.</p>
        <p className="mt-2 text-[var(--jl-crimson)]/80">
          Assim que a dona adicionar receitas pelo painel, elas aparecem aqui automaticamente.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <article
          key={product.id}
          className="group relative overflow-hidden rounded-2xl border border-[var(--jl-cream)] bg-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
        >
          <div className="relative h-56 w-full overflow-hidden bg-[#fbe4c2]">
            {resolveImage(product.image) ? (
              <Image
                src={resolveImage(product.image)!}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-linear-to-br from-[#ffe2b0] to-[#ffd083] text-[var(--jl-crimson)]/60">
                sem foto
              </div>
            )}
            <div className="absolute left-3 top-3 rounded-full bg-[var(--jl-gold)] px-3 py-1 text-xs font-semibold text-[var(--jl-crimson)] shadow">
              {product.category ?? "doces"}
            </div>
          </div>
          <div className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">
                {product.name}
              </h3>
              <span className="rounded-full bg-[var(--jl-crimson)] px-3 py-1 text-xs font-semibold text-[var(--jl-cream)]">
                {formatCurrency(product.price)}
              </span>
            </div>
            <p className="text-sm text-slate-600">{product.description}</p>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                estoque:{" "}
                <strong className="text-slate-700">{product.stock}</strong>
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--jl-crimson)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--jl-crimson-dark)]"
            >
              Adicionar ao carrinho
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

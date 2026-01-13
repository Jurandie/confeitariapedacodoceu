import Image from "next/image";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/server/storefront-data";
import { formatCurrency } from "@/lib/pricing";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { resolveProductImage } from "@/lib/images";

type Props = {
  params: { slug: string };
};

export default async function ProductPage({ params }: Props) {
  const slugParam = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  if (!slugParam) return notFound();

  const product = await getProductBySlug(slugParam);
  const imageSrc = resolveProductImage(product?.image);

  if (!product) return notFound();

  return (
    <div className="jl-paper grid gap-8 rounded-3xl p-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="relative h-80 w-full overflow-hidden rounded-2xl border border-[var(--jl-amber)]/40 bg-[var(--jl-sand)]">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--jl-crimson)]/70">
            Sem imagem
          </div>
        )}
      </div>
      <div className="space-y-4">
        <p className="jl-pill inline-flex items-center border-[var(--jl-amber)]/50 bg-[var(--jl-cream)] px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--jl-crimson)]">
          {product.category ?? "geral"}
        </p>
        <h1 className="jl-display text-3xl font-semibold text-[var(--foreground)]">{product.name}</h1>
        <p className="text-sm text-[var(--jl-crimson)]/70">{product.description}</p>
        <div className="flex items-center gap-4">
          <span className="jl-pill rounded-full bg-[var(--jl-gold)] px-4 py-2 text-lg font-semibold text-[var(--jl-crimson-dark)]">
            {formatCurrency(product.price)}
          </span>
          <span className="text-sm text-[var(--jl-crimson)]/70">Estoque: {product.stock}</span>
        </div>
        <AddToCartButton product={product} />
      </div>
    </div>
  );
}

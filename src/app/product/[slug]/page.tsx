import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/pricing";
import { AddToCartButton } from "@/components/add-to-cart-button";

type Props = {
  params: { slug: string };
};

export default async function ProductPage({ params }: Props) {
  const slugParam = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  if (!slugParam) return notFound();

  const product = await prisma.product.findUnique({
    where: { slug: slugParam },
  });

  if (!product) return notFound();

  return (
    <div className="grid gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[1.2fr_1fr]">
      <div className="relative h-80 w-full overflow-hidden rounded-2xl bg-slate-50">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-500">
            Sem imagem
          </div>
        )}
      </div>
      <div className="space-y-4">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
          {product.category ?? "geral"}
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">{product.name}</h1>
        <p className="text-sm text-slate-600">{product.description}</p>
        <div className="flex items-center gap-4">
          <span className="rounded-full bg-slate-100 px-4 py-2 text-lg font-semibold text-slate-900">
            {formatCurrency(product.price)}
          </span>
          <span className="text-sm text-slate-600">Estoque: {product.stock}</span>
        </div>
        <AddToCartButton product={product} />
      </div>
    </div>
  );
}

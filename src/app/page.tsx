import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { ProductGrid } from "@/components/product-grid";
import { OwnerPanel } from "@/components/owner-panel";

export default async function Home() {
  const [products, siteConfig] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: "asc" } }),
    prisma.siteConfig.findFirst(),
  ]);

  const heroTitle =
    siteConfig?.heroTitle ??
    "JLsaborperfeito e um playground acucarado para uma confeiteira digital.";
  const heroDescription =
    siteConfig?.heroDescription ??
    "Aqui a vitrine virtual recebe receitas fresquinhas: cupcakes florais, brigadeiros gourmet e tortas de festa. O painel da dona funciona como o caderno de receitas que nunca fecha -- crie lotes, ajuste precos e publique fotos direto da cozinha.";
  const heroBadge = siteConfig?.heroBadge ?? "vitrine artesanal + checkout";
  const panelTopTitle = siteConfig?.heroPanelTopTitle ?? "Jornal da cozinha";
  const panelTopDescription =
    siteConfig?.heroPanelTopDescription ??
    "Receitas novas, ajustes de preco e fotos atualizadas direto da cozinha da JL.";
  const panelBottomTitle = siteConfig?.heroPanelBottomTitle ?? "Panelinha da JL";
  const panelBottomDescription =
    siteConfig?.heroPanelBottomDescription ??
    "Dashboard com relatorio de estoque, doces mais pedidos e campanhas de frete gratuito. Tudo pronto para registrar novas delicias.";
  const panelFooter =
    siteConfig?.heroPanelFooter ??
    "Replique cenarios reais de confeitaria sem precisar de Stripe real. Ideal para apresentar jornadas completas e pontos de personalizacao para clientes gulosos.";

  return (
    <div className="space-y-12">
      <section className="overflow-hidden rounded-3xl bg-linear-to-r from-[var(--jl-crimson-dark)] via-[var(--jl-crimson)] to-[#b5261a] px-10 py-12 text-white shadow-xl shadow-[rgba(47,4,4,0.4)]">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-4">
            <p className="text-sm uppercase tracking-[0.2em] text-white/70">doces autorais</p>
            <h1 className="text-4xl font-semibold leading-tight">{heroTitle}</h1>
            <p className="text-white/90">{heroDescription}</p>
            <span className="inline-block rounded-full bg-[var(--jl-gold)] px-4 py-1 text-sm font-semibold text-[var(--jl-crimson)]">
              {heroBadge}
            </span>
            <div className="flex flex-wrap gap-3 text-sm font-semibold">
              <Link
                href="/cart"
                className="rounded-full bg-[var(--jl-gold)] px-4 py-2 text-[var(--jl-crimson)] transition hover:bg-[#ffd76b]"
              >
                Abrir carrinho
              </Link>
              <Link
                href="/orders"
                className="rounded-full border border-white/40 px-4 py-2 text-white transition hover:border-[var(--jl-gold)]"
              >
                Ver pedidos
              </Link>
              <a
                href="#painel-da-dona"
                className="rounded-full border border-white/40 px-4 py-2 text-white transition hover:border-[var(--jl-gold)]"
              >
                Ir para painel
              </a>
            </div>
          </div>
          <div className="relative flex w-full max-w-md flex-col gap-4 rounded-2xl bg-white/10 p-6 backdrop-blur">
            <div className="absolute -left-12 -top-20 h-48 w-48 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute -right-8 bottom-0 h-32 w-32 rounded-full bg-amber-200/40 blur-3xl" />
            <div className="relative space-y-3 text-sm text-white/90">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.3em] text-white/60">painel</span>
              </div>
              <div className="flex items-center gap-4 rounded-2xl bg-white/90 p-4 text-[var(--jl-crimson)] shadow-xl shadow-[rgba(47,4,4,0.25)]">
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-[#fbe4c2]">
                  <Image
                    src="/products/brigadeiro.png"
                    alt="Brigadeiros decorativos"
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-[var(--jl-crimson-dark)]">{panelTopTitle}</p>
                  <p className="text-xs text-[var(--jl-crimson)]/70">{panelTopDescription}</p>
                </div>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-[#ffe9c1] to-[#ffd59b] p-4 text-sm text-[var(--jl-crimson-dark)] shadow-lg">
                <p className="font-semibold">{panelBottomTitle}</p>
                <p className="text-xs text-[var(--jl-crimson)]/80">{panelBottomDescription}</p>
              </div>
              <p className="text-xs text-white/80">{panelFooter}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--jl-crimson)]/70">Cardapio</p>
            <h2 className="text-2xl font-semibold text-slate-900">Doces disponiveis</h2>
          </div>
          <Link
            href="/checkout"
            className="rounded-full bg-[var(--jl-crimson)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--jl-crimson-dark)]"
          >
            Ir para checkout
          </Link>
        </div>
        <ProductGrid products={products} />
      </section>

      <OwnerPanel
        initialProducts={products}
        initialHeroCopy={{
          heroTitle,
          heroDescription,
          heroBadge,
          heroPanelTopTitle: panelTopTitle,
          heroPanelTopDescription: panelTopDescription,
          heroPanelBottomTitle: panelBottomTitle,
          heroPanelBottomDescription: panelBottomDescription,
          heroPanelFooter: panelFooter,
        }}
      />
    </div>
  );
}

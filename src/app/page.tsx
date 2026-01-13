import Link from "next/link";
import Image from "next/image";
import { listProducts, getSiteConfig } from "@/lib/server/storefront-data";
import { ProductGrid } from "@/components/product-grid";
import { OwnerPanel } from "@/components/owner-panel";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [products, siteConfig] = await Promise.all([listProducts(), getSiteConfig()]);

  const heroTitle =
    siteConfig?.heroTitle ??
    "Confeitaria Pedaço Do Céu e um playground acucarado para uma confeiteira digital.";
  const heroDescription =
    siteConfig?.heroDescription ??
    "Aqui a vitrine virtual recebe receitas fresquinhas: cupcakes florais, brigadeiros gourmet e tortas de festa. O painel da dona funciona como o caderno de receitas que nunca fecha -- crie lotes, ajuste precos e publique fotos direto da cozinha.";
  const heroBadge = siteConfig?.heroBadge ?? "vitrine artesanal + finalizar pedido";
  const panelTopTitle = siteConfig?.heroPanelTopTitle ?? "Jornal da cozinha";
  const panelTopDescription =
    siteConfig?.heroPanelTopDescription ??
    "Receitas novas, ajustes de preco e fotos atualizadas direto da cozinha da Confeitaria Pedaço Do Céu.";
  const panelBottomTitle =
    siteConfig?.heroPanelBottomTitle ?? "Panelinha da Confeitaria Pedaço Do Céu";
  const panelBottomDescription =
    siteConfig?.heroPanelBottomDescription ??
    "Dashboard com relatorio de estoque, doces mais pedidos e campanhas de novos sabores. Tudo pronto para registrar novas delicias.";
  const panelFooter =
    siteConfig?.heroPanelFooter ??
    "Replique cenarios reais de confeitaria sem precisar de Stripe real. Ideal para apresentar jornadas completas e pontos de personalizacao para clientes gulosos.";

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-r from-[var(--jl-crimson-dark)] via-[var(--jl-crimson)] to-[var(--jl-crimson-light)] px-10 pb-12 pt-16 text-white shadow-xl shadow-[rgba(74,42,29,0.35)]">
        <div aria-hidden="true" className="jl-scallop-band absolute inset-x-0 top-0 h-10 opacity-90" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-10 -bottom-12 h-28 w-28 rotate-12 jl-stamp opacity-35"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-10 top-16 h-24 w-24 rounded-full border-2 border-dotted border-white/40"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-6 bottom-10 h-14 w-14 rounded-full border border-dashed border-white/30"
        />
        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-4 jl-reveal">
            <p className="jl-pill inline-flex items-center border-white/40 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              doces autorais
            </p>
            <h1 className="jl-display text-4xl font-semibold leading-tight sm:text-5xl">
              {heroTitle}
            </h1>
            <p className="text-white/90">{heroDescription}</p>
            <span className="jl-pill inline-flex items-center border-2 border-dotted border-[var(--jl-cream)]/70 bg-[var(--jl-gold)] px-4 py-1 text-sm font-semibold text-[var(--jl-crimson)] shadow-sm">
              {heroBadge}
            </span>
            <div className="flex flex-wrap gap-3 text-sm font-semibold">
              <Link
                href="/cart"
                className="rounded-full bg-[var(--jl-gold)] px-4 py-2 text-[var(--jl-crimson)] shadow-lg shadow-[rgba(74,42,29,0.25)] transition hover:bg-[var(--jl-amber)]"
              >
                Abrir carrinho
              </Link>
              <a
                href="#painel-da-dona"
                className="rounded-full border border-white/40 px-4 py-2 text-white transition hover:border-[var(--jl-gold)]"
              >
                Ir para painel
              </a>
            </div>
          </div>
          <div className="relative flex w-full max-w-md flex-col gap-4 rounded-3xl p-6 text-[var(--jl-crimson)] jl-paper jl-reveal">
            <div className="absolute -left-10 -top-16 h-32 w-32 rounded-full bg-[var(--jl-rose)]/70 blur-3xl jl-float-slow" />
            <div className="absolute -right-8 bottom-0 h-24 w-24 rounded-full bg-[var(--jl-gold)]/70 blur-3xl jl-float-medium" />
            <div className="relative space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.3em] text-[var(--jl-crimson)]/60">painel</span>
              </div>
              <div className="flex items-center gap-4 rounded-2xl border border-[var(--jl-amber)]/40 bg-[var(--jl-ivory)] p-4 shadow-md">
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-[var(--jl-sand)]">
                  <Image
                    src="/products/brigadeiro.png"
                    alt="Brigadeiros decorativos"
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div className="space-y-1">
                  <p className="jl-display font-semibold text-[var(--jl-crimson-dark)]">{panelTopTitle}</p>
                  <p className="text-xs text-[var(--jl-crimson)]/70">{panelTopDescription}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--jl-amber)]/40 bg-[var(--jl-ivory)] p-4 text-sm text-[var(--jl-crimson-dark)] shadow-md">
                <p className="jl-display font-semibold">{panelBottomTitle}</p>
                <p className="text-xs text-[var(--jl-crimson)]/80">{panelBottomDescription}</p>
              </div>
              <p className="text-xs text-[var(--jl-crimson)]/70">{panelFooter}</p>
            </div>
          </div>
        </div>
      </section>

      <div aria-hidden="true" className="h-5 w-full jl-wave-divider opacity-60" />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="jl-pill inline-flex items-center border-[var(--jl-amber)]/50 bg-[var(--jl-cream)] px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--jl-crimson)] shadow-sm">
              Cardapio
            </p>
            <h2 className="jl-display text-2xl font-semibold text-[var(--foreground)]">Doces disponiveis</h2>
            <div aria-hidden="true" className="mt-2 h-2 w-24 jl-dotted-divider opacity-70" />
          </div>
          <Link
            href="/checkout"
            className="rounded-full bg-[var(--jl-crimson)] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[rgba(74,42,29,0.25)] transition hover:bg-[var(--jl-crimson-dark)]"
          >
            Ir para finalizar pedido
          </Link>
        </div>
        <div className="rounded-3xl p-6 jl-paper jl-reveal">
          <ProductGrid products={products} />
        </div>
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

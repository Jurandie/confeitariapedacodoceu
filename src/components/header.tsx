'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCartTotals } from "@/contexts/cart-context";
import { formatCurrency, FREE_SHIPPING_FROM } from "@/lib/pricing";
import { useAuth } from "@/contexts/auth-context";

const DEFAULT_BADGE = "vitrine artesanal + checkout";

export function Header() {
  const { itemCount, subtotal } = useCartTotals();
  const progress = Math.min(subtotal / FREE_SHIPPING_FROM, 1);
  const { status, owner, logout } = useAuth();
  const isOwnerOnline = status === "authenticated" && owner;
  const ownerFirstName = owner?.name?.split(" ")[0] ?? "dona";
  const [heroBadge, setHeroBadge] = useState(DEFAULT_BADGE);

  useEffect(() => {
    let active = true;

    async function loadBadge() {
      try {
        const res = await fetch("/api/site-config");
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        setHeroBadge(data?.heroBadge ?? DEFAULT_BADGE);
      } catch {
        /* ignore fetch errors */
      }
    }

    loadBadge();

    const handleUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ heroBadge?: string }>).detail;
      if (detail?.heroBadge) {
        setHeroBadge(detail.heroBadge);
      }
    };

    window.addEventListener("site-config:update", handleUpdate);
    return () => {
      active = false;
      window.removeEventListener("site-config:update", handleUpdate);
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-white/20 bg-[var(--jl-crimson)] px-6 py-4 text-[var(--jl-cream)] shadow-lg shadow-[rgba(47,4,4,0.4)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-semibold tracking-tight text-[var(--jl-cream)]">
              JLsaborperfeito
            </Link>
            <span className="rounded-full bg-[var(--jl-gold)]/80 px-3 py-1 text-xs font-semibold text-[var(--jl-crimson)]">
              {heroBadge}
            </span>
          </div>
          <nav className="flex flex-wrap items-center gap-3 text-sm font-medium">
            <Link href="/" className="transition hover:text-[var(--jl-gold)]">
              Catalogo
            </Link>
            <Link href="/cart" className="transition hover:text-[var(--jl-gold)]">
              Carrinho
            </Link>
            <Link href="/checkout" className="transition hover:text-[var(--jl-gold)]">
              Checkout
            </Link>
            <Link href="/orders" className="transition hover:text-[var(--jl-gold)]">
              Pedidos
            </Link>
            <a href="#painel-da-dona" className="transition hover:text-[var(--jl-gold)]">
              Painel da dona
            </a>
            {isOwnerOnline ? (
              <button
                type="button"
                onClick={() => logout()}
                className="rounded-full bg-[var(--jl-gold)] px-3 py-1 text-xs font-semibold text-[var(--jl-crimson)] transition hover:bg-[#ffd76b]"
              >
                {ownerFirstName} logada
              </button>
            ) : (
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs text-white/80">
                login no painel
              </span>
            )}
            <Link
              href="/cart"
              className="flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs"
            >
              <span className="rounded bg-white px-2 py-0.5 text-[var(--jl-crimson)]">{itemCount}</span>
              <span className="font-semibold text-[var(--jl-cream)]">{formatCurrency(subtotal)}</span>
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/80">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full bg-[var(--jl-gold)] transition-all"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <span className="font-semibold text-[var(--jl-cream)]">
            Brinde doce: frete gratis em {formatCurrency(FREE_SHIPPING_FROM)} (
            {formatCurrency(Math.max(FREE_SHIPPING_FROM - subtotal, 0))} restantes)
          </span>
        </div>
      </div>
    </header>
  );
}

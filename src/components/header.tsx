'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCartTotals } from "@/contexts/cart-context";
import { formatCurrency } from "@/lib/pricing";
import { useAuth } from "@/contexts/auth-context";

const DEFAULT_BADGE = "vitrine artesanal + finalizar pedido";

export function Header() {
  const { itemCount, subtotal } = useCartTotals();
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
        const data = (await res.json().catch(() => ({}))) as { heroBadge?: string };
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
    <header className="sticky top-0 z-20 border-b border-[var(--jl-amber)]/50 bg-[var(--jl-ivory)]/95 px-6 py-4 text-[var(--jl-crimson)] shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="jl-display text-xl font-semibold tracking-tight text-[var(--jl-crimson)]">
              Confeitaria Pedaço Do Céu
            </Link>
            <span className="jl-pill rounded-full border-dotted border-[var(--jl-amber)]/70 bg-[var(--jl-cream)] px-3 py-1 text-xs font-semibold text-[var(--jl-crimson)]">
              {heroBadge}
            </span>
          </div>
          <nav className="flex flex-wrap items-center gap-3 text-sm font-medium">
            <Link href="/" className="transition hover:text-[var(--jl-crimson-dark)]">
              Catalogo
            </Link>
            <Link href="/cart" className="transition hover:text-[var(--jl-crimson-dark)]">
              Carrinho
            </Link>
            <Link href="/checkout" className="transition hover:text-[var(--jl-crimson-dark)]">
              Finalizar pedido
            </Link>
            <a href="#painel-da-dona" className="transition hover:text-[var(--jl-crimson-dark)]">
              Painel da dona
            </a>
            {isOwnerOnline ? (
              <button
                type="button"
                onClick={() => logout()}
                className="jl-pill rounded-full border-[var(--jl-amber)]/70 bg-[var(--jl-gold)] px-3 py-1 text-xs font-semibold text-[var(--jl-crimson)] transition hover:bg-[var(--jl-amber)]"
              >
                {ownerFirstName} logada
              </button>
            ) : (
              <span className="jl-pill rounded-full border-[var(--jl-amber)]/50 bg-[var(--jl-ivory)]/80 px-3 py-1 text-xs text-[var(--jl-crimson)]/70">
                login no painel
              </span>
            )}
            <Link
              href="/cart"
              className="jl-pill flex items-center gap-2 rounded-full border-[var(--jl-amber)]/50 bg-[var(--jl-ivory)]/80 px-3 py-1 text-xs"
            >
              <span className="rounded bg-[var(--jl-gold)] px-2 py-0.5 text-[var(--jl-crimson)]">
                {itemCount}
              </span>
              <span className="font-semibold text-[var(--jl-crimson)]">{formatCurrency(subtotal)}</span>
            </Link>
          </nav>
        </div>
        <div aria-hidden="true" className="h-2 jl-dotted-divider opacity-35" />
      </div>
    </header>
  );
}

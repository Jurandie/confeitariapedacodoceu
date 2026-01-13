'use client';

import Link from "next/link";
import { useCartStore, useCartTotals } from "@/contexts/cart-context";
import { formatCurrency } from "@/lib/pricing";

export default function CartPage() {
  const { items, removeItem, updateQuantity } = useCartStore();
  const totals = useCartTotals();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="jl-pill inline-flex items-center border-[var(--jl-amber)]/50 bg-[var(--jl-cream)] px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--jl-crimson)]">
            Carrinho
          </p>
          <h1 className="jl-display text-3xl font-semibold text-[var(--foreground)]">
            Itens selecionados ({totals.itemCount})
          </h1>
        </div>
        <Link
          href="/checkout"
          className="rounded-full bg-[var(--jl-crimson-dark)] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[rgba(74,42,29,0.2)] transition hover:bg-[var(--jl-crimson)]"
        >
          Ir para finalizar pedido
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="jl-paper jl-reveal rounded-2xl border border-dashed border-[var(--jl-amber)]/50 p-8 text-center text-[var(--jl-crimson)]/70">
          Carrinho vazio. Escolha produtos no catálogo.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.productId}
                className="jl-paper flex items-start justify-between gap-4 rounded-2xl p-4"
              >
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">{item.name}</h3>
                  <p className="text-sm text-[var(--jl-crimson)]/70">{formatCurrency(item.price)}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="rounded-lg border border-[var(--jl-amber)]/50 bg-[var(--jl-ivory)] px-2 py-1 text-sm"
                    >
                      -
                    </button>
                    <span className="text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="rounded-lg border border-[var(--jl-amber)]/50 bg-[var(--jl-ivory)] px-2 py-1 text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3 text-sm">
                  <span className="font-semibold text-[var(--foreground)]">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-[var(--jl-crimson-light)] underline"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>

          <aside className="jl-paper space-y-4 rounded-2xl p-4">
            <h2 className="jl-display text-lg font-semibold text-[var(--foreground)]">Resumo</h2>
            <div className="space-y-2 text-sm text-[var(--jl-crimson)]/70">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-[var(--foreground)]">
                  {formatCurrency(totals.subtotal)}
                </span>
              </div>
              <hr />
              <div className="flex justify-between text-base">
                <span>Total</span>
                <span className="font-semibold text-[var(--foreground)]">
                  {formatCurrency(totals.total)}
                </span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="flex w-full items-center justify-center rounded-full bg-[var(--jl-crimson)] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[var(--jl-crimson-dark)]"
            >
              Finalizar pedido
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}

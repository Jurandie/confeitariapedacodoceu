'use client';

import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useCartStore, useCartTotals } from "@/contexts/cart-context";
import { formatCurrency } from "@/lib/pricing";

const DEFAULT_WHATSAPP = "5599999999999";

export default function CheckoutPage() {
  const { items, clear } = useCartStore();
  const totals = useCartTotals();
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const ownerWhatsApp = useMemo(() => {
    const raw = (process.env.NEXT_PUBLIC_OWNER_WHATSAPP ?? DEFAULT_WHATSAPP).replace(
      /\D/g,
      "",
    );
    const normalized = raw.replace(/^0+/, "");
    return normalized.startsWith("55") ? normalized : `55${normalized}`;
  }, []);

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      setStatus(null);
      if (!items.length) throw new Error("Carrinho vazio");
      const lines = items.map(
        (item) =>
          `${item.quantity}x ${item.name} - ${formatCurrency(item.price * item.quantity)}`,
      );
      const text = `Nome: ${name || "Cliente"}\n\nItens:\n${lines.join("\n")}\n\nTotal: ${formatCurrency(totals.total)}`;
      const url = `https://wa.me/${ownerWhatsApp}?text=${encodeURIComponent(text)}`;
      const opened = window.open(url, "_blank");
      if (!opened) {
        window.location.href = url;
      }
      clear();
      return { url };
    },
    onSuccess: () => {
      setStatus("Pedido enviado para o WhatsApp da dona.");
    },
    onError: (error: unknown) => {
      setStatus(error instanceof Error ? error.message : "Erro ao enviar para o WhatsApp");
    },
  });

  if (!items.length) {
    return (
      <div className="jl-paper jl-reveal rounded-2xl border border-dashed border-[var(--jl-amber)]/50 p-8 text-center text-[var(--jl-crimson)]/70">
        Carrinho vazio. <Link href="/">Voltar ao catálogo</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-6">
        <div>
          <p className="jl-pill inline-flex items-center border-[var(--jl-amber)]/50 bg-[var(--jl-cream)] px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--jl-crimson)]">
            Finalizar pedido
          </p>
          <h1 className="jl-display text-3xl font-semibold text-[var(--foreground)]">Finalizar compra</h1>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-semibold text-[var(--jl-crimson-dark)]">Nome</label>
          <input
            className="w-full rounded-xl border border-[var(--jl-amber)] bg-[var(--jl-ivory)] px-3 py-2 text-sm focus:border-[var(--jl-crimson-light)] focus:outline-none"
            placeholder="Nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="jl-paper rounded-2xl p-4">
          <h2 className="jl-display text-lg font-semibold text-[var(--foreground)]">Itens ({totals.itemCount})</h2>
          <ul className="mt-3 space-y-2 text-sm text-[var(--jl-crimson)]/80">
            {items.map((item) => (
              <li key={item.productId} className="flex justify-between">
                <span>
                  {item.quantity}x {item.name}
                </span>
                <span className="font-semibold">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <button
          disabled={checkoutMutation.isPending}
          onClick={() => checkoutMutation.mutate()}
          className="w-full rounded-full bg-[var(--jl-crimson)] px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[var(--jl-crimson-dark)] disabled:opacity-60"
        >
          {checkoutMutation.isPending ? "Processando..." : "Enviar resumo no WhatsApp"}
        </button>
        {status && <p className="text-sm text-[var(--jl-crimson)]/70">{status}</p>}
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
        <p className="text-xs text-[var(--jl-crimson)]/70">
          Ao confirmar, abriremos o WhatsApp da dona com os itens e o total. O pagamento é
          combinado diretamente pelo WhatsApp.
        </p>
      </aside>
    </div>
  );
}

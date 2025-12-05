'use client';

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useCartStore, useCartTotals } from "@/contexts/cart-context";
import { formatCurrency } from "@/lib/pricing";
import { createOrder, startCheckout } from "@/lib/client-api";

export default function CheckoutPage() {
  const { items, couponCode, coupon, clear } = useCartStore();
  const totals = useCartTotals();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      setStatus(null);
      if (!items.length) throw new Error("Carrinho vazio");
      if (!email) throw new Error("Informe seu email");

      const checkout = await startCheckout(items, couponCode, email);
      const result = await createOrder({
        customerEmail: email,
        customerName: name,
        couponCode: couponCode,
        paymentIntentId: checkout.paymentIntentId,
        items,
      });
      clear();
      return { checkout, order: result.order };
    },
    onSuccess: ({ checkout, order }) => {
      setStatus(
        `Pedido ${order.id} salvo. Checkout ${
          checkout.mode === "mock" ? "simulado" : "Stripe"
        } pronto.`,
      );
    },
    onError: (error: unknown) => {
      setStatus(error instanceof Error ? error.message : "Erro ao pagar");
    },
  });

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
        Carrinho vazio. <Link href="/">Voltar ao catálogo</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
            Checkout
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Finalizar compra
          </h1>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-semibold text-slate-800">
            Nome
          </label>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            placeholder="Nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label className="block text-sm font-semibold text-slate-800">
            Email para recibo
          </label>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            placeholder="voce@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Itens ({totals.itemCount})
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
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
          {coupon && (
            <p className="mt-2 text-xs text-emerald-700">
              Cupom aplicado: {coupon.code} ({coupon.type})
            </p>
          )}
        </div>

        <button
          disabled={checkoutMutation.isPending}
          onClick={() => checkoutMutation.mutate()}
          className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
        >
          {checkoutMutation.isPending ? "Processando..." : "Confirmar e pagar (mock)"}
        </button>
        {status && <p className="text-sm text-slate-600">{status}</p>}
      </div>

      <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Resumo</h2>
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(totals.subtotal)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Frete</span>
            <span className="font-semibold text-slate-900">
              {totals.shipping === 0 ? "Grátis" : formatCurrency(totals.shipping)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Desconto</span>
            <span className="font-semibold text-emerald-600">
              -{formatCurrency(totals.discount)}
            </span>
          </div>
          <hr />
          <div className="flex justify-between text-base">
            <span>Total</span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(totals.total)}
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Checkout usa Stripe se a chave STRIPE_SECRET_KEY estiver presente.
          Caso contrário, retorna um client_secret mock, mas o pedido é sempre
          salvo.
        </p>
      </aside>
    </div>
  );
}

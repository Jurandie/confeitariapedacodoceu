'use client';

import Link from "next/link";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useCartStore, useCartTotals } from "@/contexts/cart-context";
import { formatCurrency } from "@/lib/pricing";
import { validateCoupon } from "@/lib/client-api";

export default function CartPage() {
  const { items, removeItem, updateQuantity, setCoupon } = useCartStore();
  const totals = useCartTotals();
  const [couponCode, setCouponCode] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const couponMutation = useMutation({
    mutationFn: async () => {
      setFeedback(null);
      return validateCoupon(couponCode.trim(), items);
    },
    onSuccess: (data) => {
      if (data.valid && data.coupon) {
        setCoupon(data.coupon, couponCode.trim().toUpperCase());
        setFeedback(`Cupom ${data.coupon.code} aplicado (${data.coupon.type})`);
      } else {
        setCoupon(null);
        setFeedback("Cupom não aplicável.");
      }
    },
    onError: () => {
      setCoupon(null);
      setFeedback("Erro ao validar cupom.");
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
            Carrinho
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Itens selecionados ({totals.itemCount})
          </h1>
        </div>
        <Link
          href="/checkout"
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Ir para checkout
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          Carrinho vazio. Escolha produtos no catálogo.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {item.name}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {formatCurrency(item.price)}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                    >
                      -
                    </button>
                    <span className="text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3 text-sm">
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-red-500 underline"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
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

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800">
                Cupom de desconto
              </label>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="BEMVINDO10"
                />
                <button
                  disabled={couponMutation.isPending}
                  onClick={() => couponMutation.mutate()}
                  className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
                >
                  Aplicar
                </button>
              </div>
              {feedback && <p className="text-xs text-slate-500">{feedback}</p>}
            </div>

            <Link
              href="/checkout"
              className="flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              Finalizar
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}

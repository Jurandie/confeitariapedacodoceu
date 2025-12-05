'use client';

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchOrders } from "@/lib/client-api";
import { formatCurrency } from "@/lib/pricing";

export default function OrdersPage() {
  const [email, setEmail] = useState("");
  const { data, refetch, isFetching } = useQuery({
    queryKey: ["orders", email],
    queryFn: () => fetchOrders(email),
    enabled: false,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
            Histórico
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Pedidos por email
          </h1>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="text-sm font-semibold text-slate-800">
          Email usado no checkout
        </label>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
          />
          <button
            disabled={!email || isFetching}
            onClick={() => refetch()}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
          >
            Buscar
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {isFetching && <p className="text-sm text-slate-500">Carregando...</p>}
        {data?.length === 0 && (
          <p className="text-sm text-slate-500">Nenhum pedido encontrado.</p>
        )}
        {data?.map((order) => (
          <div
            key={order.id}
            className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between text-sm">
              <div className="space-y-1">
                <p className="font-semibold text-slate-900">Pedido {order.id}</p>
                <p className="text-slate-500">
                  {new Date(order.createdAt).toLocaleString("pt-BR")} · {order.status}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-slate-900">
                  {formatCurrency(order.total)}
                </p>
                {order.coupon && (
                  <p className="text-xs text-emerald-700">
                    Cupom: {order.coupon.code}
                  </p>
                )}
              </div>
            </div>
            <ul className="space-y-1 text-sm text-slate-700">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>
                    {item.quantity}x {item.product.name}
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

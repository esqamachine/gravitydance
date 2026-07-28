"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { formatMoney, formatDate, PAYMENT_STATUS_RU } from "@/lib/db";
import type { PaymentWithClient } from "@/lib/queries";

const statusStyle: Record<string, string> = {
  paid: "bg-green-500/15 text-green-400",
  pending: "bg-yellow-500/15 text-yellow-400",
  failed: "bg-pink/15 text-pink",
  refunded: "bg-white/10 text-muted",
};

export default function PaymentsList({
  payments,
}: {
  payments: PaymentWithClient[];
}) {
  const [q, setQ] = useState("");
  const filtered = q
    ? payments.filter((p) =>
        p.client_name.toLowerCase().includes(q.toLowerCase())
      )
    : payments;

  return (
    <div className="space-y-4">
      <div className="relative w-full sm:max-w-xs">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Фильтр по клиенту"
          className="w-full rounded-full border border-white/10 bg-surface py-2.5 pl-10 pr-4 font-body text-sm text-ink outline-none focus:border-primary"
        />
      </div>

      {/* Десктоп таблица */}
      <div className="hidden overflow-hidden rounded-2xl border border-white/10 md:block">
        <table className="w-full text-left">
          <thead className="bg-white/5 font-body text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-5 py-3">Клиент</th>
              <th className="px-5 py-3">Сумма</th>
              <th className="px-5 py-3">Описание</th>
              <th className="px-5 py-3">Дата</th>
              <th className="px-5 py-3">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 font-body text-sm">
            {filtered.map((p) => (
              <tr key={p.id} className="transition hover:bg-white/5">
                <td className="px-5 py-3 font-medium text-ink">
                  {p.client_name}
                </td>
                <td className="px-5 py-3 text-ink">{formatMoney(p.amount)}</td>
                <td className="px-5 py-3 text-muted">
                  {p.description || "Абонемент"}
                </td>
                <td className="px-5 py-3 text-muted">
                  {formatDate(p.created_at)}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      statusStyle[p.status]
                    }`}
                  >
                    {PAYMENT_STATUS_RU[p.status]}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-muted">
                  Платежей не найдено.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Мобильные карточки */}
      <div className="space-y-3 md:hidden">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl border border-white/10 bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-ink">
                {formatMoney(p.amount)}
              </span>
              <span
                className={`rounded-full px-3 py-1 font-body text-xs font-medium ${
                  statusStyle[p.status]
                }`}
              >
                {PAYMENT_STATUS_RU[p.status]}
              </span>
            </div>
            <p className="mt-1 font-body text-sm text-ink">{p.client_name}</p>
            <p className="font-body text-xs text-muted">
              {p.description || "Абонемент"} · {formatDate(p.created_at)}
            </p>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center font-body text-sm text-muted">
            Платежей не найдено.
          </p>
        )}
      </div>
    </div>
  );
}

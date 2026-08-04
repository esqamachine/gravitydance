"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Pencil,
  RefreshCw,
  Archive,
  ChevronDown,
  X,
  Loader2,
} from "lucide-react";
import { updatePayment, extendSubscription } from "@/app/admin/actions";
import { formatMoney, formatDate, PAYMENT_STATUS_RU } from "@/lib/db";
import type { PaymentWithClient } from "@/lib/queries";

const statusStyle: Record<string, string> = {
  paid: "bg-green-500/15 text-green-400",
  pending: "bg-yellow-500/15 text-yellow-400",
  failed: "bg-pink/15 text-pink",
  refunded: "bg-white/10 text-muted",
};

const MONTHS = [
  "январь",
  "февраль",
  "март",
  "апрель",
  "май",
  "июнь",
  "июль",
  "август",
  "сентябрь",
  "октябрь",
  "ноябрь",
  "декабрь",
];

export default function PaymentsList({
  payments,
}: {
  payments: PaymentWithClient[];
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<PaymentWithClient | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [openMonths, setOpenMonths] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const today = new Date().toISOString().slice(0, 10);
  const match = (p: PaymentWithClient) =>
    !q || p.client_name.toLowerCase().includes(q.toLowerCase());

  const active = payments.filter(
    (p) => match(p) && (!p.period_end || p.period_end >= today)
  );
  const archived = payments.filter(
    (p) => match(p) && p.period_end && p.period_end < today
  );

  // Архив по месяцам period_end (новые сверху)
  const monthsMap = new Map<string, PaymentWithClient[]>();
  for (const p of archived) {
    const key = (p.period_end as string).slice(0, 7); // YYYY-MM
    const arr = monthsMap.get(key) ?? [];
    arr.push(p);
    monthsMap.set(key, arr);
  }
  const months = Array.from(monthsMap.entries()).sort((a, b) =>
    b[0].localeCompare(a[0])
  );
  const monthLabel = (key: string) => {
    const [y, m] = key.split("-").map(Number);
    return `${MONTHS[m - 1]} ${y}`;
  };

  const extend = (id: string) =>
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      await extendSubscription(fd);
      router.refresh();
    });

  const toggleMonth = (key: string) =>
    setOpenMonths((s) => {
      const n = new Set(s);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });

  const Row = ({ p, expired }: { p: PaymentWithClient; expired?: boolean }) => (
    <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-heading font-bold text-ink">
            {formatMoney(p.amount)}
          </span>
          {expired ? (
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-body text-xs font-medium text-muted">
              Истёк
            </span>
          ) : (
            <span
              className={`rounded-full px-2.5 py-0.5 font-body text-xs font-medium ${statusStyle[p.status]}`}
            >
              {PAYMENT_STATUS_RU[p.status]}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate font-body text-sm text-ink">
          {p.client_name}
        </p>
        <p className="truncate font-body text-xs text-muted">
          {p.description || "Абонемент"} · {formatDate(p.created_at)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {!expired && p.status === "paid" && (
          <button
            onClick={() => extend(p.id)}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 font-body text-xs text-primary-light transition hover:border-primary/40 disabled:opacity-50"
          >
            <RefreshCw size={13} /> Продлить абонемент
          </button>
        )}
        <button
          onClick={() => setEdit(p)}
          aria-label="Редактировать платёж"
          className="rounded-full border border-white/10 p-1.5 text-muted transition hover:border-primary/40 hover:text-ink"
        >
          <Pencil size={14} />
        </button>
      </div>
    </div>
  );

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

      {/* Активные платежи */}
      {active.length === 0 ? (
        <p className="py-6 text-center font-body text-sm text-muted">
          Активных платежей нет.
        </p>
      ) : (
        <div className="space-y-3">
          {active.map((p) => (
            <Row key={p.id} p={p} />
          ))}
        </div>
      )}

      {/* Архив */}
      {archived.length > 0 && (
        <div>
          <button
            onClick={() => setShowArchive((v) => !v)}
            className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-card px-4 py-3 font-heading text-sm font-bold text-muted transition hover:border-primary/40"
          >
            <span className="flex items-center gap-2">
              <Archive size={16} /> Архив ({archived.length})
            </span>
            <ChevronDown
              size={18}
              className={`text-primary transition-transform ${showArchive ? "rotate-180" : ""}`}
            />
          </button>

          {showArchive && (
            <div className="mt-3 space-y-2">
              {months.map(([key, list]) => (
                <div
                  key={key}
                  className="overflow-hidden rounded-2xl border border-white/10"
                >
                  <button
                    onClick={() => toggleMonth(key)}
                    className="flex w-full items-center justify-between bg-white/5 px-4 py-2.5 font-body text-sm capitalize text-ink transition hover:bg-white/10"
                  >
                    <span>
                      {monthLabel(key)}{" "}
                      <span className="text-muted">· {list.length}</span>
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-muted transition-transform ${openMonths.has(key) ? "rotate-180" : ""}`}
                    />
                  </button>
                  {openMonths.has(key) && (
                    <div className="space-y-2 p-3">
                      {list.map((p) => (
                        <Row key={p.id} p={p} expired />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {edit && (
        <EditModal
          payment={edit}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function EditModal({
  payment,
  onClose,
  onSaved,
}: {
  payment: PaymentWithClient;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState(String(payment.amount));
  const [description, setDescription] = useState(payment.description ?? "");
  const [date, setDate] = useState(payment.created_at.slice(0, 10));
  const [paid, setPaid] = useState(payment.status === "paid");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      setError("");
      const fd = new FormData();
      fd.set("id", payment.id);
      fd.set("amount", amount);
      fd.set("description", description);
      fd.set("date", date);
      fd.set("status", paid ? "paid" : "pending");
      const res = await updatePayment(fd);
      if (res.ok === false) return setError(res.error || "Ошибка");
      onSaved();
    });

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="animate-pop-in my-4 w-full max-w-md space-y-3 rounded-[1.75rem] border border-white/10 bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg font-bold text-ink">
            Платёж · {payment.client_name}
          </h3>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="rounded-full p-1.5 text-muted hover:bg-white/5 hover:text-ink"
          >
            <X size={22} />
          </button>
        </div>

        <label className="block">
          <span className="mb-1 block font-body text-xs text-muted">Сумма, ₽</span>
          <input
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="admin-input"
          />
        </label>

        <label className="block">
          <span className="mb-1 block font-body text-xs text-muted">Описание</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Абонемент"
            className="admin-input"
          />
        </label>

        <label className="block">
          <span className="mb-1 block font-body text-xs text-muted">Дата</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="admin-input"
          />
        </label>

        <div>
          <span className="mb-1 block font-body text-xs text-muted">Статус</span>
          <button
            type="button"
            onClick={() => setPaid((v) => !v)}
            className={`w-full rounded-full px-4 py-2.5 font-heading text-sm font-bold transition ${
              paid ? "bg-green-500/20 text-green-300" : "bg-pink/20 text-pink"
            }`}
          >
            {paid ? "Оплачено" : "Не оплачено"}
          </button>
        </div>

        {error && (
          <p className="text-center font-body text-sm text-pink">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-white/10 px-6 py-3 font-heading text-sm font-semibold text-muted transition hover:text-ink"
          >
            Отмена
          </button>
          <button
            onClick={save}
            disabled={pending}
            className="btn-cta flex flex-1 items-center justify-center gap-2 px-6 py-3 font-heading text-sm font-bold disabled:opacity-50"
          >
            {pending ? <Loader2 size={16} className="animate-spin" /> : null}
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

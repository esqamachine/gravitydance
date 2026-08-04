"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Phone,
  Mail,
  CalendarDays,
  Plus,
  Trash2,
  UserMinus,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  enrollClient,
  unenrollClient,
  addManualPayment,
  excludeClient,
  getClientDetailAction,
  getClientJournalAction,
} from "@/app/admin/actions";
import {
  fullName,
  formatMoney,
  formatDate,
  PAYMENT_STATUS_RU,
  ATTENDANCE_RU,
  type Group,
  type Subgroup,
} from "@/lib/db";
import type { ClientDetail, JournalEntry } from "@/lib/queries";

const attStyle: Record<string, string> = {
  present: "bg-green-500/15 text-green-400",
  late: "bg-yellow-500/15 text-yellow-400",
  absent: "bg-pink/15 text-pink",
};

const statusStyle: Record<string, string> = {
  paid: "bg-green-500/15 text-green-400",
  pending: "bg-yellow-500/15 text-yellow-400",
  failed: "bg-pink/15 text-pink",
  refunded: "bg-white/10 text-muted",
};

export default function ClientDetailModal({
  detail: initial,
  groups,
  subgroupsByGroup,
  onClose,
}: {
  detail: ClientDetail;
  groups: Group[];
  subgroupsByGroup: Record<string, Subgroup[]>;
  onClose: () => void;
}) {
  const router = useRouter();
  const [detail, setDetail] = useState<ClientDetail>(initial);
  const [pending, startTransition] = useTransition();

  // форма добавления в группу
  const [participant, setParticipant] = useState(""); // "" = основной, иначе child_id
  const [groupId, setGroupId] = useState("");
  const [subgroupId, setSubgroupId] = useState("");
  // форма оплаты
  const [amount, setAmount] = useState("");
  // журнал посещений
  const [journal, setJournal] = useState<JournalEntry[] | null>(null);
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalLoading, setJournalLoading] = useState(false);

  const pid = detail.profile.id;
  const subOptions = groupId ? subgroupsByGroup[groupId] ?? [] : [];

  const refresh = async () => {
    const fresh = await getClientDetailAction(pid);
    if (fresh) setDetail(fresh);
    router.refresh();
  };

  const run = (fn: () => Promise<void>) => startTransition(() => void fn());

  const doEnroll = () =>
    run(async () => {
      if (!groupId) return;
      const fd = new FormData();
      fd.set("profile_id", pid);
      fd.set("group_id", groupId);
      if (subgroupId) fd.set("subgroup_id", subgroupId);
      if (participant) fd.set("child_id", participant);
      await enrollClient(fd);
      setGroupId("");
      setSubgroupId("");
      await refresh();
    });

  const doUnenroll = (cgId: string) =>
    run(async () => {
      const fd = new FormData();
      fd.set("cg_id", cgId);
      await unenrollClient(fd);
      await refresh();
    });

  const doPayment = () =>
    run(async () => {
      const num = Number(amount);
      if (!num || num <= 0) return;
      const fd = new FormData();
      fd.set("profile_id", pid);
      fd.set("amount", String(num));
      await addManualPayment(fd);
      setAmount("");
      await refresh();
    });

  const toggleJournal = async () => {
    const next = !journalOpen;
    setJournalOpen(next);
    if (next && journal === null) {
      setJournalLoading(true);
      const j = await getClientJournalAction(pid);
      setJournal(j);
      setJournalLoading(false);
    }
  };

  const doExclude = () => {
    if (!confirm("Вы уверены? Клиент будет убран из всех групп.")) return;
    run(async () => {
      const fd = new FormData();
      fd.set("profile_id", pid);
      await excludeClient(fd);
      await refresh();
      onClose();
    });
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="animate-pop-in my-4 w-full max-w-lg rounded-[1.75rem] border border-white/10 bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-gradient font-heading text-xl font-bold text-white">
              {detail.profile.first_name.charAt(0)}
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-ink">
                {fullName(detail.profile)}
              </h3>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-body text-xs font-medium ${
                  detail.paidThisMonth
                    ? "bg-green-500/15 text-green-400"
                    : "bg-pink/15 text-pink"
                }`}
              >
                {detail.paidThisMonth ? (
                  <CheckCircle2 size={12} />
                ) : (
                  <XCircle size={12} />
                )}
                {detail.paidThisMonth
                  ? "Оплачено в этом месяце"
                  : "Не оплачено"}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="shrink-0 rounded-full p-1.5 text-muted transition hover:bg-white/5 hover:text-ink"
          >
            <X size={22} />
          </button>
        </div>

        {/* Инфо */}
        <div className="mt-5 space-y-2 font-body text-sm">
          <div className="flex items-center gap-3 text-muted">
            <Phone size={15} className="text-primary" /> {detail.profile.phone}
          </div>
          <div className="flex items-center gap-3 text-muted">
            <Mail size={15} className="text-primary" />{" "}
            {detail.profile.email || "—"}
          </div>
          <div className="flex items-center gap-3 text-muted">
            <CalendarDays size={15} className="text-primary" /> Регистрация:{" "}
            {formatDate(detail.profile.created_at)}
          </div>
        </div>

        {/* Участник */}
        <section className="mt-6">
          <h4 className="mb-2 font-heading text-sm font-bold text-ink">
            Участник
          </h4>
          <select
            value={participant}
            onChange={(e) => setParticipant(e.target.value)}
            className="admin-input w-full"
          >
            <option value="">
              {fullName(detail.profile)} (основной)
            </option>
            {detail.children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name} (ребёнок)
              </option>
            ))}
          </select>
          <p className="mt-1.5 font-body text-xs text-muted">
            Выберите, кого записывать в группу ниже.
          </p>
        </section>

        {/* Группы */}
        <section className="mt-6">
          <h4 className="mb-2 font-heading text-sm font-bold text-ink">
            Группы
          </h4>
          {detail.enrolled.length === 0 ? (
            <p className="font-body text-sm text-muted">Не состоит в группах.</p>
          ) : (
            <ul className="space-y-2">
              {detail.enrolled.map((g) => (
                <li
                  key={g.cg_id}
                  className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2"
                >
                  <span className="font-body text-sm text-ink">
                    {g.group_name}
                    {g.subgroup_name && (
                      <span className="text-muted"> → {g.subgroup_name}</span>
                    )}
                    <span className="text-primary-light">
                      {" "}
                      ({g.participant_name ?? "основной"})
                    </span>
                  </span>
                  <button
                    onClick={() => doUnenroll(g.cg_id)}
                    disabled={pending}
                    aria-label="Убрать из группы"
                    className="rounded-full p-1.5 text-muted transition hover:bg-pink/10 hover:text-pink"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Добавить в группу */}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <select
              value={groupId}
              onChange={(e) => {
                setGroupId(e.target.value);
                setSubgroupId("");
              }}
              className="admin-input sm:flex-1"
            >
              <option value="">Группа…</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <select
              value={subgroupId}
              onChange={(e) => setSubgroupId(e.target.value)}
              disabled={!groupId || subOptions.length === 0}
              className="admin-input sm:flex-1 disabled:opacity-50"
            >
              <option value="">Подгруппа…</option>
              {subOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              onClick={doEnroll}
              disabled={pending || !groupId}
              className="btn-cta flex items-center justify-center gap-1.5 px-4 py-2.5 font-heading text-sm font-bold disabled:opacity-50"
            >
              <Plus size={16} /> В группу
            </button>
          </div>
        </section>

        {/* Оплата */}
        <section className="mt-6">
          <h4 className="mb-2 font-heading text-sm font-bold text-ink">Оплата</h4>
          <div className="mb-3 flex gap-2">
            <input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Сумма, ₽"
              className="admin-input flex-1"
            />
            <button
              onClick={doPayment}
              disabled={pending || !amount}
              className="btn-cta px-4 py-2.5 font-heading text-sm font-bold disabled:opacity-50"
            >
              Отметить оплату
            </button>
          </div>
          {detail.payments.length === 0 ? (
            <p className="font-body text-sm text-muted">Платежей нет.</p>
          ) : (
            <ul className="max-h-40 space-y-2 overflow-y-auto">
              {detail.payments.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2"
                >
                  <span className="font-body text-sm text-ink">
                    {formatMoney(p.amount)}
                    <span className="text-muted"> · {formatDate(p.created_at)}</span>
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-body text-xs font-medium ${statusStyle[p.status]}`}
                  >
                    {PAYMENT_STATUS_RU[p.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Посещения (кликабельно → журнал) */}
        <section className="mt-6">
          <button
            type="button"
            onClick={toggleJournal}
            className="grid w-full grid-cols-2 gap-3 rounded-xl text-left transition hover:opacity-90"
          >
            <div className="rounded-xl bg-white/5 p-3 text-center">
              <p className="font-heading text-xl font-bold text-ink">
                {detail.attendedThisMonth}
                <span className="text-muted">/{detail.totalThisMonth}</span>
              </p>
              <p className="font-body text-xs text-muted">
                Посещений в этом месяце
              </p>
            </div>
            <div className="rounded-xl bg-white/5 p-3 text-center">
              <p className="font-heading text-xl font-bold text-ink">
                {detail.attendedAllTime}
              </p>
              <p className="font-body text-xs text-muted">Всего посещений</p>
            </div>
          </button>
          <p className="mt-1.5 text-center font-body text-xs text-primary-light">
            {journalOpen ? "Скрыть журнал" : "Нажмите, чтобы открыть журнал"}
          </p>

          {journalOpen && (
            <div className="mt-3">
              {journalLoading ? (
                <p className="flex items-center justify-center gap-2 py-4 font-body text-sm text-muted">
                  <Loader2 size={14} className="animate-spin" /> Загрузка…
                </p>
              ) : journal && journal.length > 0 ? (
                <ul className="max-h-52 space-y-1.5 overflow-y-auto">
                  {journal.map((j) => (
                    <li
                      key={j.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2 font-body text-xs"
                    >
                      <span className="min-w-0 truncate text-ink">
                        {j.date ? formatDate(j.date) : "—"}
                        <span className="text-muted"> · {j.group_name}</span>
                        {j.participant !== "основной" && (
                          <span className="text-primary-light">
                            {" "}
                            · {j.participant}
                          </span>
                        )}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 font-medium ${attStyle[j.status]}`}
                      >
                        {ATTENDANCE_RU[j.status]}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-3 text-center font-body text-sm text-muted">
                  Отметок о посещениях пока нет.
                </p>
              )}
            </div>
          )}
        </section>

        {/* Действия */}
        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
          {pending && (
            <span className="flex items-center gap-2 font-body text-xs text-muted">
              <Loader2 size={14} className="animate-spin" /> Сохранение…
            </span>
          )}
          <button
            onClick={doExclude}
            disabled={pending}
            className="ml-auto flex items-center gap-2 rounded-full border border-pink/30 px-4 py-2 font-body text-sm text-pink transition hover:bg-pink/10 disabled:opacity-50"
          >
            <UserMinus size={16} /> Исключить
          </button>
        </div>
      </div>
    </div>
  );
}

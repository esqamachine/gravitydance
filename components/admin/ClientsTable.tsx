"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Search,
  UserPlus,
  X,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { addClient, getClientDetailAction } from "@/app/admin/actions";
import { fullName, type Group, type Subgroup } from "@/lib/db";
import type { ProfileRow, ClientDetail } from "@/lib/queries";
import ClientDetailModal from "./ClientDetailModal";

type SortKey = "name" | "phone" | "email" | "paid" | "created";

export default function ClientsTable({
  clients,
  groups,
  subgroupsByGroup,
}: {
  clients: ProfileRow[];
  groups: Group[];
  subgroupsByGroup: Record<string, Subgroup[]>;
}) {
  const [q, setQ] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [addOpen, setAddOpen] = useState(false);

  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const openClient = (id: string) => {
    setLoadingId(id);
    startTransition(async () => {
      const d = await getClientDetailAction(id);
      setDetail(d);
      setLoadingId(null);
    });
  };

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(k);
      setSortDir(1);
    }
  };

  const rows = useMemo(() => {
    const needle = q.toLowerCase();
    const digits = q.replace(/\D/g, "");
    let list = clients.filter((c) => {
      const matchesQ =
        !q ||
        fullName(c).toLowerCase().includes(needle) ||
        (c.email ?? "").toLowerCase().includes(needle) ||
        c.phone.replace(/\D/g, "").includes(digits || q);
      const matchesGroup =
        !groupFilter || c.enrolled.some((e) => e.group_name === groupFilter);
      return matchesQ && matchesGroup;
    });

    list = [...list].sort((a, b) => {
      let av: string | number = 0;
      let bv: string | number = 0;
      if (sortKey === "name") {
        av = fullName(a).toLowerCase();
        bv = fullName(b).toLowerCase();
      } else if (sortKey === "phone") {
        av = a.phone;
        bv = b.phone;
      } else if (sortKey === "email") {
        av = (a.email ?? "").toLowerCase();
        bv = (b.email ?? "").toLowerCase();
      } else if (sortKey === "paid") {
        av = a.paid_this_month ? 1 : 0;
        bv = b.paid_this_month ? 1 : 0;
      } else {
        av = a.created_at;
        bv = b.created_at;
      }
      if (av < bv) return -sortDir;
      if (av > bv) return sortDir;
      return 0;
    });
    return list;
  }, [clients, q, groupFilter, sortKey, sortDir]);

  const Th = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <th className="px-5 py-3">
      <button
        onClick={() => toggleSort(k)}
        className={`inline-flex items-center gap-1 transition hover:text-ink ${
          sortKey === k ? "text-ink" : ""
        }`}
      >
        {children}
        <ArrowUpDown size={12} />
      </button>
    </th>
  );

  const PaidBadge = ({ paid }: { paid: boolean }) =>
    paid ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-0.5 font-body text-xs font-medium text-green-400">
        <CheckCircle2 size={12} /> Оплачено
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full bg-pink/15 px-2.5 py-0.5 font-body text-xs font-medium text-pink">
        <XCircle size={12} /> Не оплачено
      </span>
    );

  const groupsCell = (c: ProfileRow) =>
    c.enrolled.length ? (
      <div className="flex flex-wrap gap-1">
        {c.enrolled.map((e) => (
          <span
            key={e.cg_id}
            className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary-light"
          >
            {e.group_name}
            {e.subgroup_name ? ` · ${e.subgroup_name}` : ""}
          </span>
        ))}
      </div>
    ) : (
      <span className="text-muted">—</span>
    );

  return (
    <div className="space-y-4">
      {/* Панель управления */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <div className="relative w-full sm:max-w-xs">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск: имя, телефон, email"
              className="w-full rounded-full border border-white/10 bg-surface py-2.5 pl-10 pr-4 font-body text-sm text-ink outline-none focus:border-primary"
            />
          </div>
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="rounded-full border border-white/10 bg-surface px-4 py-2.5 font-body text-sm text-ink outline-none focus:border-primary"
          >
            <option value="">Все группы</option>
            {groups.map((g) => (
              <option key={g.id} value={g.name}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="btn-cta inline-flex items-center justify-center gap-2 px-5 py-2.5 font-heading text-sm font-bold"
        >
          <UserPlus size={18} /> Добавить клиента
        </button>
      </div>

      {/* Десктоп — таблица */}
      <div className="hidden overflow-hidden rounded-2xl border border-white/10 md:block">
        <table className="w-full text-left">
          <thead className="bg-white/5 font-body text-xs uppercase tracking-wide text-muted">
            <tr>
              <Th k="name">ФИО</Th>
              <Th k="phone">Телефон</Th>
              <Th k="email">Email</Th>
              <th className="px-5 py-3">Группа</th>
              <Th k="paid">Оплата</Th>
              <Th k="created">Регистрация</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 font-body text-sm">
            {rows.map((c) => (
              <tr
                key={c.id}
                onClick={() => openClient(c.id)}
                className="cursor-pointer transition hover:bg-white/5"
              >
                <td className="px-5 py-3 font-medium text-ink">
                  <span className="flex items-center gap-2">
                    {fullName(c)}
                    {loadingId === c.id && (
                      <Loader2 size={14} className="animate-spin text-primary" />
                    )}
                  </span>
                </td>
                <td className="px-5 py-3 text-muted">{c.phone}</td>
                <td className="px-5 py-3 text-muted">{c.email || "—"}</td>
                <td className="px-5 py-3">{groupsCell(c)}</td>
                <td className="px-5 py-3">
                  <PaidBadge paid={c.paid_this_month} />
                </td>
                <td className="px-5 py-3 text-muted">
                  {new Date(c.created_at).toLocaleDateString("ru-RU")}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-muted">
                  Ничего не найдено.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Мобильный — карточки */}
      <div className="space-y-3 md:hidden">
        {rows.map((c) => (
          <button
            key={c.id}
            onClick={() => openClient(c.id)}
            className="w-full rounded-2xl border border-white/10 bg-card p-4 text-left transition hover:border-primary/30"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-heading font-bold text-ink">
                {fullName(c)}
              </span>
              <PaidBadge paid={c.paid_this_month} />
            </div>
            <p className="mt-1 font-body text-sm text-muted">{c.phone}</p>
            {c.email && (
              <p className="font-body text-xs text-muted">{c.email}</p>
            )}
            <div className="mt-2">{groupsCell(c)}</div>
          </button>
        ))}
        {rows.length === 0 && (
          <p className="py-8 text-center font-body text-sm text-muted">
            Ничего не найдено.
          </p>
        )}
      </div>

      {/* Модалка добавления клиента */}
      {addOpen && (
        <div
          className="fixed inset-0 z-[60] flex justify-center overflow-y-auto bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setAddOpen(false)}
        >
          <div
            className="animate-pop-in min-h-full w-full bg-card p-5 shadow-2xl sm:my-4 sm:min-h-0 sm:max-w-md sm:rounded-[1.75rem] sm:border sm:border-white/10 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg font-bold text-ink">
                Новый клиент
              </h3>
              <button
                onClick={() => setAddOpen(false)}
                aria-label="Закрыть"
                className="rounded-full p-1.5 text-muted hover:bg-white/5 hover:text-ink"
              >
                <X size={22} />
              </button>
            </div>
            <form
              action={addClient}
              onSubmit={() => setTimeout(() => setAddOpen(false), 50)}
              className="mt-4 space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="last_name"
                  required
                  placeholder="Фамилия"
                  className="admin-input"
                />
                <input
                  name="first_name"
                  required
                  placeholder="Имя"
                  className="admin-input"
                />
              </div>
              <input
                name="patronymic"
                placeholder="Отчество"
                className="admin-input"
              />
              <input
                name="phone"
                required
                placeholder="Телефон +7…"
                className="admin-input"
              />
              <input
                name="email"
                type="email"
                placeholder="Email (необязательно)"
                className="admin-input"
              />
              <select name="group_id" className="admin-input" defaultValue="">
                <option value="">Без группы</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="btn-cta w-full px-6 py-3 font-heading font-bold"
              >
                Добавить
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Модалка детали клиента */}
      {detail && (
        <ClientDetailModal
          detail={detail}
          groups={groups}
          subgroupsByGroup={subgroupsByGroup}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}

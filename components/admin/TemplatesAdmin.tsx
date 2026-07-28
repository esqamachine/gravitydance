"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, CalendarClock } from "lucide-react";
import { saveTemplate, deleteTemplate } from "@/app/admin/actions";
import { coaches } from "@/lib/coaches";
import { DOW_RU, type Group, type Subgroup } from "@/lib/db";
import type { TemplateRow } from "@/lib/queries";

const TIME_SLOTS: string[] = (() => {
  const s: string[] = [];
  for (let m = 9 * 60; m <= 21 * 60; m += 15)
    s.push(
      `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(
        2,
        "0"
      )}`
    );
  return s;
})();

const empty = {
  id: "",
  name: "",
  day_of_week: 1,
  start_time: "17:00",
  end_time: "18:00",
  group_id: "",
  subgroup_id: "",
  coach: "",
};
type Draft = typeof empty;

const hm = (t: string) => t.slice(0, 5);

export default function TemplatesAdmin({
  templates,
  groups,
  subgroupsByGroup,
}: {
  templates: TemplateRow[];
  groups: Group[];
  subgroupsByGroup: Record<string, Subgroup[]>;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(empty);
  const set = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));
  const subs = draft.group_id ? subgroupsByGroup[draft.group_id] ?? [] : [];

  const openNew = () => {
    setDraft(empty);
    setOpen(true);
  };
  const openEdit = (t: TemplateRow) => {
    setDraft({
      id: t.id,
      name: t.name,
      day_of_week: t.day_of_week,
      start_time: hm(t.start_time),
      end_time: hm(t.end_time),
      group_id: t.group_id,
      subgroup_id: t.subgroup_id ?? "",
      coach: t.coach,
    });
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={openNew}
          className="btn-cta inline-flex items-center gap-2 px-5 py-2.5 font-heading text-sm font-bold"
        >
          <Plus size={18} /> Добавить шаблон
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-[1.75rem] border border-white/10 bg-card p-10 text-center font-body text-muted">
          Шаблонов пока нет. Создайте шаблоны, чтобы генерировать расписание одной
          кнопкой.
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-white/10 md:block">
            <table className="w-full text-left">
              <thead className="bg-white/5 font-body text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3">День</th>
                  <th className="px-5 py-3">Время</th>
                  <th className="px-5 py-3">Группа</th>
                  <th className="px-5 py-3">Подгруппа</th>
                  <th className="px-5 py-3">Тренер</th>
                  <th className="px-5 py-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 font-body text-sm">
                {templates.map((t) => (
                  <tr key={t.id} className="hover:bg-white/5">
                    <td className="px-5 py-3 font-medium text-ink">
                      {DOW_RU[t.day_of_week - 1]}
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {hm(t.start_time)}–{hm(t.end_time)}
                    </td>
                    <td className="px-5 py-3 text-ink">{t.group_name}</td>
                    <td className="px-5 py-3 text-muted">
                      {t.subgroup_name || "—"}
                    </td>
                    <td className="px-5 py-3 text-muted">{t.coach}</td>
                    <td className="px-5 py-3">
                      <RowActions onEdit={() => openEdit(t)} id={t.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {templates.map((t) => (
              <div
                key={t.id}
                className="rounded-2xl border border-white/10 bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-heading font-bold text-ink">
                    {DOW_RU[t.day_of_week - 1]} · {hm(t.start_time)}–
                    {hm(t.end_time)}
                  </p>
                </div>
                <p className="mt-1 font-body text-sm text-muted">
                  {t.group_name}
                  {t.subgroup_name ? ` · ${t.subgroup_name}` : ""} · {t.coach}
                </p>
                <div className="mt-3">
                  <RowActions onEdit={() => openEdit(t)} id={t.id} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <form
            action={saveTemplate}
            onSubmit={() => setTimeout(() => setOpen(false), 50)}
            onClick={(e) => e.stopPropagation()}
            className="animate-pop-in my-4 w-full max-w-lg space-y-3 rounded-[1.75rem] border border-white/10 bg-card p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-ink">
                <CalendarClock size={18} className="text-primary" />
                {draft.id ? "Редактировать шаблон" : "Новый шаблон"}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Закрыть"
                className="rounded-full p-1.5 text-muted hover:bg-white/5 hover:text-ink"
              >
                <X size={22} />
              </button>
            </div>

            <input type="hidden" name="id" value={draft.id} />

            <label className="block">
              <span className="mb-1 block font-body text-xs text-muted">
                Название шаблона
              </span>
              <input
                name="name"
                required
                value={draft.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder="Малыши утренняя Пн-Ср"
                className="admin-input"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block font-body text-xs text-muted">
                  День недели
                </span>
                <select
                  name="day_of_week"
                  value={draft.day_of_week}
                  onChange={(e) => set({ day_of_week: Number(e.target.value) })}
                  className="admin-input"
                >
                  {DOW_RU.map((d, i) => (
                    <option key={i} value={i + 1}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block font-body text-xs text-muted">
                  Тренер
                </span>
                <select
                  name="coach"
                  required
                  value={draft.coach}
                  onChange={(e) => set({ coach: e.target.value })}
                  className="admin-input"
                >
                  <option value="" disabled>
                    Выберите
                  </option>
                  {coaches.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block font-body text-xs text-muted">
                  Начало
                </span>
                <select
                  name="start_time"
                  value={draft.start_time}
                  onChange={(e) => set({ start_time: e.target.value })}
                  className="admin-input"
                >
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block font-body text-xs text-muted">
                  Окончание
                </span>
                <select
                  name="end_time"
                  value={draft.end_time}
                  onChange={(e) => set({ end_time: e.target.value })}
                  className="admin-input"
                >
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block font-body text-xs text-muted">
                  Группа
                </span>
                <select
                  name="group_id"
                  required
                  value={draft.group_id}
                  onChange={(e) =>
                    set({ group_id: e.target.value, subgroup_id: "" })
                  }
                  className="admin-input"
                >
                  <option value="" disabled>
                    Выберите
                  </option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block font-body text-xs text-muted">
                  Подгруппа
                </span>
                <select
                  name="subgroup_id"
                  value={draft.subgroup_id}
                  onChange={(e) => set({ subgroup_id: e.target.value })}
                  disabled={!draft.group_id || subs.length === 0}
                  className="admin-input disabled:opacity-50"
                >
                  <option value="">Вся группа</option>
                  {subs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-full border border-white/10 px-6 py-3 font-heading text-sm font-semibold text-muted transition hover:text-ink"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="btn-cta flex-1 px-6 py-3 font-heading text-sm font-bold"
              >
                Сохранить
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function RowActions({ onEdit, id }: { onEdit: () => void; id: string }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={onEdit}
        className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 font-body text-xs text-ink transition hover:border-primary/40"
      >
        <Pencil size={13} /> Изменить
      </button>
      <form action={deleteTemplate}>
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 font-body text-xs text-pink transition hover:border-pink/40"
        >
          <Trash2 size={13} /> Удалить
        </button>
      </form>
    </div>
  );
}

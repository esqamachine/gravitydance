"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { addLesson } from "@/app/admin/actions";
import { coaches } from "@/lib/coaches";
import type { Group, Subgroup } from "@/lib/db";

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

const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="mb-1.5 block font-body text-xs font-medium text-muted">
    {children}
  </span>
);

export default function LessonForm({
  groups,
  subgroupsByGroup,
  today,
}: {
  groups: Group[];
  subgroupsByGroup: Record<string, Subgroup[]>;
  today: string;
}) {
  const [groupId, setGroupId] = useState("");
  const subs = groupId ? subgroupsByGroup[groupId] ?? [] : [];

  return (
    <form
      action={addLesson}
      className="rounded-[1.75rem] border border-white/10 bg-card p-5 sm:p-6"
    >
      <p className="mb-4 flex items-center gap-2 font-heading font-bold text-ink">
        <Plus size={18} className="text-primary" /> Новое занятие
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block">
          <Label>Группа</Label>
          <select
            name="group_id"
            required
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="admin-input"
          >
            <option value="" disabled>
              Выберите группу
            </option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <Label>Подгруппа (необязательно)</Label>
          <select
            name="subgroup_id"
            disabled={!groupId || subs.length === 0}
            className="admin-input disabled:opacity-50"
            defaultValue=""
          >
            <option value="">Вся группа</option>
            {subs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <Label>Дата</Label>
          <input
            type="date"
            name="date"
            required
            min={today}
            defaultValue={today}
            className="admin-input"
          />
        </label>

        <label className="block">
          <Label>Тренер</Label>
          <select name="coach_name" className="admin-input" defaultValue="">
            <option value="">Не выбран</option>
            {coaches.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <Label>Начало</Label>
          <select
            name="start_time"
            required
            className="admin-input"
            defaultValue="17:00"
          >
            {TIME_SLOTS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <Label>Окончание</Label>
          <select
            name="end_time"
            required
            className="admin-input"
            defaultValue="18:00"
          >
            {TIME_SLOTS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        type="submit"
        className="btn-cta mt-5 px-6 py-2.5 font-heading text-sm font-bold"
      >
        Добавить занятие
      </button>
    </form>
  );
}

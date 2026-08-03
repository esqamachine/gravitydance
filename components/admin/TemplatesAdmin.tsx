"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  CalendarClock,
  CalendarPlus,
  Loader2,
} from "lucide-react";
import {
  saveTemplateSet,
  deleteTemplateSet,
  applyTemplateMonth,
} from "@/app/admin/actions";
import { coaches } from "@/lib/coaches";
import { DOW_RU, type Group, type Subgroup } from "@/lib/db";
import type { TemplateSet } from "@/lib/queries";

const DOW_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

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

const hm = (t: string) => t.slice(0, 5);

type LessonDraft = {
  key: string;
  group_id: string;
  subgroup_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  coach: string;
  hall: string;
};

let seq = 0;
const newKey = () => `l${Date.now()}_${seq++}`;

export default function TemplatesAdmin({
  templateSets,
  groups,
  subgroupsByGroup,
}: {
  templateSets: TemplateSet[];
  groups: Group[];
  subgroupsByGroup: Record<string, Subgroup[]>;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [lessons, setLessons] = useState<LessonDraft[]>([]);
  const [activeDay, setActiveDay] = useState(1);
  const [pending, startTransition] = useTransition();
  const [applyingName, setApplyingName] = useState<string | null>(null);

  const openNew = () => {
    setName("");
    setOriginalName("");
    setLessons([]);
    setActiveDay(1);
    setEditing(true);
  };

  const openEdit = (set: TemplateSet) => {
    setName(set.name);
    setOriginalName(set.name);
    setLessons(
      set.lessons.map((l) => ({
        key: newKey(),
        group_id: l.group_id,
        subgroup_id: l.subgroup_id ?? "",
        day_of_week: l.day_of_week,
        start_time: hm(l.start_time),
        end_time: hm(l.end_time),
        coach: l.coach,
        hall: l.hall ?? "",
      }))
    );
    setActiveDay(set.lessons[0]?.day_of_week ?? 1);
    setEditing(true);
  };

  const addLesson = () =>
    setLessons((ls) => [
      ...ls,
      {
        key: newKey(),
        group_id: "",
        subgroup_id: "",
        day_of_week: activeDay,
        start_time: "17:00",
        end_time: "18:00",
        coach: "",
        hall: "",
      },
    ]);

  const patch = (key: string, p: Partial<LessonDraft>) =>
    setLessons((ls) => ls.map((l) => (l.key === key ? { ...l, ...p } : l)));

  const removeLesson = (key: string) =>
    setLessons((ls) => ls.filter((l) => l.key !== key));

  const save = () =>
    startTransition(async () => {
      if (!name.trim()) return;
      const payload = lessons
        .filter((l) => l.group_id && l.coach)
        .map((l) => ({
          group_id: l.group_id,
          subgroup_id: l.subgroup_id || null,
          day_of_week: l.day_of_week,
          start_time: l.start_time,
          end_time: l.end_time,
          coach: l.coach,
          hall: l.hall || null,
        }));
      const fd = new FormData();
      fd.set("name", name.trim());
      fd.set("original_name", originalName);
      fd.set("lessons", JSON.stringify(payload));
      await saveTemplateSet(fd);
      setEditing(false);
      router.refresh();
    });

  const remove = (n: string) =>
    startTransition(async () => {
      if (!confirm(`Удалить шаблон «${n}» целиком?`)) return;
      const fd = new FormData();
      fd.set("name", n);
      await deleteTemplateSet(fd);
      router.refresh();
    });

  const apply = (n: string) =>
    startTransition(async () => {
      setApplyingName(n);
      const res = await applyTemplateMonth(n);
      setApplyingName(null);
      alert(
        `Готово: создано занятий — ${res.created}, пропущено (уже были) — ${res.skipped}.`
      );
      router.refresh();
    });

  const dayLessons = lessons.filter((l) => l.day_of_week === activeDay);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={openNew}
          className="btn-cta inline-flex items-center gap-2 px-5 py-2.5 font-heading text-sm font-bold"
        >
          <Plus size={18} /> Новый шаблон
        </button>
      </div>

      {templateSets.length === 0 ? (
        <div className="rounded-[1.75rem] border border-white/10 bg-card p-10 text-center font-body text-muted">
          Шаблонов пока нет. Создайте шаблон-«блокнот» с занятиями на неделю и
          применяйте его на месяц одной кнопкой.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {templateSets.map((set) => (
            <div
              key={set.name}
              className="rounded-2xl border border-white/10 bg-card p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-ink">
                  <CalendarClock size={18} className="text-primary" />
                  {set.name}
                </h3>
                <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-0.5 font-body text-xs font-semibold text-primary-light">
                  {set.lessons.length} занят.
                </span>
              </div>
              <p className="mt-2 font-body text-xs text-muted">
                {Array.from(new Set(set.lessons.map((l) => l.day_of_week)))
                  .sort((a, b) => a - b)
                  .map((d) => DOW_SHORT[d - 1])
                  .join(", ") || "нет занятий"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => apply(set.name)}
                  disabled={pending}
                  className="btn-cta inline-flex items-center gap-1.5 px-3 py-1.5 font-heading text-xs font-bold disabled:opacity-50"
                >
                  {applyingName === set.name ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <CalendarPlus size={13} />
                  )}
                  Применить на месяц
                </button>
                <button
                  onClick={() => openEdit(set)}
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 font-body text-xs text-ink transition hover:border-primary/40"
                >
                  <Pencil size={13} /> Изменить
                </button>
                <button
                  onClick={() => remove(set.name)}
                  disabled={pending}
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 font-body text-xs text-pink transition hover:border-pink/40 disabled:opacity-50"
                >
                  <Trash2 size={13} /> Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setEditing(false)}
        >
          <div
            className="animate-pop-in my-4 w-full max-w-2xl rounded-[1.75rem] border border-white/10 bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-ink">
                <CalendarClock size={18} className="text-primary" />
                {originalName ? "Редактировать шаблон" : "Новый шаблон"}
              </h3>
              <button
                onClick={() => setEditing(false)}
                aria-label="Закрыть"
                className="rounded-full p-1.5 text-muted hover:bg-white/5 hover:text-ink"
              >
                <X size={22} />
              </button>
            </div>

            <label className="mt-4 block">
              <span className="mb-1 block font-body text-xs text-muted">
                Название шаблона
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Осеннее расписание"
                className="admin-input"
              />
            </label>

            {/* Вкладки дней */}
            <div className="no-scrollbar mt-4 flex gap-1.5 overflow-x-auto">
              {DOW_SHORT.map((d, i) => {
                const day = i + 1;
                const count = lessons.filter(
                  (l) => l.day_of_week === day
                ).length;
                return (
                  <button
                    key={day}
                    onClick={() => setActiveDay(day)}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 font-heading text-sm font-semibold transition ${
                      activeDay === day
                        ? "btn-cta"
                        : "border border-white/10 bg-white/5 text-muted hover:text-ink"
                    }`}
                  >
                    {d}
                    {count > 0 && (
                      <span
                        className={
                          activeDay === day ? "text-white/80" : "text-primary-light"
                        }
                      >
                        {" "}
                        · {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Занятия активного дня */}
            <div className="mt-4 max-h-[46vh] space-y-3 overflow-y-auto pr-1">
              <p className="font-body text-xs text-muted">
                {DOW_RU[activeDay - 1]}
              </p>
              {dayLessons.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/15 py-6 text-center font-body text-sm text-muted">
                  В этот день занятий нет.
                </p>
              ) : (
                dayLessons.map((l) => {
                  const subs = l.group_id
                    ? subgroupsByGroup[l.group_id] ?? []
                    : [];
                  return (
                    <div
                      key={l.key}
                      className="rounded-2xl border border-white/10 bg-surface p-3"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={l.group_id}
                          onChange={(e) =>
                            patch(l.key, {
                              group_id: e.target.value,
                              subgroup_id: "",
                            })
                          }
                          className="admin-input"
                        >
                          <option value="">Группа…</option>
                          {groups.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name}
                            </option>
                          ))}
                        </select>
                        <select
                          value={l.subgroup_id}
                          onChange={(e) =>
                            patch(l.key, { subgroup_id: e.target.value })
                          }
                          disabled={!l.group_id || subs.length === 0}
                          className="admin-input disabled:opacity-50"
                        >
                          <option value="">Вся группа</option>
                          {subs.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                        <select
                          value={l.start_time}
                          onChange={(e) =>
                            patch(l.key, { start_time: e.target.value })
                          }
                          className="admin-input"
                        >
                          {TIME_SLOTS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <select
                          value={l.end_time}
                          onChange={(e) =>
                            patch(l.key, { end_time: e.target.value })
                          }
                          className="admin-input"
                        >
                          {TIME_SLOTS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <select
                          value={l.coach}
                          onChange={(e) =>
                            patch(l.key, { coach: e.target.value })
                          }
                          className="admin-input"
                        >
                          <option value="">Тренер…</option>
                          {coaches.map((c) => (
                            <option key={c.name} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <input
                          value={l.hall}
                          onChange={(e) =>
                            patch(l.key, { hall: e.target.value })
                          }
                          placeholder="Зал / место"
                          className="admin-input"
                        />
                      </div>
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => removeLesson(l.key)}
                          className="inline-flex items-center gap-1 rounded-full px-3 py-1 font-body text-xs text-pink transition hover:bg-pink/10"
                        >
                          <Trash2 size={13} /> Удалить занятие
                        </button>
                      </div>
                    </div>
                  );
                })
              )}

              <button
                onClick={addLesson}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 font-heading text-sm font-semibold text-ink transition hover:border-primary/40"
              >
                <Plus size={15} /> Добавить занятие
              </button>
            </div>

            <div className="mt-5 flex gap-3 border-t border-white/10 pt-4">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 rounded-full border border-white/10 px-6 py-3 font-heading text-sm font-semibold text-muted transition hover:text-ink"
              >
                Отмена
              </button>
              <button
                onClick={save}
                disabled={pending || !name.trim()}
                className="btn-cta flex flex-1 items-center justify-center gap-2 px-6 py-3 font-heading text-sm font-bold disabled:opacity-50"
              >
                {pending ? <Loader2 size={16} className="animate-spin" /> : null}
                Сохранить шаблон
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

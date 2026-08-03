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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  saveTemplateSet,
  deleteTemplateSet,
  applyTemplateMonth,
} from "@/app/admin/actions";
import { coaches } from "@/lib/coaches";
import { groupColor, type Group, type Subgroup } from "@/lib/db";
import type { TemplateSet } from "@/lib/queries";

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

const MONTHS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];
const WD = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const hm = (t: string) => t.slice(0, 5);
const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/** «2026-08-14» → «14 авг» */
function shortDate(d: string): string {
  const [y, mo, da] = d.split("-").map(Number);
  return `${da} ${MONTHS[mo - 1].slice(0, 3).toLowerCase()} ${y !== new Date().getFullYear() ? y : ""}`.trim();
}

type LessonDraft = {
  key: string;
  date: string;
  start_time: string;
  end_time: string;
  group_id: string;
  subgroup_id: string;
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
  const now = new Date();
  const [viewY, setViewY] = useState(now.getFullYear());
  const [viewM, setViewM] = useState(now.getMonth());
  const [pending, startTransition] = useTransition();
  const [applyingName, setApplyingName] = useState<string | null>(null);
  const [error, setError] = useState("");

  const openNew = () => {
    setName("");
    setOriginalName("");
    setLessons([]);
    setViewY(now.getFullYear());
    setViewM(now.getMonth());
    setError("");
    setEditing(true);
  };

  const openEdit = (set: TemplateSet) => {
    setName(set.name);
    setOriginalName(set.name);
    setLessons(
      set.lessons.map((l) => ({
        key: newKey(),
        date: l.lesson_date ?? "",
        start_time: hm(l.start_time),
        end_time: hm(l.end_time),
        group_id: l.group_id,
        subgroup_id: l.subgroup_id ?? "",
        coach: l.coach,
        hall: l.hall ?? "",
      }))
    );
    const first = set.lessons.find((l) => l.lesson_date)?.lesson_date;
    if (first) {
      const [y, m] = first.split("-").map(Number);
      setViewY(y);
      setViewM(m - 1);
    }
    setError("");
    setEditing(true);
  };

  const addLessonOn = (date: string) =>
    setLessons((ls) => [
      ...ls,
      {
        key: newKey(),
        date,
        start_time: "17:00",
        end_time: "18:00",
        group_id: "",
        subgroup_id: "",
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
      setError("");
      if (!name.trim()) return setError("Укажите название шаблона");
      const payload = lessons
        .filter((l) => l.date && l.group_id && l.coach)
        .map((l) => ({
          date: l.date,
          group_id: l.group_id,
          subgroup_id: l.subgroup_id || null,
          start_time: l.start_time,
          end_time: l.end_time,
          coach: l.coach,
          hall: l.hall || null,
        }));
      const fd = new FormData();
      fd.set("name", name.trim());
      fd.set("original_name", originalName);
      fd.set("lessons", JSON.stringify(payload));
      const res = await saveTemplateSet(fd);
      if (res && res.ok === false) {
        setError(res.error || "Не удалось сохранить");
        return;
      }
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
        `Готово: создано занятий — ${res.created}, пропущено — ${res.skipped}. Даты вне ближайших 31 дня не применяются.`
      );
      router.refresh();
    });

  // Сетка месяца (Пн-первый)
  const firstDow = ((new Date(viewY, viewM, 1).getDay() + 6) % 7); // 0=Пн
  const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const countOn = (date: string) =>
    lessons.filter((l) => l.date === date).length;
  const todayISO = iso(now.getFullYear(), now.getMonth(), now.getDate());

  const prevMonth = () => {
    if (viewM === 0) {
      setViewM(11);
      setViewY((y) => y - 1);
    } else setViewM((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewM === 11) {
      setViewM(0);
      setViewY((y) => y + 1);
    } else setViewM((m) => m + 1);
  };

  const sortedLessons = [...lessons].sort(
    (a, b) =>
      a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time)
  );

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
          Шаблонов пока нет. Создайте шаблон: отметьте нужные даты в календаре и
          заполните занятия, затем применяйте на месяц одной кнопкой.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {templateSets.map((set) => {
            const dates = Array.from(
              new Set(set.lessons.map((l) => l.lesson_date).filter(Boolean))
            ) as string[];
            return (
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
                  {dates.length
                    ? `${dates.length} дат: ` +
                      dates
                        .slice(0, 4)
                        .map(shortDate)
                        .join(", ") +
                      (dates.length > 4 ? "…" : "")
                    : "нет дат"}
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
            );
          })}
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

            {/* Календарь */}
            <div className="mt-4 rounded-2xl border border-white/10 bg-surface p-3">
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={prevMonth}
                  aria-label="Предыдущий месяц"
                  className="rounded-full p-1.5 text-muted transition hover:bg-white/5 hover:text-ink"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="font-heading text-sm font-bold text-ink">
                  {MONTHS[viewM]} {viewY}
                </span>
                <button
                  type="button"
                  onClick={nextMonth}
                  aria-label="Следующий месяц"
                  className="rounded-full p-1.5 text-muted transition hover:bg-white/5 hover:text-ink"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {WD.map((w) => (
                  <div
                    key={w}
                    className="py-1 font-body text-[11px] font-medium text-muted"
                  >
                    {w}
                  </div>
                ))}
                {cells.map((d, i) => {
                  if (d === null) return <div key={`e${i}`} />;
                  const date = iso(viewY, viewM, d);
                  const cnt = countOn(date);
                  const isToday = date === todayISO;
                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => addLessonOn(date)}
                      className={`relative aspect-square rounded-lg font-body text-sm transition ${
                        cnt > 0
                          ? "bg-brand-gradient font-bold text-white"
                          : "text-ink hover:bg-white/10"
                      } ${isToday && cnt === 0 ? "ring-1 ring-primary" : ""}`}
                    >
                      {d}
                      {cnt > 0 && (
                        <span className="absolute right-0.5 top-0.5 rounded-full bg-white/90 px-1 text-[9px] font-bold text-[#0D1428]">
                          {cnt}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 font-body text-[11px] text-muted">
                Нажмите на дату, чтобы добавить занятие в этот день.
              </p>
            </div>

            {/* Занятия по датам */}
            <div className="mt-4 max-h-[40vh] space-y-3 overflow-y-auto pr-1">
              {sortedLessons.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/15 py-6 text-center font-body text-sm text-muted">
                  Пока нет занятий. Выберите даты в календаре выше.
                </p>
              ) : (
                sortedLessons.map((l) => {
                  const subs = l.group_id
                    ? subgroupsByGroup[l.group_id] ?? []
                    : [];
                  const gName =
                    groups.find((g) => g.id === l.group_id)?.name ?? "";
                  const color = gName ? groupColor(gName) : "transparent";
                  return (
                    <div
                      key={l.key}
                      style={{ borderLeftColor: color }}
                      className="rounded-2xl border border-l-4 border-white/10 bg-surface p-3"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-heading text-sm font-bold text-ink">
                          {shortDate(l.date)}
                        </span>
                        <button
                          onClick={() => removeLesson(l.key)}
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-body text-xs text-pink transition hover:bg-pink/10"
                        >
                          <Trash2 size={13} /> Удалить
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={l.start_time}
                          onChange={(e) =>
                            patch(l.key, { start_time: e.target.value })
                          }
                          className="admin-input"
                        >
                          {TIME_SLOTS.map((t) => (
                            <option key={t} value={t}>
                              с {t}
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
                              до {t}
                            </option>
                          ))}
                        </select>
                        <select
                          value={l.group_id}
                          onChange={(e) =>
                            patch(l.key, {
                              group_id: e.target.value,
                              subgroup_id: "",
                            })
                          }
                          style={{ borderLeft: `4px solid ${color}` }}
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
                    </div>
                  );
                })
              )}
            </div>

            {error && (
              <p className="mt-3 text-center font-body text-sm text-pink">
                {error}
              </p>
            )}

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

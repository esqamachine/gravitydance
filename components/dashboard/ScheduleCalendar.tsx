"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  User,
  CalendarDays,
  Lock,
  Users,
} from "lucide-react";

export type CalLesson = {
  id: string;
  group_id: string;
  date: string;
  start_time: string;
  end_time: string;
  coach_name: string | null;
  status: "scheduled" | "completed" | "cancelled";
  group_name: string;
  subgroup_name: string | null;
  attendance: "present" | "absent" | "late" | null;
};

export type LegendItem = { group_name: string; subgroup_name: string | null };

const GROUP_COLORS: Record<string, string> = {
  Малыши: "#F59E0B",
  Начинающие: "#8B5CF6",
  Продолжающие: "#3B82F6",
  ПРО: "#EC4899",
  "ПРО МАКС": "#06B6D4",
  Растяжка: "#A78BFA",
  Индивидуальные: "#F97316",
};
const groupColor = (name: string) => GROUP_COLORS[name] ?? "#4AADDF";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
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

function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

type Phase = "past" | "today" | "future";
function phaseOf(dateIso: string, todayIso: string): Phase {
  if (dateIso === todayIso) return "today";
  return dateIso < todayIso ? "past" : "future";
}

/** Классы фона полоски по статусу дня */
const phaseBadge: Record<Phase, string> = {
  past: "bg-white/[0.07] text-muted",
  today: "bg-red-500 text-white animate-pulse-red",
  future: "bg-green-500 text-white",
};

const hm = (t: string) => t.slice(0, 5);

const STATUS_RU: Record<CalLesson["status"], string> = {
  scheduled: "Запланировано",
  completed: "Проведено",
  cancelled: "Отменено",
};
const ATT_RU: Record<string, string> = {
  present: "Был",
  absent: "Не был",
  late: "Опоздал",
};

export default function ScheduleCalendar({
  lessons,
  legend,
  locked = false,
}: {
  lessons: CalLesson[];
  legend: LegendItem[];
  locked?: boolean;
}) {
  const now = new Date();
  const todayIso = isoLocal(now);

  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [modal, setModal] = useState<CalLesson | null>(null);

  // занятия по датам (без отменённых)
  const byDate = useMemo(() => {
    const map = new Map<string, CalLesson[]>();
    for (const l of lessons) {
      if (l.status === "cancelled") continue;
      const arr = map.get(l.date) ?? [];
      arr.push(l);
      map.set(l.date, arr);
    }
    map.forEach((arr) =>
      arr.sort((a, b) => a.start_time.localeCompare(b.start_time))
    );
    return map;
  }, [lessons]);

  // сетка 6 недель
  const cells = useMemo(() => {
    const first = new Date(view.y, view.m, 1);
    const lead = (first.getDay() + 6) % 7; // Пн = 0
    const start = new Date(view.y, view.m, 1 - lead);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const iso = isoLocal(d);
      return {
        iso,
        day: d.getDate(),
        inMonth: d.getMonth() === view.m,
        isToday: iso === todayIso,
        lessons: byDate.get(iso) ?? [],
      };
    });
  }, [view, byDate, todayIso]);

  const move = (dir: 1 | -1) => {
    setSelectedDay(null);
    setView((v) => {
      const m = v.m + dir;
      if (m < 0) return { y: v.y - 1, m: 11 };
      if (m > 11) return { y: v.y + 1, m: 0 };
      return { y: v.y, m };
    });
  };

  // легенда: уникальные пары группа+подгруппа
  const legendItems = useMemo(() => {
    const seen = new Set<string>();
    const items: LegendItem[] = [];
    const source: LegendItem[] = [
      ...legend,
      ...lessons.map((l) => ({
        group_name: l.group_name,
        subgroup_name: l.subgroup_name,
      })),
    ];
    for (const it of source) {
      if (!it.group_name) continue;
      const key = `${it.group_name}|${it.subgroup_name ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(it);
    }
    return items;
  }, [legend, lessons]);

  const selectedLessons = selectedDay ? byDate.get(selectedDay) ?? [] : [];

  return (
    <div className="relative space-y-5">
      {/* Легенда */}
      {legendItems.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-2xl border border-white/10 bg-card px-4 py-3">
          {legendItems.map((g) => (
            <span
              key={`${g.group_name}|${g.subgroup_name ?? ""}`}
              className="flex items-center gap-2 font-body text-xs text-muted"
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{ background: groupColor(g.group_name) }}
              />
              {g.group_name}
              {g.subgroup_name && (
                <span className="text-muted/70">· {g.subgroup_name}</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Обёртка: блюр календаря + оверлей оплаты для неоплативших */}
      <div className="relative">
      <div
        className={`space-y-5 ${
          locked ? "pointer-events-none select-none blur-[8px]" : ""
        }`}
        aria-hidden={locked}
      >
      {/* Календарь */}
      <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-card">
        {/* Шапка месяца */}
        <div className="flex items-center justify-between px-4 py-4 sm:px-6">
          <button
            onClick={() => move(-1)}
            aria-label="Предыдущий месяц"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-ink transition hover:border-primary/50 hover:bg-white/5"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="font-heading text-lg font-bold text-ink sm:text-xl">
            {MONTHS[view.m]}{" "}
            <span className="text-gradient">{view.y}</span>
          </h2>
          <button
            onClick={() => move(1)}
            aria-label="Следующий месяц"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-ink transition hover:border-primary/50 hover:bg-white/5"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Дни недели */}
        <div className="grid grid-cols-7 border-b border-[rgba(74,173,223,0.1)] px-1 pb-2 sm:px-2">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={`text-center font-body text-xs font-medium ${
                i >= 5 ? "text-primary-light/70" : "text-muted"
              }`}
            >
              {w}
            </div>
          ))}
        </div>

        {/* Сетка (анимация смены месяца) */}
        <div
          key={`${view.y}-${view.m}`}
          className="grid animate-fade-in-up grid-cols-7 gap-px bg-[rgba(74,173,223,0.1)]"
        >
          {cells.map((c) => {
            const selected = c.iso === selectedDay;
            return (
              <button
                key={c.iso}
                onClick={() => setSelectedDay(selected ? null : c.iso)}
                className={`group relative flex min-h-[68px] flex-col gap-1 bg-card p-1.5 text-left transition hover:bg-white/[0.03] sm:min-h-[104px] sm:p-2 ${
                  selected ? "bg-white/[0.05]" : ""
                }`}
              >
                {/* Число */}
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full font-heading text-sm font-semibold ${
                    c.isToday
                      ? "border border-primary text-primary-light"
                      : c.inMonth
                        ? "text-ink"
                        : "text-muted/40"
                  }`}
                >
                  {c.day}
                </span>

                {/* Десктоп: полоски */}
                <div className="hidden flex-1 flex-col gap-1 overflow-hidden sm:flex">
                  {c.lessons.slice(0, 3).map((l) => {
                    const ph = phaseOf(l.date, todayIso);
                    return (
                      <span
                        key={l.id}
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          setModal(l);
                        }}
                        className={`flex items-center gap-1 truncate rounded-md py-0.5 pl-1.5 pr-1 font-body text-[11px] leading-tight ${phaseBadge[ph]}`}
                        style={{
                          borderLeft: `3px solid ${groupColor(l.group_name)}`,
                        }}
                      >
                        <span className="truncate font-medium">
                          {l.group_name}
                        </span>
                        <span className="opacity-80">{hm(l.start_time)}</span>
                      </span>
                    );
                  })}
                  {c.lessons.length > 3 && (
                    <span className="pl-1 font-body text-[10px] text-muted">
                      +{c.lessons.length - 3}
                    </span>
                  )}
                </div>

                {/* Мобайл: точки */}
                {c.lessons.length > 0 && (
                  <div className="mt-auto flex flex-wrap gap-1 sm:hidden">
                    {c.lessons.slice(0, 4).map((l) => (
                      <span
                        key={l.id}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: groupColor(l.group_name) }}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Мобильная панель дня */}
      {selectedDay && (
        <div className="animate-fade-in-up rounded-[1.75rem] border border-white/10 bg-card p-5 sm:hidden">
          <p className="font-heading font-bold text-ink">
            {formatFullDate(selectedDay)}
          </p>
          {selectedLessons.length === 0 ? (
            <p className="mt-3 font-body text-sm text-muted">
              Занятий нет.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {selectedLessons.map((l) => {
                const ph = phaseOf(l.date, todayIso);
                return (
                  <li key={l.id}>
                    <button
                      onClick={() => setModal(l)}
                      className={`flex w-full items-center justify-between rounded-xl py-2 pl-3 pr-3 text-left ${phaseBadge[ph]}`}
                      style={{
                        borderLeft: `3px solid ${groupColor(l.group_name)}`,
                      }}
                    >
                      <span className="font-body text-sm font-medium">
                        {l.group_name}
                      </span>
                      <span className="font-body text-xs opacity-90">
                        {hm(l.start_time)}–{hm(l.end_time)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
      </div>{/* /блюр-контент */}

      {/* Оверлей оплаты */}
      {locked && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
          <div className="animate-pop-in max-w-sm rounded-[1.75rem] border border-white/15 bg-card/90 p-8 text-center shadow-2xl backdrop-blur-md">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-gradient text-white">
              <Lock size={26} />
            </div>
            <p className="mt-4 font-heading text-lg font-bold text-ink">
              Оплатите занятия, чтобы видеть расписание
            </p>
            <p className="mt-2 font-body text-sm text-muted">
              После оплаты абонемента за текущий месяц календарь откроется.
            </p>
            <Link
              href="/dashboard/payments"
              className="btn-cta mt-6 inline-block px-8 py-3.5 font-heading font-bold"
            >
              Оплатить
            </Link>
          </div>
        </div>
      )}
      </div>{/* /relative */}

      {/* Модалка занятия */}
      {modal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setModal(null)}
        >
          <div
            className="animate-pop-in w-full max-w-sm rounded-[1.75rem] border border-white/10 bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h3
                className="font-heading text-2xl font-bold"
                style={{ color: groupColor(modal.group_name) }}
              >
                {modal.group_name}
                {modal.subgroup_name && (
                  <span className="ml-1 text-base font-semibold text-muted">
                    · {modal.subgroup_name}
                  </span>
                )}
              </h3>
              <button
                onClick={() => setModal(null)}
                aria-label="Закрыть"
                className="shrink-0 rounded-full p-1.5 text-muted transition hover:bg-white/5 hover:text-ink"
              >
                <X size={22} />
              </button>
            </div>

            <dl className="mt-5 space-y-3 font-body text-sm">
              {modal.subgroup_name && (
                <Row icon={<Users size={16} />}>
                  Подгруппа: {modal.subgroup_name}
                </Row>
              )}
              <Row icon={<CalendarDays size={16} />}>
                {formatFullDate(modal.date)}
              </Row>
              <Row icon={<Clock size={16} />}>
                {hm(modal.start_time)}–{hm(modal.end_time)}
              </Row>
              <Row icon={<User size={16} />}>
                {modal.coach_name || "Тренер не назначен"}
              </Row>
            </dl>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/5 px-3 py-1.5 font-body text-xs text-ink">
                {STATUS_RU[modal.status]}
              </span>
              <span
                className={`rounded-full px-3 py-1.5 font-body text-xs font-medium ${
                  modal.attendance === "present"
                    ? "bg-green-500/20 text-green-400"
                    : modal.attendance === "absent"
                      ? "bg-pink/20 text-pink"
                      : modal.attendance === "late"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-white/5 text-muted"
                }`}
              >
                {modal.attendance ? ATT_RU[modal.attendance] : "Посещение не отмечено"}
              </span>
            </div>

            <button
              onClick={() => setModal(null)}
              className="btn-cta mt-6 w-full px-6 py-3 font-heading text-sm font-bold"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-primary">{icon}</span>
      <span className="text-ink">{children}</span>
    </div>
  );
}

function formatFullDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const day = d.getDate();
  const month = new Intl.DateTimeFormat("ru-RU", { month: "long" }).format(d);
  const weekday = new Intl.DateTimeFormat("ru-RU", { weekday: "long" }).format(d);
  return `${day} ${month} ${d.getFullYear()}, ${weekday}`;
}

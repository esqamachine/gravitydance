"use client";

import { useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { cancelLesson, deleteLesson } from "@/app/admin/actions";
import { formatDate } from "@/lib/db";
import type { LessonAdmin } from "@/lib/queries";

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function LessonRow({ l }: { l: LessonAdmin }) {
  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        {l.title && (
          <p className="font-heading text-base font-bold text-ink">{l.title}</p>
        )}
        <p
          className={`font-body ${l.title ? "text-sm text-muted" : "font-heading font-bold text-ink"}`}
        >
          {l.group_name}
          {l.subgroup_name && <span className="text-muted"> · {l.subgroup_name}</span>}
        </p>
        <p className="font-body text-sm text-muted">
          {formatDate(l.date)} · {l.start_time.slice(0, 5)}–
          {l.end_time.slice(0, 5)}
          {l.coach_name ? ` · ${l.coach_name}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-3 py-1 font-body text-xs font-medium ${
            l.status === "cancelled"
              ? "bg-pink/15 text-pink"
              : l.status === "completed"
                ? "bg-white/10 text-muted"
                : "bg-primary/15 text-primary-light"
          }`}
        >
          {l.status === "cancelled"
            ? "Отменено"
            : l.status === "completed"
              ? "Завершено"
              : "Запланировано"}
        </span>
        {l.status === "scheduled" && (
          <form action={cancelLesson}>
            <input type="hidden" name="lesson_id" value={l.id} />
            <button
              type="submit"
              className="rounded-full border border-white/10 px-3 py-1 font-body text-xs text-muted transition hover:border-pink/40 hover:text-pink"
            >
              Отменить
            </button>
          </form>
        )}
        <form
          action={deleteLesson}
          onSubmit={(e) => {
            if (!confirm("Удалить занятие безвозвратно? Связанные посещения тоже удалятся."))
              e.preventDefault();
          }}
        >
          <input type="hidden" name="lesson_id" value={l.id} />
          <button
            type="submit"
            aria-label="Удалить занятие"
            title="Удалить"
            className="rounded-full border border-white/10 p-1.5 text-muted transition hover:border-pink/40 hover:text-pink"
          >
            <Trash2 size={15} />
          </button>
        </form>
      </div>
    </li>
  );
}

function Section({
  lessons,
  emptyText,
}: {
  lessons: LessonAdmin[];
  emptyText: string;
}) {
  if (lessons.length === 0)
    return <p className="py-3 font-body text-sm text-muted">{emptyText}</p>;
  return (
    <ul className="space-y-3">
      {lessons.map((l) => (
        <LessonRow key={l.id} l={l} />
      ))}
    </ul>
  );
}

export default function ScheduleList({
  lessons,
  today,
}: {
  lessons: LessonAdmin[];
  today: string;
}) {
  const [showMore, setShowMore] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  const twoWeeks = addDays(today, 14);
  const upcoming = lessons
    .filter((l) => l.date >= today && l.date <= twoWeeks)
    .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time));
  const future = lessons
    .filter((l) => l.date > twoWeeks)
    .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time));
  const archive = lessons
    .filter((l) => l.date < today)
    .sort((a, b) => b.date.localeCompare(a.date) || b.start_time.localeCompare(a.start_time));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="mb-3 font-heading text-lg font-bold text-ink">
          Ближайшие 2 недели
        </h2>
        <Section lessons={upcoming} emptyText="Занятий на ближайшие 2 недели нет." />
      </div>

      {future.length > 0 && (
        <div>
          <button
            onClick={() => setShowMore((v) => !v)}
            className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-card px-4 py-3 font-heading text-sm font-bold text-ink transition hover:border-primary/40"
          >
            Ещё занятия ({future.length})
            <ChevronDown
              size={18}
              className={`text-primary transition-transform ${showMore ? "rotate-180" : ""}`}
            />
          </button>
          {showMore && (
            <div className="mt-3">
              <Section lessons={future} emptyText="" />
            </div>
          )}
        </div>
      )}

      {archive.length > 0 && (
        <div>
          <button
            onClick={() => setShowArchive((v) => !v)}
            className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-card px-4 py-3 font-heading text-sm font-bold text-muted transition hover:border-primary/40"
          >
            Архив — прошедшие ({archive.length})
            <ChevronDown
              size={18}
              className={`text-primary transition-transform ${showArchive ? "rotate-180" : ""}`}
            />
          </button>
          {showArchive && (
            <div className="mt-3">
              <Section lessons={archive} emptyText="" />
            </div>
          )}
        </div>
      )}

      {lessons.length === 0 && (
        <div className="rounded-[1.75rem] border border-white/10 bg-card p-10 text-center font-body text-muted">
          Занятий пока нет.
        </div>
      )}
    </div>
  );
}

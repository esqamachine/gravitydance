import {
  getAllGroups,
  getAllLessons,
  getAllSubgroups,
  getScheduleTemplates,
} from "@/lib/queries";
import { formatDate, type Subgroup } from "@/lib/db";
import { cancelLesson } from "@/app/admin/actions";
import LessonForm from "@/components/admin/LessonForm";
import GenerateWeekModal from "@/components/admin/GenerateWeekModal";

export const dynamic = "force-dynamic";

export default async function AdminSchedulePage() {
  const [groups, lessons, subgroups, templates] = await Promise.all([
    getAllGroups(),
    getAllLessons(),
    getAllSubgroups(),
    getScheduleTemplates(),
  ]);

  const subgroupsByGroup: Record<string, Subgroup[]> = {};
  for (const s of subgroups) {
    (subgroupsByGroup[s.group_id] ??= []).push(s);
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
          <span className="text-gradient">Расписание</span>
        </h1>
        <GenerateWeekModal templates={templates} />
      </div>

      <LessonForm
        groups={groups}
        subgroupsByGroup={subgroupsByGroup}
        today={today}
      />

      {/* Список занятий */}
      {lessons.length === 0 ? (
        <div className="rounded-[1.75rem] border border-white/10 bg-card p-10 text-center font-body text-muted">
          Занятий пока нет.
        </div>
      ) : (
        <ul className="space-y-3">
          {lessons.map((l) => (
            <li
              key={l.id}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-heading font-bold text-ink">
                  {l.group_name}
                  {l.subgroup_name && (
                    <span className="text-muted"> · {l.subgroup_name}</span>
                  )}
                </p>
                <p className="font-body text-sm text-muted">
                  {formatDate(l.date)} · {l.start_time.slice(0, 5)}–
                  {l.end_time.slice(0, 5)}
                  {l.coach_name ? ` · ${l.coach_name}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
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
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

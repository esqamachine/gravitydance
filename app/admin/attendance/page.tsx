import Link from "next/link";
import { getAllLessons, getLessonRoster } from "@/lib/queries";
import { formatDate } from "@/lib/db";
import { markAttendance } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

const STATUSES: { value: "present" | "absent" | "late"; label: string; cls: string }[] =
  [
    { value: "present", label: "Был", cls: "bg-green-500/20 text-green-400" },
    { value: "late", label: "Опоздал", cls: "bg-yellow-500/20 text-yellow-400" },
    { value: "absent", label: "Не был", cls: "bg-pink/20 text-pink" },
  ];

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ lesson?: string }>;
}) {
  const { lesson: lessonId } = await searchParams;
  const lessons = await getAllLessons();
  const { lesson, roster } = lessonId
    ? await getLessonRoster(lessonId)
    : { lesson: null, roster: [] };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
        <span className="text-gradient">Посещения</span>
      </h1>

      {/* Выбор занятия */}
      <div>
        <p className="mb-3 font-body text-sm text-muted">Выберите занятие:</p>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {lessons
            .filter((l) => l.status !== "cancelled")
            .map((l) => (
              <Link
                key={l.id}
                href={`/admin/attendance?lesson=${l.id}`}
                className={`shrink-0 rounded-2xl border px-4 py-2.5 font-body text-sm transition ${
                  l.id === lessonId
                    ? "border-primary bg-primary/15 text-ink"
                    : "border-white/10 bg-card text-muted hover:text-ink"
                }`}
              >
                <span className="block font-semibold text-ink">
                  {l.group_name}
                </span>
                <span className="text-xs">
                  {formatDate(l.date)} · {l.start_time.slice(0, 5)}
                </span>
              </Link>
            ))}
          {lessons.length === 0 && (
            <p className="font-body text-sm text-muted">Занятий нет.</p>
          )}
        </div>
      </div>

      {/* Ростер */}
      {lesson && (
        <div className="rounded-[1.75rem] border border-white/10 bg-card p-5 sm:p-6">
          <p className="font-heading font-bold text-ink">
            {lesson.group_name} — {formatDate(lesson.date)}
          </p>
          {roster.length === 0 ? (
            <p className="mt-4 font-body text-sm text-muted">
              В этой группе нет записанных клиентов.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-white/10">
              {roster.map((r) => (
                <li
                  key={r.profile_id}
                  className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-body text-ink">{r.name}</span>
                  <div className="flex gap-2">
                    {STATUSES.map((s) => (
                      <form key={s.value} action={markAttendance}>
                        <input type="hidden" name="lesson_id" value={lesson.id} />
                        <input
                          type="hidden"
                          name="profile_id"
                          value={r.profile_id}
                        />
                        <input type="hidden" name="status" value={s.value} />
                        <button
                          type="submit"
                          className={`rounded-full px-3 py-1.5 font-body text-xs font-medium transition ${
                            r.status === s.value
                              ? s.cls
                              : "bg-white/5 text-muted hover:text-ink"
                          }`}
                        >
                          {s.label}
                        </button>
                      </form>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

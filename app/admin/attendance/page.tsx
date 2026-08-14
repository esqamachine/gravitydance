import Link from "next/link";
import { redirect } from "next/navigation";
import { getAllLessons, getLessonRoster } from "@/lib/queries";
import { formatDate } from "@/lib/db";
import { markAttendance } from "@/app/admin/actions";
import { requireStaff } from "@/lib/account";
import { getScopeGroupIds, canAccessGroup } from "@/lib/staff";

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
  const session = await requireStaff();
  const scope = await getScopeGroupIds(session);
  const allLessons = await getAllLessons(scope);
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
  // Предстоящие занятия (сегодня и позже), по возрастанию даты/времени.
  const lessons = allLessons
    .filter((l) => l.status !== "cancelled" && l.date >= today)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time)
    );
  const { lesson, roster } = lessonId
    ? await getLessonRoster(lessonId)
    : { lesson: null, roster: [] };

  // Тренер не должен открывать ростер чужой группы через URL.
  if (lesson && !(await canAccessGroup(session, lesson.group_id))) {
    redirect("/admin/attendance");
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
        <span className="text-gradient">Посещения</span>
      </h1>

      {/* Выбор занятия */}
      <div>
        <p className="mb-3 font-body text-sm text-muted">Выберите занятие:</p>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {lessons.map((l) => (
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
            <p className="font-body text-sm text-muted">
              Предстоящих занятий нет. Сгенерируйте расписание из шаблонов.
            </p>
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
                  key={`${r.profile_id}|${r.child_id ?? ""}`}
                  className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-body text-ink">
                    {r.name}
                    {r.is_child && (
                      <span className="text-muted"> · ребёнок</span>
                    )}
                  </span>
                  <div className="flex gap-2">
                    {STATUSES.map((s) => (
                      <form key={s.value} action={markAttendance}>
                        <input type="hidden" name="lesson_id" value={lesson.id} />
                        <input
                          type="hidden"
                          name="profile_id"
                          value={r.profile_id}
                        />
                        <input
                          type="hidden"
                          name="child_id"
                          value={r.child_id ?? ""}
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

import { Boxes, Users } from "lucide-react";
import { getGroupsWithCounts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminGroupsPage() {
  const groups = await getGroupsWithCounts();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
        <span className="text-gradient">Группы</span>
      </h1>

      {groups.length === 0 ? (
        <div className="rounded-[1.75rem] border border-white/10 bg-card p-10 text-center font-body text-muted">
          Группы не найдены. Выполните SQL-миграцию в Supabase.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <div
              key={g.id}
              className="rounded-2xl border border-white/10 bg-card p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-heading text-lg font-bold text-ink">
                  <Boxes size={18} className="text-primary" />
                  {g.name}
                </div>
                <span className="flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 font-body text-xs font-semibold text-primary-light">
                  <Users size={13} /> {g.student_count}
                </span>
              </div>
              <dl className="mt-4 space-y-1.5 font-body text-sm text-muted">
                {g.age_range && (
                  <div className="flex justify-between">
                    <dt>Возраст</dt>
                    <dd className="text-ink">{g.age_range}</dd>
                  </div>
                )}
                {g.schedule && (
                  <div className="flex justify-between">
                    <dt>Частота</dt>
                    <dd className="text-ink">{g.schedule}</dd>
                  </div>
                )}
                {g.duration && (
                  <div className="flex justify-between">
                    <dt>Длительность</dt>
                    <dd className="text-ink">{g.duration}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt>Макс. учеников</dt>
                  <dd className="text-ink">{g.max_students}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

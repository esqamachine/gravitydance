import { getGroupsWithCounts } from "@/lib/queries";
import GroupsGrid from "@/components/admin/GroupsGrid";

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
        <GroupsGrid groups={groups} />
      )}
    </div>
  );
}

import { getGroupsWithCounts } from "@/lib/queries";
import { requireStaff, isAdmin } from "@/lib/account";
import { getScopeGroupIds } from "@/lib/staff";
import GroupsGrid from "@/components/admin/GroupsGrid";

export const dynamic = "force-dynamic";

export default async function AdminGroupsPage() {
  const session = await requireStaff();
  const admin = isAdmin(session);
  const scope = await getScopeGroupIds(session);
  const groups = await getGroupsWithCounts(scope);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
        <span className="text-gradient">{admin ? "Группы" : "Мои группы"}</span>
      </h1>

      {groups.length === 0 ? (
        <div className="rounded-[1.75rem] border border-white/10 bg-card p-10 text-center font-body text-muted">
          {admin
            ? "Группы не найдены. Выполните SQL-миграцию в Supabase."
            : "Вам пока не назначены группы. Обратитесь к руководителю."}
        </div>
      ) : (
        <GroupsGrid groups={groups} canManage={admin} />
      )}
    </div>
  );
}

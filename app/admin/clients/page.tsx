import { getAllProfiles, getAllGroups, getAllSubgroups } from "@/lib/queries";
import type { Subgroup } from "@/lib/db";
import ClientsTable from "@/components/admin/ClientsTable";
import { requireAdmin } from "@/lib/account";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  await requireAdmin();
  const [clients, groups, subgroups] = await Promise.all([
    getAllProfiles(),
    getAllGroups(),
    getAllSubgroups(),
  ]);

  const subgroupsByGroup: Record<string, Subgroup[]> = {};
  for (const s of subgroups) {
    (subgroupsByGroup[s.group_id] ??= []).push(s);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
          <span className="text-gradient">Клиенты</span>
        </h1>
        <span className="font-body text-sm text-muted">
          Всего: {clients.length}
        </span>
      </div>
      <ClientsTable
        clients={clients}
        groups={groups}
        subgroupsByGroup={subgroupsByGroup}
      />
    </div>
  );
}

import {
  getTemplateSets,
  getAllGroups,
  getAllSubgroups,
} from "@/lib/queries";
import type { Subgroup } from "@/lib/db";
import TemplatesAdmin from "@/components/admin/TemplatesAdmin";

export const dynamic = "force-dynamic";

export default async function AdminTemplatesPage() {
  const [templateSets, groups, subgroups] = await Promise.all([
    getTemplateSets(),
    getAllGroups(),
    getAllSubgroups(),
  ]);

  const subgroupsByGroup: Record<string, Subgroup[]> = {};
  for (const s of subgroups) (subgroupsByGroup[s.group_id] ??= []).push(s);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
        Шаблоны <span className="text-gradient">расписания</span>
      </h1>
      <p className="font-body text-sm text-muted">
        Шаблон — как блокнот: занятия на неделю по дням. Кнопкой «Применить на
        месяц» расписание разворачивается в занятия на 31 день вперёд.
      </p>
      <TemplatesAdmin
        templateSets={templateSets}
        groups={groups}
        subgroupsByGroup={subgroupsByGroup}
      />
    </div>
  );
}

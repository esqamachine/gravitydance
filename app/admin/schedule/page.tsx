import {
  getAllGroups,
  getAllLessons,
  getAllSubgroups,
  getScheduleTemplates,
} from "@/lib/queries";
import { type Subgroup } from "@/lib/db";
import LessonForm from "@/components/admin/LessonForm";
import GenerateWeekModal from "@/components/admin/GenerateWeekModal";
import ScheduleList from "@/components/admin/ScheduleList";

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

      <ScheduleList lessons={lessons} today={today} />
    </div>
  );
}

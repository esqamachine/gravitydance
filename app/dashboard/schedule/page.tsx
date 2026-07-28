import { getSession } from "@/lib/account";
import {
  getProfileLessons,
  getProfileGroups,
  hasPaidThisMonth,
} from "@/lib/queries";
import ProfileMissing from "@/components/dashboard/ProfileMissing";
import ScheduleCalendar, {
  type CalLesson,
  type LegendItem,
} from "@/components/dashboard/ScheduleCalendar";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const session = await getSession();
  const profile = session?.profile;

  if (!profile) {
    return (
      <ProfileMissing
        contact={session?.email || session?.phone || "неизвестно"}
      />
    );
  }

  const [lessons, groups, paid] = await Promise.all([
    getProfileLessons(profile.id),
    getProfileGroups(profile.id),
    hasPaidThisMonth(profile.id),
  ]);

  const calLessons: CalLesson[] = lessons.map((l) => ({
    id: l.id,
    group_id: l.group_id,
    date: l.date,
    start_time: l.start_time,
    end_time: l.end_time,
    coach_name: l.coach_name,
    status: l.status,
    group_name: l.group_name,
    subgroup_name: l.subgroup_name,
    attendance: l.attendance,
  }));

  const legend: LegendItem[] = groups.map((g) => ({
    group_name: g.group_name,
    subgroup_name: g.subgroup_name,
  }));

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
        Моё <span className="text-gradient">расписание</span>
      </h1>
      <ScheduleCalendar
        lessons={calLessons}
        legend={legend}
        locked={!paid}
      />
    </div>
  );
}

import Link from "next/link";
import { CalendarDays, Users, CreditCard, ArrowRight } from "lucide-react";
import { getSession } from "@/lib/account";
import { getProfileGroups, getProfileLessons } from "@/lib/queries";
import { formatDate } from "@/lib/db";
import ProfileMissing from "@/components/dashboard/ProfileMissing";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const session = await getSession();
  const profile = session?.profile;

  if (!profile) {
    return (
      <ProfileMissing
        contact={session?.email || session?.phone || "неизвестно"}
      />
    );
  }

  const [groups, lessons] = await Promise.all([
    getProfileGroups(profile.id),
    getProfileLessons(profile.id),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const nextLesson = lessons
    .filter((l) => l.date >= today && l.status === "scheduled")
    .sort((a, b) =>
      (a.date + a.start_time).localeCompare(b.date + b.start_time)
    )[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
          Привет, <span className="text-gradient">{profile.first_name}</span>!
        </h1>
        <p className="mt-1 font-body text-muted">
          Рады видеть вас в личном кабинете.
        </p>
      </div>

      {/* Баннер оплаты (заглушка) */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-[1.75rem] border border-white/10 bg-brand-gradient p-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3 text-white">
          <CreditCard size={28} />
          <div>
            <p className="font-heading text-lg font-bold">Оплатить абонемент</p>
            <p className="font-body text-sm text-white/85">
              Быстрая оплата картой — скоро через ЮKassa.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/payments"
          className="rounded-full bg-white/20 px-6 py-3 font-heading text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/30"
        >
          Перейти к оплате
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Мои группы */}
        <div className="rounded-[1.75rem] border border-white/10 bg-card p-6">
          <div className="flex items-center gap-2 font-heading text-lg font-bold text-ink">
            <Users size={20} className="text-primary" /> Мои группы
          </div>
          {groups.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {groups.map((g) => (
                <span
                  key={g.cg_id}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-body text-sm text-primary-light"
                >
                  {g.group_name}
                  {g.subgroup_name && (
                    <span className="text-ink"> → {g.subgroup_name}</span>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-4 font-body text-sm text-muted">
              Вы пока не записаны ни в одну группу.
            </p>
          )}
        </div>

        {/* Ближайшее занятие */}
        <div className="rounded-[1.75rem] border border-white/10 bg-card p-6">
          <div className="flex items-center gap-2 font-heading text-lg font-bold text-ink">
            <CalendarDays size={20} className="text-primary" /> Ближайшее занятие
          </div>
          {nextLesson ? (
            <div className="mt-4">
              <p className="font-heading text-xl font-bold text-ink">
                {nextLesson.group_name}
              </p>
              <p className="mt-1 font-body text-muted">
                {formatDate(nextLesson.date)} ·{" "}
                {nextLesson.start_time.slice(0, 5)}–
                {nextLesson.end_time.slice(0, 5)}
              </p>
              {nextLesson.coach_name && (
                <p className="font-body text-sm text-muted">
                  Тренер: {nextLesson.coach_name}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-4 font-body text-sm text-muted">
              Нет запланированных занятий.
            </p>
          )}
          <Link
            href="/dashboard/schedule"
            className="mt-4 inline-flex items-center gap-1.5 font-heading text-sm font-semibold text-primary-light transition hover:text-primary"
          >
            Всё расписание <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

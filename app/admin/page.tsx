import Link from "next/link";
import { Users, Boxes, CreditCard, CalendarDays, ArrowRight } from "lucide-react";
import {
  getAllProfiles,
  getGroupsWithCounts,
  getAllPayments,
  getAllLessons,
} from "@/lib/queries";
import { formatMoney } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [profiles, groups, payments, lessons] = await Promise.all([
    getAllProfiles(),
    getGroupsWithCounts(),
    getAllPayments(),
    getAllLessons(),
  ]);

  const paidSum = payments
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + Number(p.amount), 0);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = lessons.filter(
    (l) => l.date >= today && l.status === "scheduled"
  ).length;

  const cards = [
    {
      label: "Клиенты",
      value: profiles.length,
      icon: Users,
      href: "/admin/clients",
    },
    { label: "Группы", value: groups.length, icon: Boxes, href: "/admin/groups" },
    {
      label: "Ближайшие занятия",
      value: upcoming,
      icon: CalendarDays,
      href: "/admin/schedule",
    },
    {
      label: "Оплачено",
      value: formatMoney(paidSum),
      icon: CreditCard,
      href: "/admin/payments",
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
        <span className="text-gradient">Обзор</span>
      </h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.label}
              href={c.href}
              className="group rounded-2xl border border-white/10 bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/40"
            >
              <div className="flex items-center justify-between">
                <Icon size={22} className="text-primary" />
                <ArrowRight
                  size={16}
                  className="text-muted transition group-hover:text-primary"
                />
              </div>
              <p className="mt-3 font-heading text-2xl font-extrabold text-ink">
                {c.value}
              </p>
              <p className="font-body text-sm text-muted">{c.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-card p-6">
        <h2 className="font-heading text-lg font-bold text-ink">
          Группы и ученики
        </h2>
        <ul className="mt-4 space-y-2">
          {groups.map((g) => (
            <li
              key={g.id}
              className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"
            >
              <span className="font-body text-ink">{g.name}</span>
              <span className="font-heading text-sm font-semibold text-primary-light">
                {g.student_count} чел.
              </span>
            </li>
          ))}
          {groups.length === 0 && (
            <li className="py-4 text-center font-body text-sm text-muted">
              Нет данных. Выполните SQL-миграцию в Supabase.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

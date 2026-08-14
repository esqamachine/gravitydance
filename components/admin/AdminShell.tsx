"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Boxes,
  CalendarDays,
  CalendarClock,
  ClipboardCheck,
  CreditCard,
  Newspaper,
  Tent,
  Image as ImageIcon,
  LogOut,
  Home,
} from "lucide-react";
import LogoMark from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { signOut } from "@/app/auth/actions";

import type { Role } from "@/lib/db";

// Полное меню руководителя (admin).
const adminItems = [
  { href: "/admin", label: "Обзор", icon: LayoutDashboard },
  { href: "/admin/clients", label: "Клиенты", icon: Users },
  { href: "/admin/groups", label: "Группы", icon: Boxes },
  { href: "/admin/schedule", label: "Расписание", icon: CalendarDays },
  { href: "/admin/templates", label: "Шаблоны", icon: CalendarClock },
  { href: "/admin/attendance", label: "Посещения", icon: ClipboardCheck },
  { href: "/admin/payments", label: "Платежи", icon: CreditCard },
  { href: "/admin/news", label: "Новости", icon: Newspaper },
  { href: "/admin/camps", label: "Сборы", icon: Tent },
  { href: "/admin/gallery", label: "Галерея", icon: ImageIcon },
];

// Меню тренера (coach): только свои группы, расписание, шаблоны, посещения.
const coachItems = [
  { href: "/admin/groups", label: "Мои группы", icon: Boxes },
  { href: "/admin/schedule", label: "Расписание", icon: CalendarDays },
  { href: "/admin/templates", label: "Шаблоны", icon: CalendarClock },
  { href: "/admin/attendance", label: "Посещения", icon: ClipboardCheck },
];

export default function AdminShell({
  name,
  role,
  children,
}: {
  name: string;
  role: Role;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const items = role === "coach" ? coachItems : adminItems;
  const homeHref = role === "coach" ? "/admin/groups" : "/admin";
  const isActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-page">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-page/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[90rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href={homeHref} className="flex items-center gap-2.5">
            <LogoMark className="h-9 w-9" />
            <span className="font-heading text-lg font-extrabold tracking-wide text-ink">
              {role === "coach" ? (
                <>
                  Кабинет<span className="text-gradient">·тренера</span>
                </>
              ) : (
                <>
                  Админ<span className="text-gradient">·панель</span>
                </>
              )}
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden font-body text-sm text-muted md:inline">
              {name}
            </span>
            <ThemeToggle className="h-10 w-10" />
            <Link
              href="/dashboard"
              className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-body text-sm text-ink transition hover:border-primary/40 hover:bg-primary/10 sm:flex"
            >
              <Home size={16} /> ЛК
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-body text-sm text-ink transition hover:border-primary/40 hover:bg-primary/10"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Выйти</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[90rem] gap-8 px-4 pb-24 pt-8 sm:px-6 lg:px-8 lg:pb-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-24 space-y-1">
            {items.map((it) => {
              const Icon = it.icon;
              const active = isActive(it.href);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 font-body text-sm font-medium transition ${
                    active
                      ? "bg-brand-gradient text-white"
                      : "text-muted hover:bg-white/5 hover:text-ink"
                  }`}
                >
                  <Icon size={18} />
                  {it.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {/* Нижняя навигация (мобильный) */}
      <nav className="no-scrollbar fixed inset-x-0 bottom-0 z-30 flex overflow-x-auto border-t border-white/10 bg-page/90 backdrop-blur-xl lg:hidden">
        {items.map((it) => {
          const Icon = it.icon;
          const active = isActive(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex min-w-[4.5rem] flex-1 flex-col items-center gap-1 py-2.5 font-body text-[10px] transition ${
                active ? "text-primary-light" : "text-muted"
              }`}
            >
              <Icon size={20} />
              {it.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

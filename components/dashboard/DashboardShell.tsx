"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  User,
  CalendarDays,
  CreditCard,
  LogOut,
  Shield,
} from "lucide-react";
import LogoMark from "@/components/Logo";
import { signOut } from "@/app/auth/actions";

const items = [
  { href: "/dashboard", label: "Главная", icon: Home },
  { href: "/dashboard/profile", label: "Профиль", icon: User },
  { href: "/dashboard/schedule", label: "Расписание", icon: CalendarDays },
  { href: "/dashboard/payments", label: "Оплата", icon: CreditCard },
];

export default function DashboardShell({
  name,
  isAdmin,
  children,
}: {
  name: string;
  isAdmin: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-base">
      {/* Хедер */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-base/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <LogoMark className="h-9 w-9" />
            <span className="hidden font-heading text-lg font-extrabold tracking-wide text-ink sm:inline">
              Гравитация
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden font-body text-sm text-muted sm:inline">
              {name}
            </span>
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

      <div className="mx-auto flex max-w-7xl gap-8 px-4 pb-24 pt-8 sm:px-6 lg:px-8 lg:pb-8">
        {/* Боковое меню (десктоп) */}
        <aside className="hidden w-60 shrink-0 lg:block">
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
            {isAdmin && (
              <Link
                href="/admin"
                className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3 font-body text-sm font-medium text-primary-light transition hover:bg-white/5"
              >
                <Shield size={18} />
                Админ-панель
              </Link>
            )}
          </nav>
        </aside>

        {/* Контент */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {/* Нижняя навигация (мобильный) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-base/90 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-around">
          {items.map((it) => {
            const Icon = it.icon;
            const active = isActive(it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`flex flex-1 flex-col items-center gap-1 py-2.5 font-body text-[11px] transition ${
                  active ? "text-primary-light" : "text-muted"
                }`}
              >
                <Icon size={22} />
                {it.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

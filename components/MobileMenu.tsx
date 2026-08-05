"use client";

import Link from "next/link";
import { X, Phone, User } from "lucide-react";
import { navLinks, contacts } from "@/lib/data";
import { useDashboardHref } from "@/lib/useDashboardHref";
import LogoMark from "./Logo";
import ThemeToggle from "./ThemeToggle";

export default function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const dashboardHref = useDashboardHref();
  return (
    <>
      {/* Затемнение */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 xl:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
      />

      {/* Выезжающая панель */}
      <aside
        className={`fixed right-0 top-0 z-[60] flex h-full w-[82%] max-w-sm flex-col border-l border-white/10 bg-card shadow-2xl transition-transform duration-300 ease-out xl:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Меню"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <Link href="/" onClick={onClose} className="flex items-center gap-2.5">
            <LogoMark className="h-9 w-9" />
            <span className="font-heading text-lg font-extrabold tracking-wide text-ink">
              Гравитация
            </span>
          </Link>
          <button
            onClick={onClose}
            aria-label="Закрыть меню"
            className="rounded-full p-1.5 text-muted transition hover:bg-white/5 hover:text-ink"
          >
            <X size={26} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="rounded-xl px-4 py-3 font-body text-lg text-ink/90 transition hover:bg-white/5 hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="space-y-3 border-t border-white/10 p-5">
          <div className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-4 py-2">
            <span className="font-body text-sm font-medium text-ink">Тема</span>
            <ThemeToggle />
          </div>
          <a
            href={contacts.phoneHref}
            className="flex items-center justify-center gap-2 font-body text-base font-semibold text-ink"
          >
            <Phone size={16} className="text-primary" />
            {contacts.phone}
          </a>
          <Link
            href={dashboardHref}
            onClick={onClose}
            className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-center font-heading text-sm font-semibold text-ink transition hover:border-primary/40"
          >
            <User size={16} className="text-primary" />
            Личный кабинет
          </Link>
          <Link
            href="/#signup"
            onClick={onClose}
            className="btn-cta block px-6 py-3.5 text-center font-heading font-bold"
          >
            Записаться
          </Link>
        </div>
      </aside>
    </>
  );
}

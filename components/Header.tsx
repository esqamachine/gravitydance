"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Phone, Menu, MoreVertical, User } from "lucide-react";
import { contacts, primaryNavLinks, secondaryNavLinks } from "@/lib/data";
import { useDashboardHref } from "@/lib/useDashboardHref";
import LogoMark from "./Logo";
import MobileMenu from "./MobileMenu";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const dashboardHref = useDashboardHref();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Закрывать выпадающее «Ещё» по клику вне его
  useEffect(() => {
    if (!moreOpen) return;
    const onClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [moreOpen]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 border-b transition-all duration-300 ${
          scrolled
            ? "border-white/10 bg-page/80 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
            : "border-transparent bg-page/30 backdrop-blur-md"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative flex h-14 items-center justify-between gap-4 xl:h-16">
            {/* Лого + телефон (десктоп) */}
            <div className="flex items-center gap-3 sm:gap-5">
              <Link href="/" className="flex items-center gap-2.5">
                <LogoMark className="h-9 w-9 shrink-0 xl:h-10 xl:w-10" />
                <span className="hidden font-heading text-lg font-extrabold tracking-wide text-ink xl:inline">
                  Гравитация
                </span>
              </Link>

              <a
                href={contacts.phoneHref}
                className="hidden items-center gap-1.5 font-body text-sm font-semibold text-ink/90 transition hover:text-primary-light xl:inline-flex"
              >
                <Phone size={16} className="text-primary" />
                {contacts.phone}
              </a>
            </div>

            {/* Телефон по центру (мобайл / планшет) */}
            <a
              href={contacts.phoneHref}
              className="absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 font-body text-sm font-semibold text-ink transition hover:text-primary-light xl:hidden"
            >
              <Phone size={15} className="text-primary" />
              {contacts.phone}
            </a>

            {/* Правая группа (десктоп): навигация + CTA + бургер «Ещё» */}
            <div className="hidden items-center gap-4 xl:flex">
              {/* Навигация — 5 видимых пунктов в одну строку */}
              <nav className="flex flex-nowrap items-center gap-1">
                {primaryNavLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="whitespace-nowrap rounded-full px-3 py-2 font-body text-sm font-medium text-muted transition hover:bg-white/5 hover:text-ink"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* Бургер «Ещё» + кнопка «Записаться» (бургер левее кнопки) */}
              <div className="flex items-center gap-2.5">
                <ThemeToggle className="h-10 w-10" />
                <div className="relative" ref={moreRef}>
                  <button
                    onClick={() => setMoreOpen((v) => !v)}
                    aria-label="Ещё"
                    aria-expanded={moreOpen}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-ink transition hover:bg-white/5 ${
                      moreOpen ? "bg-white/5" : ""
                    }`}
                  >
                    <MoreVertical size={22} />
                  </button>

                  {/* Выпадающее меню */}
                  <div
                    className={`absolute right-0 top-full mt-2 w-48 origin-top-right rounded-2xl border border-white/10 bg-card p-2 shadow-2xl transition duration-150 ${
                      moreOpen
                        ? "pointer-events-auto scale-100 opacity-100"
                        : "pointer-events-none scale-95 opacity-0"
                    }`}
                  >
                    {secondaryNavLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMoreOpen(false)}
                        className="block rounded-xl px-4 py-2.5 font-body text-sm font-medium text-muted transition hover:bg-white/5 hover:text-ink"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <Link
                  href={dashboardHref}
                  aria-label="Личный кабинет"
                  title="Личный кабинет"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-ink transition hover:border-primary/40 hover:bg-white/5"
                >
                  <User size={20} />
                </Link>

                <Link
                  href="/#signup"
                  className="btn-cta shrink-0 px-6 py-3 font-heading text-sm font-bold"
                >
                  Записаться
                </Link>
              </div>
            </div>

            {/* Тумблер темы + бургер (мобайл / планшет) */}
            <div className="flex items-center gap-1 xl:hidden">
              <ThemeToggle />
              <button
                onClick={() => setMenuOpen(true)}
                aria-label="Открыть меню"
                className="-mr-1.5 flex h-11 w-11 items-center justify-center rounded-lg text-ink transition hover:bg-white/5"
              >
                <Menu size={26} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

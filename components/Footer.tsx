import Link from "next/link";
import { Send, Phone } from "lucide-react";
import { contacts } from "@/lib/data";
import LogoMark from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-between">
          {/* Лого */}
          <div className="flex flex-col items-center gap-3 lg:items-start">
            <Link href="/" className="flex items-center gap-2.5">
              <LogoMark className="h-10 w-10" />
              <span className="font-heading text-lg font-extrabold tracking-wide text-ink">
                Гравитация
              </span>
            </Link>
            <p className="max-w-xs text-center font-body text-sm text-muted lg:text-left">
              Современный танец с элементами акробатики для детей и взрослых.
            </p>
            <a
              href={contacts.phoneHref}
              className="flex items-center gap-1.5 font-body text-sm font-semibold text-ink transition hover:text-primary-light"
            >
              <Phone size={15} className="text-primary" />
              {contacts.phone}
            </a>
          </div>

          {/* Навигация */}
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-body text-sm text-muted">
            <Link href="/#about" className="transition hover:text-ink">
              О студии
            </Link>
            <Link href="/#groups" className="transition hover:text-ink">
              Группы
            </Link>
            <Link href="/#signup" className="transition hover:text-ink">
              Записаться
            </Link>
            <Link href="/#faq" className="transition hover:text-ink">
              Вопросы
            </Link>
            <Link href="/#news" className="transition hover:text-ink">
              Новости
            </Link>
            <Link href="/#camps" className="transition hover:text-ink">
              Сборы
            </Link>
            <Link href="/policy" className="transition hover:text-ink">
              Документы
            </Link>
          </nav>

          {/* Соцсети */}
          <div className="flex items-center gap-3">
            <a
              href={contacts.telegram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Telegram"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-ink transition hover:border-primary/40 hover:bg-primary/10"
            >
              <Send size={18} />
            </a>
            <a
              href={contacts.vk}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="ВКонтакте"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 font-heading text-sm font-bold text-ink transition hover:border-primary/40 hover:bg-primary/10"
            >
              VK
            </a>
          </div>
        </div>

        <div className="mt-10 space-y-1.5 border-t border-white/10 pt-6 text-center font-body text-sm text-muted">
          <p>© 2026 Студия танца «Гравитация». Все права защищены.</p>
          <p className="text-xs">
            ИП Лисовская Алина Игоревна · ИНН 503827644160 · ОГРН
            326508100404092
          </p>
        </div>
      </div>
    </footer>
  );
}

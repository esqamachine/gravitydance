import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Общая обёртка страниц авторизации: орбы, центрированная карточка, лого, заголовок.
 *  Логотип — обычный <img> (без next/image). */
export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16">
      {/* Орбы */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-10 h-96 w-96 animate-orb-1 rounded-full bg-primary/25 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 animate-orb-2 rounded-full bg-violet/25 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 font-body text-sm text-muted transition hover:text-ink"
        >
          <ArrowLeft size={16} /> На главную
        </Link>

        <div className="rounded-[2rem] border border-white/10 bg-card p-6 shadow-2xl sm:p-8">
          <div className="flex flex-col items-center text-center">
            <img
              src="/images/logo-dancer.png"
              alt="Логотип студии Гравитация"
              className="h-14 w-14 object-contain"
            />
            <h1 className="mt-4 font-heading text-2xl font-bold text-ink">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 font-body text-sm text-muted">{subtitle}</p>
            )}
          </div>

          <div className="mt-6">{children}</div>
        </div>

        {footer && (
          <div className="mt-4 text-center font-body text-sm text-muted">
            {footer}
          </div>
        )}
      </div>
    </main>
  );
}

import Link from "next/link";
import LogoMark from "./Logo";

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center justify-center overflow-hidden pt-28 pb-20"
    >
      {/* Анимированные орбы */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-10 h-[26rem] w-[26rem] animate-orb-1 rounded-full bg-primary/25 blur-[110px]" />
        <div className="absolute right-[-6rem] top-1/3 h-[30rem] w-[30rem] animate-orb-2 rounded-full bg-violet/25 blur-[120px]" />
        <div className="absolute bottom-[-8rem] left-1/3 h-[24rem] w-[24rem] animate-orb-3 rounded-full bg-pink/20 blur-[110px]" />
      </div>

      {/* Сетка-паттерн + виньетка */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(7,11,26,0.9))]" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        {/* Крупный логотип-танцовщица */}
        <div className="mb-8 flex justify-center">
          <div className="relative animate-fade-in-up">
            <LogoMark
              className="h-24 w-24 drop-shadow-[0_0_35px_rgba(167,139,250,0.35)] sm:h-40 sm:w-40"
              priority
            />
            {/* Свечение в цвет градиента */}
            <div className="absolute inset-0 -z-10 scale-110 rounded-full bg-brand-gradient opacity-30 blur-3xl" />
            <div className="absolute inset-0 -z-10 animate-spin-slow rounded-full bg-primary/10 blur-2xl" />
          </div>
        </div>

        {/* Бейдж */}
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 font-body text-sm font-medium text-primary-light backdrop-blur-sm">
          ✦ Современный танец · Акробатика
        </span>

        <h1 className="mt-6 font-heading text-[clamp(2.25rem,7vw,4.25rem)] font-extrabold leading-[1.08] tracking-tight text-ink">
          Студия танца
          <br />
          <span className="text-gradient">«Гравитация»</span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl font-body text-[clamp(1rem,4vw,1.5rem)] font-light text-muted">
          Стань центром притяжения
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/#signup"
            className="btn-cta w-full px-8 py-4 font-heading text-base font-bold sm:w-auto"
          >
            Записаться →
          </Link>
          <Link
            href="/login"
            className="btn-cta w-full px-8 py-4 font-heading text-base font-bold sm:w-auto"
          >
            Оплатить абонемент
          </Link>
        </div>
      </div>

      {/* Индикатор скролла */}
      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 animate-bounce text-muted/70">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 5v14M5 12l7 7 7-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </section>
  );
}

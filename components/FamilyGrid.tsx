"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { familyBlocks } from "@/lib/data";
import Reveal from "./Reveal";

export default function FamilyGrid() {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const rafRef = useRef<number | undefined>(undefined);
  const [active, setActive] = useState(0);

  /** Ширина «шага» = расстояние между началами двух карточек (карточка + gap). */
  const getStep = () => {
    const el = trackRef.current;
    if (!el) return 0;
    const kids = el.children;
    if (kids.length >= 2) {
      return (
        (kids[1] as HTMLElement).offsetLeft - (kids[0] as HTMLElement).offsetLeft
      );
    }
    return (kids[0] as HTMLElement)?.offsetWidth ?? 0;
  };

  /**
   * Плавная прокрутка своим rAF-твином: присваиваем scrollLeft напрямую.
   * Нативный behavior:"smooth" в Chromium отменяется scroll-snap'ом, поэтому
   * на время анимации отключаем snap и возвращаем его по завершении.
   */
  const smoothTo = useCallback((target: number) => {
    const el = trackRef.current;
    if (!el) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const prevSnap = el.style.scrollSnapType;
    el.style.scrollSnapType = "none";

    const from = el.scrollLeft;
    const max = el.scrollWidth - el.clientWidth;
    const to = Math.max(0, Math.min(target, max));
    const duration = 500;
    const startTime = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    const stepFn = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1);
      el.scrollLeft = from + (to - from) * ease(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(stepFn);
      } else {
        el.style.scrollSnapType = prevSnap;
        rafRef.current = undefined;
      }
    };
    rafRef.current = requestAnimationFrame(stepFn);
  }, []);

  const scrollByCards = useCallback(
    (dir: 1 | -1) => {
      const el = trackRef.current;
      if (!el) return;
      const step = getStep();
      const max = el.scrollWidth - el.clientWidth;
      const atEnd = el.scrollLeft >= max - 4;
      const atStart = el.scrollLeft <= 4;

      if (dir === 1) smoothTo(atEnd ? 0 : el.scrollLeft + step);
      else smoothTo(atStart ? max : el.scrollLeft - step);
    },
    [smoothTo]
  );

  /* Автопрокрутка каждые 4 секунды (пауза при наведении) */
  useEffect(() => {
    const id = setInterval(() => {
      if (!pausedRef.current) scrollByCards(1);
    }, 4000);
    return () => {
      clearInterval(id);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [scrollByCards]);

  /* Активная точка-индикатор по позиции скролла */
  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const step = getStep();
    if (step > 0) setActive(Math.round(el.scrollLeft / step));
  };

  const goTo = (i: number) => smoothTo(getStep() * i);

  return (
    <section id="family" className="relative overflow-hidden py-20 md:py-28">
      {/* Декоративный полный логотип-водяной знак за заголовком */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/logo-full.png"
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="pointer-events-none absolute left-1/2 top-4 z-0 w-[260px] max-w-[70%] -translate-x-1/2 select-none opacity-[0.06] sm:w-[340px]"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <p className="font-heading text-sm font-semibold uppercase tracking-[0.25em] text-primary">
            Наша атмосфера
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold text-ink sm:text-4xl md:text-5xl">
            Мы не клуб — <span className="text-gradient">мы семья</span>
          </h2>
        </Reveal>
      </div>

      {/* Лента-карусель */}
      <div
        className="group/carousel relative mt-14"
        onMouseEnter={() => (pausedRef.current = true)}
        onMouseLeave={() => (pausedRef.current = false)}
      >
        {/* Кнопки навигации */}
        <button
          onClick={() => scrollByCards(-1)}
          aria-label="Предыдущая карточка"
          className="absolute left-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-base/70 text-ink backdrop-blur-md transition hover:border-primary/50 hover:bg-base sm:left-4 lg:left-6"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          onClick={() => scrollByCards(1)}
          aria-label="Следующая карточка"
          className="absolute right-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-base/70 text-ink backdrop-blur-md transition hover:border-primary/50 hover:bg-base sm:right-4 lg:right-6"
        >
          <ChevronRight size={22} />
        </button>

        <div
          ref={trackRef}
          onScroll={onScroll}
          className="no-scrollbar touch-scroll-x flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 sm:px-6 lg:px-8"
        >
          {familyBlocks.map((block) => (
            <article
              key={block.title}
              className="group relative min-h-[340px] w-[85vw] shrink-0 snap-center overflow-hidden rounded-[1.75rem] ring-1 ring-white/10 sm:w-[420px] md:min-h-[360px]"
            >
              {/* Градиентная база (видна, пока нет фото) */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-violet/25 to-pink/25" />

              {/* Фоновое фото (/images/family/*.jpg) — подхватится при добавлении */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-105"
                style={{ backgroundImage: `url(${block.img})` }}
              />

              {/* Тёмный overlay-градиент */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10 transition-opacity duration-500 group-hover:opacity-70" />

              {/* Эмодзи-подсказка (пока фото — заглушки) */}
              <span className="absolute right-6 top-5 text-5xl opacity-80 drop-shadow-lg transition group-hover:scale-110">
                {block.emoji}
              </span>

              {/* Контент поверх фото */}
              <div className="relative flex h-full min-h-[340px] flex-col justify-end p-7 md:min-h-[360px] md:p-8">
                <h3 className="font-heading text-2xl font-bold text-white sm:text-[1.7rem]">
                  {block.title}
                </h3>
                <p className="mt-3 font-body leading-relaxed text-white/90">
                  {block.text}
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* Точки-индикаторы */}
        <div className="mt-8 flex justify-center gap-2">
          {familyBlocks.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Перейти к карточке ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                active === i
                  ? "w-6 bg-brand-gradient"
                  : "w-2 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

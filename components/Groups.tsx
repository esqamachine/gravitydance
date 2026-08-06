"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { groups } from "@/lib/data";
import Reveal from "./Reveal";
import LogoMark from "./Logo";
import Photo from "./Photo";

export default function Groups() {
  const [active, setActive] = useState(groups[0].id);
  const index = groups.findIndex((g) => g.id === active);
  const group = groups[index] ?? groups[0];

  /** Переключение с зацикливанием */
  const go = (dir: 1 | -1) =>
    setActive(groups[(index + dir + groups.length) % groups.length].id);

  return (
    <section id="groups" className="relative py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <p className="font-heading text-sm font-semibold uppercase tracking-[0.25em] text-primary">
            Танцуй с нами
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold text-ink sm:text-4xl md:text-5xl">
            Наши <span className="text-gradient">группы</span>
          </h2>
        </Reveal>

        {/* Табы */}
        <Reveal delay={100}>
          <div className="no-scrollbar touch-scroll-x mt-10 flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:justify-center sm:overflow-visible">
            {groups.map((g) => {
              const isActive = g.id === active;
              return (
                <button
                  key={g.id}
                  onClick={() => setActive(g.id)}
                  aria-pressed={isActive}
                  className={`min-h-[44px] whitespace-nowrap rounded-full px-4 py-3 font-heading text-sm font-semibold transition duration-300 ${
                    isActive
                      ? "btn-cta"
                      : "border border-white/10 bg-white/5 text-muted hover:border-primary/40 hover:text-ink"
                  }`}
                >
                  <span className="mr-1.5">{g.emoji}</span>
                  {g.tab}
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* Карточка активной группы */}
        <div className="mt-8">
          <article
            key={group.id}
            className="grid h-[600px] animate-fade-in-up grid-rows-[220px_1fr] overflow-hidden rounded-[2rem] border border-white/10 bg-card md:h-[440px] md:grid-cols-2 md:grid-rows-1"
          >
            {/* Визуал — фото группы (эмодзи/градиент как fallback).
                object-cover заполняет всю область карточки, одинаково для всех
                групп: мобилка — горизонтальный прямоугольник сверху, десктоп —
                левая половина карточки. Без полей и рамок вокруг. */}
            <div className="relative flex h-full items-center justify-center overflow-hidden bg-surface">
              <div className="absolute -left-10 top-0 h-56 w-56 animate-orb-1 rounded-full bg-primary/25 blur-[80px]" />
              <div className="absolute bottom-0 right-0 h-56 w-56 animate-orb-3 rounded-full bg-pink/20 blur-[80px]" />
              <span className="relative z-[1] text-7xl opacity-70 drop-shadow-[0_0_30px_rgba(167,139,250,0.4)]">
                {group.emoji}
              </span>

              {/* Фото из /public/images/groups/ */}
              <Photo
                key={group.id}
                src={group.img}
                alt={group.title}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="z-[2]"
              />
            </div>

            {/* Информация — фиксированная высота ячейки, кнопки прижаты к низу
                (mt-auto), описание обрезается (line-clamp), чтобы карточки всех
                групп были одинаковой высоты независимо от объёма текста. */}
            <div className="flex h-full flex-col overflow-hidden p-6 sm:p-8 md:p-8">
              <h3 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
                {group.title}
              </h3>
              <p className="mt-3 line-clamp-3 font-body text-base leading-relaxed text-muted md:line-clamp-4">
                {group.description}
              </p>

              {group.subgroups && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 font-body text-sm font-semibold text-ink/80">
                    <Users size={16} className="text-primary" /> Подгруппы
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {group.subgroups.map((sg) => (
                      <span
                        key={sg}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-body text-sm text-primary-light"
                      >
                        {sg}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 flex items-center gap-2 font-body text-sm text-ink/80">
                <CalendarDays size={16} className="text-primary" />
                <span>Расписание: {group.schedule}</span>
              </div>

              <div className="mt-auto flex flex-col gap-3 pt-6 sm:flex-row sm:self-start">
                <Link
                  href="/#signup"
                  className="btn-cta block w-full px-8 py-3.5 text-center font-heading text-sm font-bold sm:w-auto"
                >
                  Записаться
                </Link>
                <Link
                  href="/login"
                  className="btn-cta block w-full px-8 py-3.5 text-center font-heading text-sm font-bold sm:w-auto"
                >
                  Оплатить абонемент
                </Link>
              </div>
            </div>
          </article>

          {/* Кнопки пролистывания групп (с зацикливанием) */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={() => go(-1)}
              aria-label="Предыдущая группа"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-ink transition hover:border-primary/50 hover:bg-primary/10"
            >
              <ChevronLeft size={22} />
            </button>
            <span className="min-w-[7.5rem] text-center font-heading text-sm font-semibold text-muted">
              {index + 1} / {groups.length}
            </span>
            <button
              onClick={() => go(1)}
              aria-label="Следующая группа"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-ink transition hover:border-primary/50 hover:bg-primary/10"
            >
              <ChevronRight size={22} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

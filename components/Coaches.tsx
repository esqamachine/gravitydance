"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { coaches } from "@/lib/coaches";
import Reveal from "./Reveal";
import Photo from "./Photo";

export default function Coaches() {
  const [index, setIndex] = useState(0);
  const coach = coaches[index];

  const go = (dir: 1 | -1) =>
    setIndex((i) => (i + dir + coaches.length) % coaches.length);

  return (
    <section id="coaches" className="relative py-16 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <p className="font-heading text-sm font-semibold uppercase tracking-[0.25em] text-primary">
            Команда
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold text-ink sm:text-4xl md:text-5xl">
            Наши <span className="text-gradient">тренеры</span>
          </h2>
        </Reveal>

        {/* Один тренер на весь блок */}
        <div
          key={coach.name}
          className="mt-12 grid animate-fade-in-up gap-6 lg:grid-cols-2 lg:gap-8"
        >
          {/* Левая колонка — квадратное фото + ФИО */}
          <div className="relative aspect-square overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-primary/30 via-violet/25 to-pink/25 ring-1 ring-white/10">
            <Photo
              src={coach.photo}
              alt={coach.name}
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {/* Градиент + ФИО */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
            <h3 className="absolute inset-x-0 bottom-0 p-6 font-heading text-2xl font-bold text-white sm:text-3xl">
              {coach.name}
            </h3>
          </div>

          {/* Правая колонка — роль + цитата + группы. Компактная: по высоте
              меньше фото (self-start вместо растягивания на всю строку grid). */}
          <div className="rounded-[1.75rem] border border-white/10 bg-card p-5 sm:p-6 lg:self-start">
            <p className="font-heading text-xl font-bold text-ink sm:text-2xl">
              <span className="text-gradient">{coach.role}</span>
            </p>
            <p className="mt-2 line-clamp-2 font-body text-sm italic leading-snug text-muted">
              «{coach.quote}»
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {coach.groups.map((g) => (
                <span
                  key={g}
                  className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-body text-xs font-medium text-primary-light"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Кнопки переключения + счётчик */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={() => go(-1)}
            aria-label="Предыдущий тренер"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 text-ink transition hover:border-primary/50 hover:bg-primary/10"
          >
            <ChevronLeft size={24} />
          </button>
          <span className="min-w-[4rem] text-center font-heading text-sm font-semibold text-muted">
            {index + 1} / {coaches.length}
          </span>
          <button
            onClick={() => go(1)}
            aria-label="Следующий тренер"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 text-ink transition hover:border-primary/50 hover:bg-primary/10"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </section>
  );
}

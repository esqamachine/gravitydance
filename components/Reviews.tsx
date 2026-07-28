"use client";

import { useState } from "react";
import { Star, Quote, ChevronDown } from "lucide-react";
import { reviews } from "@/lib/data";
import Reveal from "./Reveal";

export default function Reviews() {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? reviews : reviews.slice(0, 2);

  return (
    <section id="reviews" className="relative py-16 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <p className="font-heading text-sm font-semibold uppercase tracking-[0.25em] text-primary">
            Нам доверяют
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold text-ink sm:text-4xl md:text-5xl">
            <span className="text-gradient">Отзывы</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {visible.map((r, i) => (
            <figure
              key={r.name}
              className={`flex h-full flex-col rounded-[1.75rem] border border-white/10 bg-card p-6 transition duration-300 hover:border-primary/30 sm:p-7 ${
                i >= 2 ? "animate-fade-in-up" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex gap-1 text-primary-light">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} size={18} fill="currentColor" strokeWidth={0} />
                  ))}
                </div>
                <Quote size={28} className="text-white/10" />
              </div>
              <blockquote className="mt-4 flex-1 font-body leading-relaxed text-ink/90">
                «{r.text}»
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-gradient font-heading font-bold text-white">
                  {r.name.charAt(0)}
                </span>
                <span>
                  <span className="block font-heading font-semibold text-ink">
                    {r.name}
                  </span>
                  <span className="block font-body text-sm text-muted">
                    {r.group}
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="btn-ghost inline-flex min-h-[48px] items-center gap-2 px-8 py-3 font-heading text-sm font-semibold"
          >
            {showAll ? "Скрыть" : "Показать все отзывы"}
            <ChevronDown
              size={18}
              className={`transition-transform duration-300 ${
                showAll ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Reveal from "./Reveal";

/** Пути к фото галереи: 01.jpg … 50.jpg */
const galleryPaths = Array.from(
  { length: 50 },
  (_, i) => `/images/gallery/${String(i + 1).padStart(2, "0")}.jpg`
);

const SPEED = 28; // px в секунду (~1px за 35ms)

export default function Gallery() {
  const [failed, setFailed] = useState<Set<number>>(new Set());
  const [paused, setPaused] = useState(false);
  const [duration, setDuration] = useState(600);
  const trackRef = useRef<HTMLDivElement>(null);

  // видимые (не сломанные) фото
  const visible = galleryPaths
    .map((src, i) => ({ src, i }))
    .filter((x) => !failed.has(x.i));
  const loop = [...visible, ...visible]; // две копии для бесшовной прокрутки

  // Длительность анимации = ширина одной копии / скорость
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const oneCopy = el.scrollWidth / 2;
    if (oneCopy > 0) setDuration(oneCopy / SPEED);
  }, [visible.length]);

  return (
    <section
      id="gallery"
      className="bg-light-section py-16 text-[#0D1428] md:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <h2 className="font-heading text-3xl font-bold sm:text-4xl md:text-5xl">
            <span className="text-gradient">Галерея</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl font-body text-base text-[#4a5578] sm:text-lg">
            Сборы, конкурсы, выступления и яркие моменты нашей студии.
          </p>
        </Reveal>
      </div>

      {/* Бесконечная лента */}
      <div
        className="group relative mt-12 overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        {/* мягкие края */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-light-section to-transparent sm:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-light-section to-transparent sm:w-24" />

        <div
          ref={trackRef}
          className="animate-marquee flex w-max gap-4"
          style={{
            animationDuration: `${duration}s`,
            animationPlayState: paused ? "paused" : "running",
          }}
        >
          {loop.map((item, idx) => (
            <div
              key={idx}
              className="relative h-52 w-72 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-violet/20 to-pink/20 ring-1 ring-black/5 sm:h-64 sm:w-80"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt="Фото студии Гравитация"
                loading="lazy"
                onError={() =>
                  setFailed((prev) => {
                    if (prev.has(item.i)) return prev;
                    const next = new Set(prev);
                    next.add(item.i);
                    return next;
                  })
                }
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/gallery"
          className="btn-cta inline-flex items-center gap-2 px-8 py-3.5 font-heading text-sm font-bold"
        >
          Все фото
          <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  );
}

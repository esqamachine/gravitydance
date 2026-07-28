"use client";

import { useCallback, useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const galleryPaths = Array.from(
  { length: 50 },
  (_, i) => `/images/gallery/${String(i + 1).padStart(2, "0")}.jpg`
);

export default function GalleryFull() {
  const [failed, setFailed] = useState<Set<number>>(new Set());
  const [active, setActive] = useState<number | null>(null);

  const visible = galleryPaths
    .map((src, i) => ({ src, i }))
    .filter((x) => !failed.has(x.i));

  const close = useCallback(() => setActive(null), []);
  const step = useCallback(
    (dir: 1 | -1) => {
      setActive((cur) => {
        if (cur === null || visible.length === 0) return cur;
        const pos = visible.findIndex((v) => v.i === cur);
        const next = (pos + dir + visible.length) % visible.length;
        return visible[next].i;
      });
    },
    [visible]
  );

  // Управление с клавиатуры
  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, close, step]);

  const markFailed = (i: number) =>
    setFailed((prev) => {
      if (prev.has(i)) return prev;
      const next = new Set(prev);
      next.add(i);
      return next;
    });

  return (
    <>
      {/* Masonry-сетка: 2 колонки моб. / 3 десктоп */}
      <div className="columns-2 gap-4 [&>*]:mb-4 md:columns-3">
        {visible.map(({ src, i }) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className="block w-full overflow-hidden rounded-2xl ring-1 ring-white/10 transition duration-300 hover:opacity-90 hover:ring-primary/40"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`Фото галереи ${i + 1}`}
              loading="lazy"
              onError={() => markFailed(i)}
              className="w-full"
            />
          </button>
        ))}
      </div>

      {/* Лайтбокс */}
      {active !== null && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <button
            onClick={close}
            aria-label="Закрыть"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <X size={26} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
            aria-label="Предыдущее фото"
            className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-6"
          >
            <ChevronLeft size={26} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
            aria-label="Следующее фото"
            className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-6"
          >
            <ChevronRight size={26} />
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={galleryPaths[active]}
            alt={`Фото галереи ${active + 1}`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </>
  );
}

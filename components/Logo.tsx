"use client";

import { useState } from "react";

/**
 * Логотип студии «Гравитация».
 *
 * По умолчанию — знак-танцовщица `/images/logo-dancer.png` (квадратный, прозрачный
 * фон). Через `src` можно передать полный логотип `/images/logo-full.png` (с текстом).
 * Если файл не загрузился — рисуется запасной inline-SVG-знак, чтобы шапка
 * никогда не «ломалась».
 *
 * Размер задаётся через className (например `h-10 w-10`).
 */
export default function LogoMark({
  className = "",
  title = "Логотип студии Гравитация",
  priority = false,
  src = "/images/logo-dancer.png",
}: {
  className?: string;
  title?: string;
  priority?: boolean;
  src?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!failed) {
    return (
      <span className={`relative inline-block overflow-hidden ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={title}
          loading={priority ? "eager" : "lazy"}
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-contain"
        />
      </span>
    );
  }

  // Запасной знак (SVG)
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="grav-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4AADDF" />
          <stop offset="55%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#F472B6" />
        </linearGradient>
      </defs>

      {/* Орбиты */}
      <g
        fill="none"
        stroke="url(#grav-grad)"
        strokeWidth="2.2"
        strokeLinecap="round"
      >
        <ellipse cx="32" cy="32" rx="26" ry="11" opacity="0.9" />
        <ellipse
          cx="32"
          cy="32"
          rx="26"
          ry="11"
          transform="rotate(60 32 32)"
          opacity="0.55"
        />
        <ellipse
          cx="32"
          cy="32"
          rx="26"
          ry="11"
          transform="rotate(120 32 32)"
          opacity="0.35"
        />
      </g>

      {/* Фигура танцовщицы (силуэт) */}
      <g fill="url(#grav-grad)">
        <circle cx="32" cy="18" r="4" />
        <path d="M32 22 C29 27 27 30 22 31 C27 32 30 34 31 39 C29 44 27 47 24 49 C29 47 31 46 32 43 C33 46 35 47 40 49 C37 47 35 44 33 39 C34 34 37 32 42 31 C37 30 35 27 32 22 Z" />
      </g>

      {/* Центральное ядро */}
      <circle cx="32" cy="32" r="3" fill="#fff" opacity="0.9" />
    </svg>
  );
}

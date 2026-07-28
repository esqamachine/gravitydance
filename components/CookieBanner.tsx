"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const COOKIE_NAME = "cookie_consent";
const MAX_AGE = 60 * 60 * 24 * 365; // 365 дней

function hasConsent(): boolean {
  return document.cookie
    .split("; ")
    .some((c) => c.trim() === `${COOKIE_NAME}=true`);
}

export default function CookieBanner() {
  // null — ещё не проверяли (на сервере и до монтирования баннера нет)
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!hasConsent()) setVisible(true);
  }, []);

  const accept = () => {
    document.cookie = `${COOKIE_NAME}=true; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
    setLeaving(true);
    // даём отыграть анимации ухода, потом снимаем с рендера
    setTimeout(() => setVisible(false), 300);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Использование файлов cookie"
      className={`fixed inset-x-0 bottom-0 z-[100] transition-all duration-300 ${
        leaving ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="mx-auto max-w-4xl px-0 sm:px-4 sm:pb-4">
        <div className="flex flex-col gap-3 rounded-t-2xl border border-white/10 bg-[rgba(10,10,20,0.95)] px-4 py-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:rounded-2xl sm:px-5">
          <p className="font-body text-xs leading-relaxed text-muted sm:text-sm">
            Мы используем файлы cookie для улучшения работы сайта. Продолжая
            использовать сайт, вы соглашаетесь с{" "}
            <Link
              href="/policy"
              className="text-primary underline-offset-2 transition hover:underline"
            >
              Политикой конфиденциальности
            </Link>
          </p>
          <button
            onClick={accept}
            className="btn-cta shrink-0 px-6 py-2.5 font-heading text-sm font-bold sm:px-7"
          >
            Принять
          </button>
        </div>
      </div>
    </div>
  );
}

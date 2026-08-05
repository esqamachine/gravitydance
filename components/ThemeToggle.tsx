"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

/**
 * Переключатель светлой/тёмной темы. Тема хранится в localStorage('theme') и
 * применяется классом `dark` на <html> (см. до-гидрационный скрипт в layout).
 * По умолчанию — тёмная.
 */
export default function ThemeToggle({
  className = "",
}: {
  className?: string;
}) {
  const [dark, setDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    const root = document.documentElement;
    root.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* localStorage недоступен — просто не сохраняем */
    }
  };

  // До монтирования показываем нейтральную иконку (избегаем рассинхрона гидрации)
  const isDark = mounted ? dark : true;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
      title={isDark ? "Светлая тема" : "Тёмная тема"}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 text-ink transition hover:border-primary/40 hover:bg-white/5 ${className}`}
    >
      {isDark ? (
        <Sun size={20} className="text-primary-light" />
      ) : (
        <Moon size={20} className="text-primary" />
      )}
    </button>
  );
}

"use client";

import { useState } from "react";

/**
 * Фото — обычный <img> (fill + object-cover) с плавным появлением.
 * Если файл отсутствует/не загрузился — компонент скрывается, открывая
 * градиентную подложку контейнера (контейнер должен быть `relative`).
 */
export default function Photo({
  src,
  alt,
  sizes,
  priority = false,
  fit = "cover",
  className = "",
}: {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  /** object-fit: cover (по умолчанию, кадрирует) или contain (без обрезки) */
  fit?: "cover" | "contain";
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  // Если файла нет / он не загрузился — прячемся, открывая подложку контейнера.
  if (failed) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      onError={() => setFailed(true)}
      className={`absolute inset-0 h-full w-full ${
        fit === "contain" ? "object-contain" : "object-cover"
      } ${className}`}
    />
  );
}

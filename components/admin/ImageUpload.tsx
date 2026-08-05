"use client";

import { useState, useRef } from "react";
import { UploadCloud, Loader2, X } from "lucide-react";

/**
 * Загрузка изображения с ПК (drag-and-drop + выбор файла) в Supabase Storage.
 * Публичный URL кладётся в скрытый input `name`, чтобы форма-серверный-экшен
 * сохранила его в БД.
 */
export default function ImageUpload({
  name,
  bucket,
  initialUrl = "",
}: {
  name: string;
  bucket: "news" | "camps" | "gallery";
  initialUrl?: string;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("bucket", bucket);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      // Ответ может быть не-JSON (например, HTML-страница nginx 413 при
      // превышении client_max_body_size) — читаем безопасно.
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 413) {
          setError("Файл слишком большой (ограничение сервера)");
        } else {
          setError(data?.error || `Ошибка загрузки (${res.status})`);
        }
      } else {
        setUrl(data.url);
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  const onFiles = (files: FileList | null) => {
    const f = files?.[0];
    if (f) void upload(f);
  };

  return (
    <div>
      {/* URL уходит в форму */}
      <input type="hidden" name={name} value={url} />

      {url ? (
        <div className="relative overflow-hidden rounded-xl border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Превью" className="max-h-52 w-full object-cover" />
          <button
            type="button"
            onClick={() => setUrl("")}
            aria-label="Убрать фото"
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white transition hover:bg-black/80"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            onFiles(e.dataTransfer.files);
          }}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition ${
            dragOver
              ? "border-primary bg-primary/10"
              : "border-white/20 bg-surface hover:border-primary/50"
          }`}
        >
          {loading ? (
            <Loader2 size={26} className="animate-spin text-primary" />
          ) : (
            <UploadCloud size={26} className="text-primary" />
          )}
          <span className="font-body text-sm text-ink">
            {loading ? "Загрузка…" : "Загрузить фото"}
          </span>
          <span className="font-body text-xs text-muted">
            Перетащите файл сюда или нажмите, чтобы выбрать
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />

      {error && <p className="mt-1.5 font-body text-xs text-pink">{error}</p>}
    </div>
  );
}

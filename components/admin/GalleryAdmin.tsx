"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  Trash2,
  Loader2,
  RefreshCw,
  DownloadCloud,
} from "lucide-react";
import {
  addGalleryImage,
  deleteGalleryImage,
  replaceGalleryImage,
  importSiteGallery,
} from "@/app/admin/actions";
import type { GalleryImage } from "@/lib/db";

export default function GalleryAdmin({
  images,
  siteUrls,
  notImportedCount,
}: {
  images: GalleryImage[];
  siteUrls: string[];
  notImportedCount: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const addRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const [replaceTarget, setReplaceTarget] = useState<GalleryImage | null>(null);

  const haveUrls = new Set(images.map((i) => i.image_url));
  const staticOnly = siteUrls.filter((u) => !haveUrls.has(u));

  /** Загружает файл в bucket gallery, возвращает публичный URL. */
  const uploadFile = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.set("file", file);
    fd.set("bucket", "gallery");
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    // Ответ может быть не-JSON (например, HTML-страница nginx 413) — читаем безопасно.
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(
        res.status === 413
          ? "Файл слишком большой (ограничение сервера)"
          : data?.error || `Ошибка загрузки (${res.status})`
      );
      return null;
    }
    return data.url as string;
  };

  const addPhoto = async (file: File) => {
    setError("");
    setBusy(true);
    try {
      const url = await uploadFile(file);
      if (!url) return;
      const af = new FormData();
      af.set("image_url", url);
      const res = await addGalleryImage(af);
      if (res && res.ok === false) setError(res.error || "Ошибка сохранения");
      else router.refresh();
    } catch {
      setError("Ошибка сети");
    } finally {
      setBusy(false);
    }
  };

  const doReplace = async (file: File) => {
    if (!replaceTarget) return;
    setError("");
    setBusy(true);
    try {
      const url = await uploadFile(file);
      if (!url) return;
      const fd = new FormData();
      fd.set("id", replaceTarget.id);
      fd.set("image_url", url);
      fd.set("old_url", replaceTarget.image_url);
      const res = await replaceGalleryImage(fd);
      if (res && res.ok === false) setError(res.error || "Ошибка замены");
      else router.refresh();
    } catch {
      setError("Ошибка сети");
    } finally {
      setBusy(false);
      setReplaceTarget(null);
    }
  };

  const remove = (img: GalleryImage) =>
    startTransition(async () => {
      if (!confirm("Удалить это фото из галереи?")) return;
      const fd = new FormData();
      fd.set("id", img.id);
      fd.set("image_url", img.image_url);
      await deleteGalleryImage(fd);
      router.refresh();
    });

  const importSite = () =>
    startTransition(async () => {
      await importSiteGallery();
      router.refresh();
    });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-end gap-2">
        {notImportedCount > 0 && (
          <button
            onClick={importSite}
            disabled={pending || busy}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 font-heading text-sm font-bold text-ink transition hover:border-primary/40 disabled:opacity-60"
          >
            {pending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <DownloadCloud size={18} className="text-primary" />
            )}
            Импортировать фото сайта ({notImportedCount})
          </button>
        )}
        <button
          onClick={() => addRef.current?.click()}
          disabled={busy}
          className="btn-cta inline-flex items-center gap-2 px-5 py-2.5 font-heading text-sm font-bold disabled:opacity-60"
        >
          {busy ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <UploadCloud size={18} />
          )}
          Добавить фото
        </button>
      </div>

      {/* Скрытые файловые инпуты */}
      <input
        ref={addRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void addPhoto(f);
          e.target.value = "";
        }}
      />
      <input
        ref={replaceRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void doReplace(f);
          e.target.value = "";
        }}
      />

      {error && (
        <p className="text-center font-body text-sm text-pink">{error}</p>
      )}

      {/* Фото галереи (из БД) */}
      {images.length === 0 && staticOnly.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-white/15 bg-card p-12 text-center font-body text-muted">
          Фотографий пока нет. Нажмите «Добавить фото», чтобы загрузить первые.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-surface"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.image_url}
                alt={img.caption ?? "Фото галереи"}
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 transition group-hover:opacity-100">
                <button
                  onClick={() => {
                    setReplaceTarget(img);
                    replaceRef.current?.click();
                  }}
                  disabled={busy || pending}
                  aria-label="Заменить фото"
                  title="Заменить"
                  className="rounded-full bg-black/60 p-2 text-white transition hover:bg-primary/80 disabled:opacity-50"
                >
                  <RefreshCw size={15} />
                </button>
                <button
                  onClick={() => remove(img)}
                  disabled={pending || busy}
                  aria-label="Удалить фото"
                  title="Удалить"
                  className="rounded-full bg-black/60 p-2 text-white transition hover:bg-pink/80 disabled:opacity-50"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Статические фото сайта, ещё не импортированные */}
      {staticOnly.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-t border-white/10 pt-5 font-heading text-sm font-bold text-ink">
            Фото с сайта (статические)
            <span className="rounded-full bg-white/10 px-2 py-0.5 font-body text-xs text-muted">
              {staticOnly.length}
            </span>
          </div>
          <p className="font-body text-xs text-muted">
            Эти фото сейчас показываются на сайте. Нажмите «Импортировать фото
            сайта», чтобы управлять ими (удалять и заменять).
          </p>
          <div className="grid grid-cols-2 gap-3 opacity-70 sm:grid-cols-3 lg:grid-cols-4">
            {staticOnly.map((url) => (
              <div
                key={url}
                className="aspect-square overflow-hidden rounded-2xl border border-white/10 bg-surface"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt="Фото сайта"
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Trash2, Loader2 } from "lucide-react";
import { addGalleryImage, deleteGalleryImage } from "@/app/admin/actions";
import type { GalleryImage } from "@/lib/db";

export default function GalleryAdmin({ images }: { images: GalleryImage[] }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("bucket", "gallery");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка загрузки");
        return;
      }
      const af = new FormData();
      af.set("image_url", data.url);
      await addGalleryImage(af);
      router.refresh();
    } catch {
      setError("Ошибка сети");
    } finally {
      setUploading(false);
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

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn-cta inline-flex items-center gap-2 px-5 py-2.5 font-heading text-sm font-bold disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <UploadCloud size={18} />
          )}
          Добавить фото
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <p className="text-center font-body text-sm text-pink">{error}</p>
      )}

      {images.length === 0 ? (
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
              <button
                onClick={() => remove(img)}
                disabled={pending}
                aria-label="Удалить фото"
                className="absolute right-2 top-2 rounded-full bg-black/60 p-2 text-white opacity-0 transition hover:bg-pink/80 group-hover:opacity-100 disabled:opacity-50 sm:opacity-0"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

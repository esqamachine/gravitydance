"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { saveCamp, deleteCamp } from "@/app/admin/actions";
import { slugify } from "@/lib/slug";
import { formatDate, type Camp } from "@/lib/db";
import ImageUpload from "./ImageUpload";

const emptyDraft = {
  id: "",
  title: "",
  slug: "",
  description: "",
  location: "",
  date_start: "",
  date_end: "",
  price: "",
  image_url: "",
  published: false,
};
type Draft = typeof emptyDraft;

function toDraft(c: Camp): Draft {
  return {
    id: c.id,
    title: c.title,
    slug: c.slug,
    description: c.description,
    location: c.location ?? "",
    date_start: c.date_start ?? "",
    date_end: c.date_end ?? "",
    price: c.price != null ? String(c.price) : "",
    image_url: c.image_url ?? "",
    published: c.published,
  };
}

export default function CampsAdmin({ camps }: { camps: Camp[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const openNew = () => {
    setDraft(emptyDraft);
    setSlugTouched(false);
    setError("");
    setOpen(true);
  };
  const openEdit = (c: Camp) => {
    setDraft(toDraft(c));
    setSlugTouched(true);
    setError("");
    setOpen(true);
  };

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      setError("");
      const res = await saveCamp(fd);
      if (res && res.ok === false) {
        setError(res.error || "Не удалось сохранить");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={openNew}
          className="btn-cta inline-flex items-center gap-2 px-5 py-2.5 font-heading text-sm font-bold"
        >
          <Plus size={18} /> Добавить сбор
        </button>
      </div>

      {camps.length === 0 ? (
        <div className="rounded-[1.75rem] border border-white/10 bg-card p-10 text-center font-body text-muted">
          Сборов пока нет.
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-white/10 md:block">
            <table className="w-full text-left">
              <thead className="bg-white/5 font-body text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3">Название</th>
                  <th className="px-5 py-3">Локация</th>
                  <th className="px-5 py-3">Даты</th>
                  <th className="px-5 py-3">Статус</th>
                  <th className="px-5 py-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 font-body text-sm">
                {camps.map((c) => (
                  <tr key={c.id} className="hover:bg-white/5">
                    <td className="px-5 py-3 font-medium text-ink">{c.title}</td>
                    <td className="px-5 py-3 text-muted">{c.location || "—"}</td>
                    <td className="px-5 py-3 text-muted">
                      {c.date_start
                        ? `${formatDate(c.date_start)}${
                            c.date_end ? " – " + formatDate(c.date_end) : ""
                          }`
                        : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge published={c.published} />
                    </td>
                    <td className="px-5 py-3">
                      <RowActions onEdit={() => openEdit(c)} id={c.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {camps.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-white/10 bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-heading font-bold text-ink">{c.title}</p>
                  <StatusBadge published={c.published} />
                </div>
                <p className="mt-1 font-body text-xs text-muted">
                  {c.location || "—"}
                  {c.date_start ? ` · ${formatDate(c.date_start)}` : ""}
                </p>
                <div className="mt-3">
                  <RowActions onEdit={() => openEdit(c)} id={c.id} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="animate-pop-in my-4 w-full max-w-lg space-y-3 rounded-[1.75rem] border border-white/10 bg-card p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg font-bold text-ink">
                {draft.id ? "Редактировать сбор" : "Новый сбор"}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Закрыть"
                className="rounded-full p-1.5 text-muted hover:bg-white/5 hover:text-ink"
              >
                <X size={22} />
              </button>
            </div>

            <input type="hidden" name="id" value={draft.id} />

            <label className="block">
              <span className="mb-1 block font-body text-xs text-muted">
                Заголовок
              </span>
              <input
                name="title"
                required
                value={draft.title}
                onChange={(e) => {
                  const title = e.target.value;
                  set({ title, slug: slugTouched ? draft.slug : slugify(title) });
                }}
                className="admin-input"
              />
            </label>

            <label className="block">
              <span className="mb-1 block font-body text-xs text-muted">
                Slug (URL)
              </span>
              <input
                name="slug"
                value={draft.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set({ slug: e.target.value });
                }}
                className="admin-input"
              />
            </label>

            <label className="block">
              <span className="mb-1 block font-body text-xs text-muted">
                Описание
              </span>
              <textarea
                name="description"
                required
                rows={5}
                value={draft.description}
                onChange={(e) => set({ description: e.target.value })}
                className="admin-input"
              />
            </label>

            <label className="block">
              <span className="mb-1 block font-body text-xs text-muted">
                Локация
              </span>
              <input
                name="location"
                value={draft.location}
                onChange={(e) => set({ location: e.target.value })}
                placeholder="Крым, Евпатория"
                className="admin-input"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block font-body text-xs text-muted">
                  Дата начала (необязательно)
                </span>
                <input
                  type="date"
                  name="date_start"
                  value={draft.date_start}
                  onChange={(e) => set({ date_start: e.target.value })}
                  className="admin-input"
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-body text-xs text-muted">
                  Дата окончания (необязательно)
                </span>
                <input
                  type="date"
                  name="date_end"
                  value={draft.date_end}
                  onChange={(e) => set({ date_end: e.target.value })}
                  className="admin-input"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block font-body text-xs text-muted">
                  Стоимость, ₽ (необязательно)
                </span>
                <input
                  type="number"
                  name="price"
                  min={0}
                  value={draft.price}
                  onChange={(e) => set({ price: e.target.value })}
                  className="admin-input"
                />
              </label>
              <div className="block">
                <span className="mb-1 block font-body text-xs text-muted">
                  Фото
                </span>
                <ImageUpload
                  name="image_url"
                  bucket="camps"
                  key={draft.id || "new"}
                  initialUrl={draft.image_url}
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                name="published"
                checked={draft.published}
                onChange={(e) => set({ published: e.target.checked })}
                className="h-5 w-5 accent-[#4AADDF]"
              />
              <span className="font-body text-sm text-ink">Опубликовать</span>
            </label>

            {error && (
              <p className="text-center font-body text-sm text-pink">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-full border border-white/10 px-6 py-3 font-heading text-sm font-semibold text-muted transition hover:text-ink"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={pending}
                className="btn-cta flex flex-1 items-center justify-center gap-2 px-6 py-3 font-heading text-sm font-bold disabled:opacity-60"
              >
                {pending ? <Loader2 size={16} className="animate-spin" /> : null}
                Сохранить
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ published }: { published: boolean }) {
  return published ? (
    <span className="rounded-full bg-green-500/15 px-2.5 py-0.5 font-body text-xs font-medium text-green-400">
      Опубликовано
    </span>
  ) : (
    <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-body text-xs font-medium text-muted">
      Черновик
    </span>
  );
}

function RowActions({ onEdit, id }: { onEdit: () => void; id: string }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={onEdit}
        className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 font-body text-xs text-ink transition hover:border-primary/40"
      >
        <Pencil size={13} /> Изменить
      </button>
      <form action={deleteCamp}>
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 font-body text-xs text-pink transition hover:border-pink/40"
        >
          <Trash2 size={13} /> Удалить
        </button>
      </form>
    </div>
  );
}

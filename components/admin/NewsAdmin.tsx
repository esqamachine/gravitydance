"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { saveNews, deleteNews } from "@/app/admin/actions";
import { slugify } from "@/lib/slug";
import { formatDate, type News } from "@/lib/db";
import ImageUpload from "./ImageUpload";

const emptyDraft = {
  id: "",
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  image_url: "",
  published: false,
};
type Draft = typeof emptyDraft;

function toDraft(n: News): Draft {
  return {
    id: n.id,
    title: n.title,
    slug: n.slug,
    excerpt: n.excerpt ?? "",
    content: n.content,
    image_url: n.image_url ?? "",
    published: n.published,
  };
}

export default function NewsAdmin({ news }: { news: News[] }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [slugTouched, setSlugTouched] = useState(false);

  const openNew = () => {
    setDraft(emptyDraft);
    setSlugTouched(false);
    setOpen(true);
  };
  const openEdit = (n: News) => {
    setDraft(toDraft(n));
    setSlugTouched(true);
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={openNew}
          className="btn-cta inline-flex items-center gap-2 px-5 py-2.5 font-heading text-sm font-bold"
        >
          <Plus size={18} /> Добавить новость
        </button>
      </div>

      {news.length === 0 ? (
        <div className="rounded-[1.75rem] border border-white/10 bg-card p-10 text-center font-body text-muted">
          Новостей пока нет.
        </div>
      ) : (
        <>
          {/* Десктоп */}
          <div className="hidden overflow-hidden rounded-2xl border border-white/10 md:block">
            <table className="w-full text-left">
              <thead className="bg-white/5 font-body text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3">Заголовок</th>
                  <th className="px-5 py-3">Создано</th>
                  <th className="px-5 py-3">Статус</th>
                  <th className="px-5 py-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 font-body text-sm">
                {news.map((n) => (
                  <tr key={n.id} className="hover:bg-white/5">
                    <td className="px-5 py-3 font-medium text-ink">{n.title}</td>
                    <td className="px-5 py-3 text-muted">
                      {formatDate(n.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge published={n.published} />
                    </td>
                    <td className="px-5 py-3">
                      <RowActions onEdit={() => openEdit(n)} id={n.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Мобайл */}
          <div className="space-y-3 md:hidden">
            {news.map((n) => (
              <div
                key={n.id}
                className="rounded-2xl border border-white/10 bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-heading font-bold text-ink">{n.title}</p>
                  <StatusBadge published={n.published} />
                </div>
                <p className="mt-1 font-body text-xs text-muted">
                  {formatDate(n.created_at)}
                </p>
                <div className="mt-3">
                  <RowActions onEdit={() => openEdit(n)} id={n.id} />
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
            action={saveNews}
            onSubmit={() => setTimeout(() => setOpen(false), 50)}
            onClick={(e) => e.stopPropagation()}
            className="animate-pop-in my-4 w-full max-w-lg space-y-3 rounded-[1.75rem] border border-white/10 bg-card p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg font-bold text-ink">
                {draft.id ? "Редактировать новость" : "Новая новость"}
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
                  setDraft((d) => ({
                    ...d,
                    title,
                    slug: slugTouched ? d.slug : slugify(title),
                  }));
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
                  setDraft((d) => ({ ...d, slug: e.target.value }));
                }}
                placeholder="avtogeneriruetsya"
                className="admin-input"
              />
            </label>

            <label className="block">
              <span className="mb-1 block font-body text-xs text-muted">
                Краткое описание (для карточки)
              </span>
              <textarea
                name="excerpt"
                rows={2}
                value={draft.excerpt}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, excerpt: e.target.value }))
                }
                className="admin-input"
              />
            </label>

            <label className="block">
              <span className="mb-1 block font-body text-xs text-muted">
                Полный текст
              </span>
              <textarea
                name="content"
                required
                rows={6}
                value={draft.content}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, content: e.target.value }))
                }
                className="admin-input"
              />
            </label>

            <div>
              <span className="mb-1 block font-body text-xs text-muted">
                Фото
              </span>
              <ImageUpload
                name="image_url"
                bucket="news"
                key={draft.id || "new"}
                initialUrl={draft.image_url}
              />
            </div>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                name="published"
                checked={draft.published}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, published: e.target.checked }))
                }
                className="h-5 w-5 accent-[#4AADDF]"
              />
              <span className="font-body text-sm text-ink">Опубликовать</span>
            </label>

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
                className="btn-cta flex-1 px-6 py-3 font-heading text-sm font-bold"
              >
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
      <form action={deleteNews}>
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

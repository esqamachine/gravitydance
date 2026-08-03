"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X, Baby, Loader2 } from "lucide-react";
import { addChild, deleteChild } from "@/app/dashboard/actions";
import type { Child } from "@/lib/db";

/** «YYYY-MM-DD» → «01 января 2020» без сдвига часового пояса. */
function formatBirth(d: string | null): string {
  if (!d) return "";
  const [y, m, day] = d.split("-").map(Number);
  if (!y || !m || !day) return d;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, day));
}

export default function ChildrenManager({ children }: { children: Child[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [birth, setBirth] = useState("");

  const submit = () =>
    startTransition(async () => {
      if (!fullName.trim() || !birth) return;
      const fd = new FormData();
      fd.set("full_name", fullName.trim());
      fd.set("phone", phone.trim());
      fd.set("birth_date", birth);
      await addChild(fd);
      setFullName("");
      setPhone("");
      setBirth("");
      setOpen(false);
      router.refresh();
    });

  const remove = (id: string) =>
    startTransition(async () => {
      if (!confirm("Удалить ребёнка из профиля?")) return;
      const fd = new FormData();
      fd.set("id", id);
      await deleteChild(fd);
      router.refresh();
    });

  return (
    <div className="mt-6 border-t border-white/10 pt-6">
      <div className="flex items-center gap-2 font-heading text-lg font-bold text-ink">
        <Baby size={20} className="text-primary" /> Дети
      </div>

      {children.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {children.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-body text-sm font-semibold text-ink">
                  {c.full_name}
                </p>
                <p className="font-body text-xs text-muted">
                  {formatBirth(c.birth_date)}
                  {c.phone ? ` · ${c.phone}` : ""}
                </p>
              </div>
              <button
                onClick={() => remove(c.id)}
                disabled={pending}
                aria-label="Удалить ребёнка"
                className="shrink-0 rounded-full p-2 text-muted transition hover:bg-pink/10 hover:text-pink disabled:opacity-50"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 font-body text-sm text-muted">
          Пока не добавлено ни одного ребёнка.
        </p>
      )}

      <button
        onClick={() => setOpen(true)}
        className="btn-cta mt-4 inline-flex items-center gap-2 px-5 py-2.5 font-heading text-sm font-bold"
      >
        <Plus size={16} /> Добавить ребёнка
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="animate-pop-in my-4 w-full max-w-md space-y-3 rounded-[1.75rem] border border-white/10 bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-ink">
                <Baby size={18} className="text-primary" /> Новый ребёнок
              </h3>
              <button
                onClick={() => setOpen(false)}
                aria-label="Закрыть"
                className="rounded-full p-1.5 text-muted hover:bg-white/5 hover:text-ink"
              >
                <X size={22} />
              </button>
            </div>

            <label className="block">
              <span className="mb-1 block font-body text-xs text-muted">
                ФИО ребёнка
              </span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Фамилия Имя"
                className="admin-input"
              />
            </label>

            <label className="block">
              <span className="mb-1 block font-body text-xs text-muted">
                Телефон (необязательно)
              </span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (900) 000-00-00"
                className="admin-input"
              />
            </label>

            <label className="block">
              <span className="mb-1 block font-body text-xs text-muted">
                Дата рождения
              </span>
              <input
                type="date"
                value={birth}
                onChange={(e) => setBirth(e.target.value)}
                className="admin-input"
              />
            </label>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-full border border-white/10 px-6 py-3 font-heading text-sm font-semibold text-muted transition hover:text-ink"
              >
                Отмена
              </button>
              <button
                onClick={submit}
                disabled={pending || !fullName.trim() || !birth}
                className="btn-cta flex flex-1 items-center justify-center gap-2 px-6 py-3 font-heading text-sm font-bold disabled:opacity-50"
              >
                {pending ? <Loader2 size={16} className="animate-spin" /> : null}
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

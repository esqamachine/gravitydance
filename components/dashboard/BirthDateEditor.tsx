"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Cake, Pencil, Check, Loader2 } from "lucide-react";
import { updateBirthDate } from "@/app/dashboard/actions";

function formatBirth(d: string | null): string {
  if (!d) return "—";
  const [y, m, day] = d.split("-").map(Number);
  if (!y || !m || !day) return d;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, day));
}

/** Строка «Дата рождения» с инлайн-редактированием (профиль клиента). */
export default function BirthDateEditor({ value }: { value: string | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(value ?? "");
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      const fd = new FormData();
      fd.set("birth_date", date);
      await updateBirthDate(fd);
      setEditing(false);
      router.refresh();
    });

  return (
    <div className="flex items-center gap-4 py-4">
      <Cake size={18} className="shrink-0 text-primary" />
      <span className="w-28 shrink-0 font-body text-sm text-muted">
        Дата рождения
      </span>
      {editing ? (
        <div className="flex flex-1 items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="admin-input max-w-[12rem] py-1.5"
          />
          <button
            onClick={save}
            disabled={pending}
            aria-label="Сохранить"
            className="rounded-full p-2 text-primary transition hover:bg-white/5 disabled:opacity-50"
          >
            {pending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Check size={16} />
            )}
          </button>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-between gap-2">
          <dd className="font-body text-ink">{formatBirth(value)}</dd>
          <button
            onClick={() => setEditing(true)}
            aria-label="Изменить дату рождения"
            className="rounded-full p-2 text-muted transition hover:bg-white/5 hover:text-ink"
          >
            <Pencil size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

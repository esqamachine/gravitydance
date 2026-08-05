"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Check,
  X,
  Loader2,
  User,
  Phone,
  Mail,
  type LucideIcon,
} from "lucide-react";
import { updateProfileField } from "@/app/dashboard/actions";

const FIELD_ICONS: Record<"name" | "phone" | "email", LucideIcon> = {
  name: User,
  phone: Phone,
  email: Mail,
};

/** Инлайн-редактор одного поля профиля (ФИО / телефон / email). */
export default function ProfileFieldEditor({
  field,
  label,
  value,
  inputType = "text",
}: {
  field: "name" | "phone" | "email";
  label: string;
  value: string;
  inputType?: string;
}) {
  const Icon = FIELD_ICONS[field];
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      setError("");
      const fd = new FormData();
      fd.set("field", field);
      fd.set("value", val);
      const res = await updateProfileField(fd);
      if (res.ok === false) {
        setError(res.error || "Ошибка");
        return;
      }
      setEditing(false);
      router.refresh();
    });

  const cancel = () => {
    setVal(value);
    setError("");
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-4 py-4">
      <Icon size={18} className="shrink-0 text-primary" />
      <span className="w-28 shrink-0 font-body text-sm text-muted">{label}</span>
      {editing ? (
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <input
              type={inputType}
              value={val}
              onChange={(e) => setVal(e.target.value)}
              autoFocus
              className="admin-input flex-1 py-1.5"
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
            <button
              onClick={cancel}
              aria-label="Отмена"
              className="rounded-full p-2 text-muted transition hover:bg-white/5 hover:text-ink"
            >
              <X size={16} />
            </button>
          </div>
          {error && <p className="font-body text-xs text-pink">{error}</p>}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-between gap-2">
          <dd className="min-w-0 truncate font-body text-ink">
            {value || "—"}
          </dd>
          <button
            onClick={() => setEditing(true)}
            aria-label={`Изменить: ${label}`}
            className="rounded-full p-2 text-muted transition hover:bg-white/5 hover:text-ink"
          >
            <Pencil size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

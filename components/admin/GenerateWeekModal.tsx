"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, X, Loader2, CheckCircle2 } from "lucide-react";
import { generateWeek } from "@/app/admin/actions";
import { DOW_RU } from "@/lib/db";
import type { TemplateRow } from "@/lib/queries";

const hm = (t: string) => t.slice(0, 5);

function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}
function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return isoLocal(d);
}
function mondayOf(base: Date): string {
  const d = new Date(base);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return isoLocal(d);
}

export default function GenerateWeekModal({
  templates,
}: {
  templates: TemplateRow[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(
    null
  );

  const thisMonday = mondayOf(new Date());
  const nextMonday = addDays(thisMonday, 7);
  const [monday, setMonday] = useState(nextMonday);

  const preview = useMemo(() => {
    return templates
      .map((t) => ({
        id: t.id,
        date: addDays(monday, (t.day_of_week ?? 1) - 1),
        dow: DOW_RU[(t.day_of_week ?? 1) - 1],
        time: `${hm(t.start_time)}–${hm(t.end_time)}`,
        group: t.group_name,
        coach: t.coach,
      }))
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }, [templates, monday]);

  const openModal = () => {
    setResult(null);
    setMonday(nextMonday);
    setOpen(true);
  };

  const create = () =>
    startTransition(async () => {
      const res = await generateWeek(monday);
      setResult(res);
      router.refresh();
    });

  return (
    <>
      <button
        onClick={openModal}
        className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-5 py-2.5 font-heading text-sm font-bold text-primary-light transition hover:bg-primary/20"
      >
        <CalendarPlus size={18} /> Сгенерировать неделю
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="animate-pop-in my-4 w-full max-w-xl rounded-[1.75rem] border border-white/10 bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-ink">
                <CalendarPlus size={18} className="text-primary" />
                Генерация расписания на неделю
              </h3>
              <button
                onClick={() => setOpen(false)}
                aria-label="Закрыть"
                className="rounded-full p-1.5 text-muted hover:bg-white/5 hover:text-ink"
              >
                <X size={22} />
              </button>
            </div>

            {templates.length === 0 ? (
              <p className="mt-6 font-body text-sm text-muted">
                Сначала создайте шаблоны на странице «Шаблоны».
              </p>
            ) : result ? (
              <div className="mt-6 flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle2 size={48} className="text-green-400" />
                <p className="font-heading text-lg font-bold text-ink">
                  Создано {result.created}{" "}
                  {result.created === 1 ? "занятие" : "занятий"}
                </p>
                {result.skipped > 0 && (
                  <p className="font-body text-sm text-muted">
                    Пропущено (уже существуют): {result.skipped}
                  </p>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="btn-cta mt-2 px-8 py-3 font-heading text-sm font-bold"
                >
                  Готово
                </button>
              </div>
            ) : (
              <>
                {/* Выбор недели */}
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
                  <label className="block">
                    <span className="mb-1 block font-body text-xs text-muted">
                      Понедельник недели
                    </span>
                    <input
                      type="date"
                      value={monday}
                      onChange={(e) =>
                        setMonday(mondayOf(new Date(e.target.value)))
                      }
                      className="admin-input"
                    />
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMonday(thisMonday)}
                      className="rounded-full border border-white/10 px-3 py-2 font-body text-xs text-ink transition hover:border-primary/40"
                    >
                      Текущая неделя
                    </button>
                    <button
                      onClick={() => setMonday(nextMonday)}
                      className="rounded-full border border-white/10 px-3 py-2 font-body text-xs text-ink transition hover:border-primary/40"
                    >
                      Следующая неделя
                    </button>
                  </div>
                </div>

                {/* Превью */}
                <div className="mt-5 max-h-72 overflow-y-auto rounded-2xl border border-white/10">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-surface font-body text-xs uppercase tracking-wide text-muted">
                      <tr>
                        <th className="px-4 py-2">Дата</th>
                        <th className="px-4 py-2">День</th>
                        <th className="px-4 py-2">Время</th>
                        <th className="px-4 py-2">Группа</th>
                        <th className="px-4 py-2">Тренер</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 font-body text-sm">
                      {preview.map((r) => (
                        <tr key={r.id}>
                          <td className="px-4 py-2 text-ink">
                            {r.date.slice(8, 10)}.{r.date.slice(5, 7)}
                          </td>
                          <td className="px-4 py-2 text-muted">{r.dow}</td>
                          <td className="px-4 py-2 text-muted">{r.time}</td>
                          <td className="px-4 py-2 text-ink">{r.group}</td>
                          <td className="px-4 py-2 text-muted">{r.coach}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="mt-3 font-body text-xs text-muted">
                  Будет создано {preview.length} занятий. Уже существующие
                  (та же дата, время и группа) пропускаются.
                </p>

                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-full border border-white/10 px-6 py-3 font-heading text-sm font-semibold text-muted transition hover:text-ink"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={create}
                    disabled={pending}
                    className="btn-cta flex flex-1 items-center justify-center gap-2 px-6 py-3 font-heading text-sm font-bold disabled:opacity-60"
                  >
                    {pending && <Loader2 size={16} className="animate-spin" />}
                    Создать все
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Boxes,
  Users,
  X,
  Loader2,
  CheckCircle2,
  XCircle,
  Phone,
  Plus,
  Pencil,
  Trash2,
  UserCog,
} from "lucide-react";
import {
  getGroupDetailAction,
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupTrainersAction,
  getCoachesAction,
  assignTrainer,
  unassignTrainer,
} from "@/app/admin/actions";
import { groupColor } from "@/lib/db";
import type { GroupWithCount } from "@/lib/queries";
import type { GroupDetail, GroupParticipant } from "@/lib/queries";

/** Палитра для выбора цвета группы (из ТЗ + запас). */
const COLOR_SWATCHES = [
  "#F59E0B",
  "#8B5CF6",
  "#3B82F6",
  "#EC4899",
  "#06B6D4",
  "#A78BFA",
  "#F97316",
  "#10B981",
  "#EF4444",
  "#14B8A6",
];

export default function GroupsGrid({
  groups,
  canManage = true,
}: {
  groups: GroupWithCount[];
  /** Руководитель (admin) — полное управление; тренер (coach) — только просмотр. */
  canManage?: boolean;
}) {
  const router = useRouter();
  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<GroupWithCount | null>(null);

  const open = async (id: string) => {
    setLoadingId(id);
    const d = await getGroupDetailAction(id);
    setLoadingId(null);
    if (d) setDetail(d);
  };

  return (
    <>
      {canManage && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setCreating(true)}
            className="btn-cta inline-flex items-center gap-2 px-5 py-2.5 font-heading text-sm font-bold"
          >
            <Plus size={18} /> Новая группа
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => {
          const color = groupColor(g.name, g.color);
          return (
            <div
              key={g.id}
              style={{ borderLeftColor: color }}
              className="relative rounded-2xl border border-l-4 border-white/10 bg-card transition hover:border-primary/40"
            >
              {/* Действия — редактировать (только для руководителя) */}
              {canManage && (
                <div className="absolute right-2 top-2 z-[2] flex gap-1">
                  <button
                    onClick={() => setEditing(g)}
                    aria-label="Редактировать группу"
                    title="Редактировать"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-card text-muted transition hover:border-primary/40 hover:text-ink"
                  >
                    <Pencil size={15} />
                  </button>
                </div>
              )}

              {/* Основная кликабельная область — открыть участников */}
              <button
                onClick={() => open(g.id)}
                className={`block w-full rounded-2xl p-5 text-left ${
                  canManage ? "pr-12" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2 font-heading text-lg font-bold text-ink">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="truncate">{g.name}</span>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-3 py-1 font-body text-xs font-semibold text-primary-light">
                    {loadingId === g.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <>
                        <Users size={13} /> {g.student_count}
                      </>
                    )}
                  </span>
                </div>
                <dl className="mt-4 space-y-1.5 font-body text-sm text-muted">
                  {g.age_range && (
                    <div className="flex justify-between">
                      <dt>Возраст</dt>
                      <dd className="text-ink">{g.age_range}</dd>
                    </div>
                  )}
                  {g.schedule && (
                    <div className="flex justify-between">
                      <dt>Частота</dt>
                      <dd className="text-ink">{g.schedule}</dd>
                    </div>
                  )}
                  {g.duration && (
                    <div className="flex justify-between">
                      <dt>Длительность</dt>
                      <dd className="text-ink">{g.duration}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt>Макс. учеников</dt>
                    <dd className="text-ink">{g.max_students}</dd>
                  </div>
                </dl>
                <p className="mt-3 font-body text-xs text-primary-light">
                  Нажмите, чтобы посмотреть участников →
                </p>
              </button>
            </div>
          );
        })}
      </div>

      {detail && (
        <GroupDetailModal
          detail={detail}
          showPaid={canManage}
          onClose={() => setDetail(null)}
        />
      )}

      {creating && (
        <NewGroupModal
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            router.refresh();
          }}
        />
      )}

      {editing && (
        <EditGroupModal
          group={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function NewGroupModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [subs, setSubs] = useState(["", "", ""]);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      setError("");
      if (!name.trim()) return setError("Укажите название группы");
      const fd = new FormData();
      fd.set("name", name.trim());
      subs.forEach((s, i) => fd.set(`subgroup${i + 1}`, s));
      const res = await createGroup(fd);
      if (res.ok === false) return setError(res.error || "Ошибка");
      onCreated();
    });

  return (
    <div
      className="fixed inset-0 z-[70] flex justify-center overflow-y-auto bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="animate-pop-in min-h-full w-full space-y-3 bg-card p-5 shadow-2xl sm:my-4 sm:min-h-0 sm:max-w-md sm:rounded-[1.75rem] sm:border sm:border-white/10 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-ink">
            <Boxes size={18} className="text-primary" /> Новая группа
          </h3>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="rounded-full p-1.5 text-muted hover:bg-white/5 hover:text-ink"
          >
            <X size={22} />
          </button>
        </div>

        <label className="block">
          <span className="mb-1 block font-body text-xs text-muted">
            Название группы
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например: Хип-хоп"
            className="admin-input"
          />
        </label>

        {[0, 1, 2].map((i) => (
          <label key={i} className="block">
            <span className="mb-1 block font-body text-xs text-muted">
              Подгруппа {i + 1}
              {i > 0 ? " (необязательно)" : ""}
            </span>
            <input
              value={subs[i]}
              onChange={(e) =>
                setSubs((s) => s.map((v, k) => (k === i ? e.target.value : v)))
              }
              className="admin-input"
            />
          </label>
        ))}

        {error && (
          <p className="text-center font-body text-sm text-pink">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-white/10 px-6 py-3 font-heading text-sm font-semibold text-muted transition hover:text-ink"
          >
            Отмена
          </button>
          <button
            onClick={save}
            disabled={pending || !name.trim()}
            className="btn-cta flex flex-1 items-center justify-center gap-2 px-6 py-3 font-heading text-sm font-bold disabled:opacity-50"
          >
            {pending ? <Loader2 size={16} className="animate-spin" /> : null}
            Создать
          </button>
        </div>
      </div>
    </div>
  );
}

function EditGroupModal({
  group,
  onClose,
  onSaved,
}: {
  group: GroupWithCount;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(group.name);
  const [color, setColor] = useState<string>(
    groupColor(group.name, group.color)
  );
  const [subs, setSubs] = useState<{ id?: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  // Подгрузить текущие подгруппы
  useEffect(() => {
    let alive = true;
    (async () => {
      const d = await getGroupDetailAction(group.id);
      if (!alive) return;
      setSubs((d?.subgroups ?? []).map((s) => ({ id: s.id, name: s.name })));
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [group.id]);

  const setSubName = (i: number, v: string) =>
    setSubs((arr) => arr.map((s, k) => (k === i ? { ...s, name: v } : s)));
  const removeSub = (i: number) =>
    setSubs((arr) => arr.filter((_, k) => k !== i));
  const addSub = () => setSubs((arr) => [...arr, { name: "" }]);

  const save = () =>
    startTransition(async () => {
      setError("");
      if (!name.trim()) return setError("Укажите название группы");
      const fd = new FormData();
      fd.set("id", group.id);
      fd.set("name", name.trim());
      fd.set("color", color);
      fd.set(
        "subgroups",
        JSON.stringify(
          subs
            .filter((s) => s.name.trim())
            .map((s) => ({ id: s.id, name: s.name.trim() }))
        )
      );
      const res = await updateGroup(fd);
      if (res.ok === false) return setError(res.error || "Ошибка");
      onSaved();
    });

  const remove = () =>
    startTransition(async () => {
      if (
        !confirm(
          `Удалить группу «${group.name}»? Все записи участников в этой группе будут удалены. Действие необратимо.`
        )
      )
        return;
      const fd = new FormData();
      fd.set("id", group.id);
      const res = await deleteGroup(fd);
      if (res.ok === false) return setError(res.error || "Ошибка удаления");
      onSaved();
    });

  return (
    <div
      className="fixed inset-0 z-[70] flex justify-center overflow-y-auto bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="animate-pop-in min-h-full w-full space-y-3 bg-card p-5 shadow-2xl sm:my-4 sm:min-h-0 sm:max-w-md sm:rounded-[1.75rem] sm:border sm:border-white/10 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-ink">
            <Boxes size={18} className="text-primary" /> Редактировать группу
          </h3>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="rounded-full p-1.5 text-muted hover:bg-white/5 hover:text-ink"
          >
            <X size={22} />
          </button>
        </div>

        <label className="block">
          <span className="mb-1 block font-body text-xs text-muted">
            Название группы
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="admin-input"
          />
        </label>

        {/* Цвет */}
        <div>
          <span className="mb-1.5 block font-body text-xs text-muted">Цвет</span>
          <div className="flex flex-wrap items-center gap-2">
            {COLOR_SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Цвет ${c}`}
                style={{ backgroundColor: c }}
                className={`h-8 w-8 rounded-full transition ${
                  color.toLowerCase() === c.toLowerCase()
                    ? "ring-2 ring-white ring-offset-2 ring-offset-card"
                    : "opacity-80 hover:opacity-100"
                }`}
              />
            ))}
            <label
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/20"
              title="Свой цвет"
            >
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-6 w-6 cursor-pointer border-0 bg-transparent p-0"
              />
            </label>
          </div>
        </div>

        {/* Подгруппы */}
        <div>
          <span className="mb-1.5 block font-body text-xs text-muted">
            Подгруппы
          </span>
          {loading ? (
            <p className="flex items-center gap-2 py-2 font-body text-sm text-muted">
              <Loader2 size={14} className="animate-spin" /> Загрузка…
            </p>
          ) : (
            <div className="space-y-2">
              {subs.map((s, i) => (
                <div key={s.id ?? `new-${i}`} className="flex items-center gap-2">
                  <input
                    value={s.name}
                    onChange={(e) => setSubName(i, e.target.value)}
                    placeholder="Название подгруппы"
                    className="admin-input flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeSub(i)}
                    aria-label="Удалить подгруппу"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 text-muted transition hover:border-pink/40 hover:text-pink"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addSub}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 font-body text-sm text-ink transition hover:border-primary/40"
              >
                <Plus size={15} /> Добавить подгруппу
              </button>
            </div>
          )}
        </div>

        {/* Тренеры группы */}
        <TrainersSection groupId={group.id} />

        {error && (
          <p className="text-center font-body text-sm text-pink">{error}</p>
        )}

        <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center">
          <button
            onClick={remove}
            disabled={pending}
            className="order-2 inline-flex items-center justify-center gap-2 rounded-full border border-pink/30 px-4 py-3 font-body text-sm text-pink transition hover:bg-pink/10 disabled:opacity-50 sm:order-1 sm:mr-auto"
          >
            <Trash2 size={16} /> Удалить группу
          </button>
          <button
            onClick={onClose}
            className="order-3 flex-1 rounded-full border border-white/10 px-6 py-3 font-heading text-sm font-semibold text-muted transition hover:text-ink sm:order-2 sm:flex-none"
          >
            Отмена
          </button>
          <button
            onClick={save}
            disabled={pending || !name.trim()}
            className="btn-cta order-1 flex flex-1 items-center justify-center gap-2 px-6 py-3 font-heading text-sm font-bold disabled:opacity-50 sm:order-3 sm:flex-none"
          >
            {pending ? <Loader2 size={16} className="animate-spin" /> : null}
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

function ParticipantRow({
  p,
  showPaid = true,
}: {
  p: GroupParticipant;
  showPaid?: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2">
      <div className="min-w-0">
        <p className="truncate font-body text-sm text-ink">
          {p.name}
          {p.is_child && (
            <span className="text-muted"> · ребёнок</span>
          )}
        </p>
        <p className="flex items-center gap-1 font-body text-xs text-muted">
          <Phone size={11} className="text-primary" /> {p.phone}
        </p>
      </div>
      {showPaid && (
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 font-body text-xs font-medium ${
            p.paid
              ? "bg-green-500/15 text-green-400"
              : "bg-pink/15 text-pink"
          }`}
        >
          {p.paid ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
          {p.paid ? "Оплачено" : "Не оплачено"}
        </span>
      )}
    </li>
  );
}

interface TrainerRow {
  id: string;
  trainer_id: string;
  name: string;
}

/** Секция «Тренеры группы» в модалке редактирования (только руководитель). */
function TrainersSection({ groupId }: { groupId: string }) {
  const [available, setAvailable] = useState(true);
  const [trainers, setTrainers] = useState<TrainerRow[]>([]);
  const [coaches, setCoaches] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const reload = async () => {
    const [{ available: av, trainers: tr }, cs] = await Promise.all([
      getGroupTrainersAction(groupId),
      getCoachesAction(),
    ]);
    setAvailable(av);
    setTrainers(tr);
    setCoaches(cs);
    setLoading(false);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      const [{ available: av, trainers: tr }, cs] = await Promise.all([
        getGroupTrainersAction(groupId),
        getCoachesAction(),
      ]);
      if (!alive) return;
      setAvailable(av);
      setTrainers(tr);
      setCoaches(cs);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [groupId]);

  const assignedIds = new Set(trainers.map((t) => t.trainer_id));
  const options = coaches.filter((c) => !assignedIds.has(c.id));

  const add = () =>
    startTransition(async () => {
      setError("");
      if (!selected) return;
      const fd = new FormData();
      fd.set("group_id", groupId);
      fd.set("trainer_id", selected);
      const res = await assignTrainer(fd);
      if (res.ok === false) return setError(res.error || "Ошибка");
      setSelected("");
      await reload();
    });

  const remove = (id: string) =>
    startTransition(async () => {
      setError("");
      const fd = new FormData();
      fd.set("id", id);
      const res = await unassignTrainer(fd);
      if (res.ok === false) return setError(res.error || "Ошибка");
      await reload();
    });

  return (
    <div className="border-t border-white/10 pt-4">
      <span className="mb-1.5 flex items-center gap-1.5 font-body text-xs text-muted">
        <UserCog size={13} className="text-primary" /> Тренеры группы
      </span>

      {loading ? (
        <p className="flex items-center gap-2 py-2 font-body text-sm text-muted">
          <Loader2 size={14} className="animate-spin" /> Загрузка…
        </p>
      ) : !available ? (
        <p className="rounded-xl bg-white/5 px-3 py-2 font-body text-xs text-muted">
          Таблица будет доступна после применения миграции 032.
        </p>
      ) : (
        <div className="space-y-2">
          {trainers.length > 0 ? (
            <ul className="space-y-2">
              {trainers.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2"
                >
                  <span className="truncate font-body text-sm text-ink">
                    {t.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(t.id)}
                    disabled={pending}
                    aria-label="Снять тренера"
                    title="Снять с группы"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-muted transition hover:border-pink/40 hover:text-pink disabled:opacity-50"
                  >
                    <X size={15} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-body text-xs text-muted">
              Тренеры пока не назначены.
            </p>
          )}

          <div className="flex items-center gap-2">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              disabled={pending || options.length === 0}
              className="admin-input flex-1 disabled:opacity-50"
            >
              <option value="">
                {options.length === 0
                  ? "Нет свободных тренеров"
                  : "Выберите тренера"}
              </option>
              {options.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={add}
              disabled={pending || !selected}
              className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-4 font-body text-sm text-ink transition hover:border-primary/40 disabled:opacity-50"
            >
              {pending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Plus size={15} />
              )}
              Назначить
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 font-body text-xs text-pink">{error}</p>
      )}
    </div>
  );
}

function GroupDetailModal({
  detail,
  showPaid = true,
  onClose,
}: {
  detail: GroupDetail;
  showPaid?: boolean;
  onClose: () => void;
}) {
  const { group, subgroups, participants } = detail;
  const noSub = participants.filter((p) => !p.subgroup_id);

  return (
    <div
      className="fixed inset-0 z-[70] flex justify-center overflow-y-auto bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="animate-pop-in min-h-full w-full bg-card p-5 shadow-2xl sm:my-4 sm:min-h-0 sm:max-w-lg sm:rounded-[1.75rem] sm:border sm:border-white/10 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-ink">
              <Boxes size={20} className="text-primary" /> {group.name}
            </h3>
            <p className="mt-1 font-body text-xs text-muted">
              {[
                group.age_range,
                group.schedule,
                group.duration,
                `макс. ${group.max_students}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="shrink-0 rounded-full p-1.5 text-muted transition hover:bg-white/5 hover:text-ink"
          >
            <X size={22} />
          </button>
        </div>

        <div className="mt-5 max-h-[60vh] space-y-5 overflow-y-auto pr-1">
          {subgroups.map((s) => {
            const members = participants.filter((p) => p.subgroup_id === s.id);
            return (
              <section key={s.id}>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="font-heading text-sm font-bold text-ink">
                    {s.name}
                  </h4>
                  <span className="rounded-full bg-primary/15 px-2.5 py-0.5 font-body text-xs font-semibold text-primary-light">
                    {members.length}
                  </span>
                </div>
                {members.length ? (
                  <ul className="space-y-2">
                    {members.map((p) => (
                      <ParticipantRow key={p.cg_id} p={p} showPaid={showPaid} />
                    ))}
                  </ul>
                ) : (
                  <p className="font-body text-xs text-muted">
                    Пока никого нет.
                  </p>
                )}
              </section>
            );
          })}

          {noSub.length > 0 && (
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="font-heading text-sm font-bold text-ink">
                  Без подгруппы
                </h4>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-body text-xs font-semibold text-muted">
                  {noSub.length}
                </span>
              </div>
              <ul className="space-y-2">
                {noSub.map((p) => (
                  <ParticipantRow key={p.cg_id} p={p} showPaid={showPaid} />
                ))}
              </ul>
            </section>
          )}

          {participants.length === 0 && (
            <p className="font-body text-sm text-muted">
              В группе пока нет участников.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
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
} from "lucide-react";
import { getGroupDetailAction, createGroup } from "@/app/admin/actions";
import type { GroupWithCount } from "@/lib/queries";
import type { GroupDetail, GroupParticipant } from "@/lib/queries";

export default function GroupsGrid({ groups }: { groups: GroupWithCount[] }) {
  const router = useRouter();
  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const open = async (id: string) => {
    setLoadingId(id);
    const d = await getGroupDetailAction(id);
    setLoadingId(null);
    if (d) setDetail(d);
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setCreating(true)}
          className="btn-cta inline-flex items-center gap-2 px-5 py-2.5 font-heading text-sm font-bold"
        >
          <Plus size={18} /> Новая группа
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => (
          <button
            key={g.id}
            onClick={() => open(g.id)}
            className="rounded-2xl border border-white/10 bg-card p-5 text-left transition hover:border-primary/40 hover:bg-white/5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-heading text-lg font-bold text-ink">
                <Boxes size={18} className="text-primary" />
                {g.name}
              </div>
              <span className="flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 font-body text-xs font-semibold text-primary-light">
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
        ))}
      </div>

      {detail && (
        <GroupDetailModal detail={detail} onClose={() => setDetail(null)} />
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

function ParticipantRow({ p }: { p: GroupParticipant }) {
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
    </li>
  );
}

function GroupDetailModal({
  detail,
  onClose,
}: {
  detail: GroupDetail;
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
                      <ParticipantRow key={p.cg_id} p={p} />
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
                  <ParticipantRow key={p.cg_id} p={p} />
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

import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { SessionData } from "@/lib/account";
import { isAdmin } from "@/lib/account";
import type { Profile } from "@/lib/db";

/**
 * ID групп тренера из таблицы trainer_groups.
 *
 * Возвращает:
 *  - `null`  — таблицы trainer_groups ещё нет (миграция 032 не выполнена).
 *              Это сигнал «нет ограничения» → показать ВСЕ группы (фолбэк по ТЗ).
 *  - `string[]` — реальный список групп тренера (может быть пустым).
 */
export async function getTrainerGroupIds(
  profileId: string
): Promise<string[] | null> {
  const { data, error } = await supabaseAdmin
    .from("trainer_groups")
    .select("group_id")
    .eq("trainer_id", profileId);

  // Таблицы нет / недоступна — фолбэк «все группы».
  if (error) return null;
  return (data ?? []).map((r: { group_id: string }) => r.group_id);
}

/**
 * Область видимости групп для сессии.
 *  - admin → `null` (все группы, без ограничения).
 *  - coach → `getTrainerGroupIds` (реальный список или `null`-фолбэк).
 */
export async function getScopeGroupIds(
  session: SessionData
): Promise<string[] | null> {
  if (isAdmin(session)) return null;
  const pid = session.profile?.id;
  if (!pid) return [];
  return getTrainerGroupIds(pid);
}

/**
 * Может ли текущая сессия работать с этой группой?
 *  - admin → всегда да.
 *  - coach → да, если группа в его trainer_groups; при отсутствии таблицы
 *            (фолбэк) — тоже да (пока привязок нет — доступ ко всем).
 */
export async function canAccessGroup(
  session: SessionData,
  groupId: string
): Promise<boolean> {
  if (isAdmin(session)) return true;
  const scope = await getScopeGroupIds(session);
  if (scope === null) return true; // фолбэк: таблицы нет
  return scope.includes(groupId);
}

/** Группа занятия (lessons.group_id) — для проверок доступа тренера. */
export async function lessonGroupId(lessonId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("lessons")
    .select("group_id")
    .eq("id", lessonId)
    .maybeSingle();
  return (data as { group_id: string } | null)?.group_id ?? null;
}

/** Список профилей-тренеров (role = 'coach') для селекта «Назначить тренера». */
export async function getCoachProfiles(): Promise<Profile[]> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("role", "coach")
    .order("last_name", { ascending: true });
  if (error) return [];
  return (data ?? []) as Profile[];
}

export interface GroupTrainer {
  id: string; // trainer_groups.id (для удаления привязки)
  trainer_id: string;
  name: string;
}

/**
 * Тренеры, привязанные к группе.
 * `{ available: false }` — таблицы trainer_groups ещё нет (миграция 032).
 */
export async function getGroupTrainers(
  groupId: string
): Promise<{ available: boolean; trainers: GroupTrainer[] }> {
  const { data, error } = await supabaseAdmin
    .from("trainer_groups")
    .select("id, trainer_id, profile:profiles(first_name,last_name,patronymic)")
    .eq("group_id", groupId);

  if (error) return { available: false, trainers: [] };

  const trainers = ((data ?? []) as unknown as {
    id: string;
    trainer_id: string;
    profile: {
      first_name: string;
      last_name: string;
      patronymic: string | null;
    } | null;
  }[]).map((r) => ({
    id: r.id,
    trainer_id: r.trainer_id,
    name: r.profile
      ? `${r.profile.last_name} ${r.profile.first_name}`
      : "—",
  }));

  return { available: true, trainers };
}

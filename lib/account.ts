import "server-only";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/db";

/** Нормализует телефон к цифрам (для сопоставления с auth.users.phone). */
export function digits(phone: string | null | undefined): string {
  return (phone ?? "").replace(/\D/g, "");
}

export interface SessionData {
  userId: string;
  email: string | null;
  phone: string | null;
  profile: Profile | null;
}

/**
 * Возвращает текущего авторизованного пользователя + связанный профиль.
 * Профиль ищем по телефону или email (таблица profiles не привязана к auth.users
 * напрямую в схеме этапа 1). Если нет сессии — null.
 */
export async function getSession(): Promise<SessionData | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const phone = user.phone ?? null;
  const email = user.email ?? null;

  let profile: Profile | null = null;
  try {
    if (phone) {
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("phone", digits(phone))
        .maybeSingle();
      profile = (data as Profile) ?? null;
    }
    if (!profile && email) {
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("email", email)
        .maybeSingle();
      profile = (data as Profile) ?? null;
    }
  } catch {
    // Таблицы ещё не созданы (миграция не выполнена) — вернём профиль null.
    profile = null;
  }

  return { userId: user.id, email, phone, profile };
}

/** Требует авторизации, иначе редирект на /login. */
export async function requireSession(): Promise<SessionData> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Требует роль admin, иначе редирект. */
export async function requireAdmin(): Promise<SessionData> {
  const session = await requireSession();
  if (session.profile?.role !== "admin") redirect("/dashboard");
  return session;
}

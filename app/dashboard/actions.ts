"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/account";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** Добавить ребёнка текущему пользователю. */
export async function addChild(formData: FormData) {
  const session = await requireSession();
  const parentId = session.profile?.id;
  if (!parentId) return;

  const full_name = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const birth_date = String(formData.get("birth_date") ?? "").trim() || null;
  if (!full_name || !birth_date) return;

  await supabaseAdmin
    .from("children")
    .insert({ parent_id: parentId, full_name, phone, birth_date });

  revalidatePath("/dashboard/profile");
}

/** Удалить ребёнка (только своего). */
export async function deleteChild(formData: FormData) {
  const session = await requireSession();
  const parentId = session.profile?.id;
  if (!parentId) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabaseAdmin
    .from("children")
    .delete()
    .eq("id", id)
    .eq("parent_id", parentId);

  revalidatePath("/dashboard/profile");
}

/** Редактирование полей профиля (ФИО / телефон / email) из ЛК.
 *  Для email синхронизируем и auth-пользователя, иначе getSession перестанет
 *  находить профиль (сопоставление идёт по auth.email). */
export async function updateProfileField(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireSession();
  const profileId = session.profile?.id;
  if (!profileId) return { ok: false, error: "Профиль не найден" };

  const field = String(formData.get("field") ?? "");
  const value = String(formData.get("value") ?? "").trim();

  if (field === "name") {
    const parts = value.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return { ok: false, error: "Укажите ФИО" };
    const last_name = parts[0] ?? "";
    const first_name = parts[1] ?? "";
    const patronymic = parts.slice(2).join(" ") || null;
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ last_name, first_name, patronymic })
      .eq("id", profileId);
    if (error) return { ok: false, error: error.message };
  } else if (field === "phone") {
    const digitsOnly = value.replace(/\D/g, "");
    if (digitsOnly.length < 10)
      return { ok: false, error: "Некорректный телефон" };
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ phone: digitsOnly })
      .eq("id", profileId);
    if (error) return { ok: false, error: error.message };
  } else if (field === "email") {
    if (!value.includes("@"))
      return { ok: false, error: "Некорректный email" };
    const email = value.toLowerCase();
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ email })
      .eq("id", profileId);
    if (error) return { ok: false, error: error.message };
    // Синхронизируем auth-пользователя, чтобы не потерять связку профиля.
    if (session.userId) {
      const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(
        session.userId,
        { email, email_confirm: true }
      );
      if (authErr) console.error("[updateProfileField] auth email:", authErr.message);
    }
  } else {
    return { ok: false, error: "Неизвестное поле" };
  }

  revalidatePath("/dashboard/profile");
  return { ok: true };
}

/** Сохранить дату рождения самого пользователя. */
export async function updateBirthDate(formData: FormData) {
  const session = await requireSession();
  const profileId = session.profile?.id;
  if (!profileId) return;

  const birth_date = String(formData.get("birth_date") ?? "").trim() || null;

  await supabaseAdmin
    .from("profiles")
    .update({ birth_date })
    .eq("id", profileId);

  revalidatePath("/dashboard/profile");
}

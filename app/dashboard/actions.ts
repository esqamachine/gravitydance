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

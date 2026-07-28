"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, digits } from "@/lib/account";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getClientDetail } from "@/lib/queries";
import { slugify } from "@/lib/slug";

/** Читает подробную карточку клиента (для модалки в админке). */
export async function getClientDetailAction(profileId: string) {
  await requireAdmin();
  return getClientDetail(profileId);
}

export async function addClient(formData: FormData) {
  await requireAdmin();

  const first_name = String(formData.get("first_name") ?? "").trim();
  const last_name = String(formData.get("last_name") ?? "").trim();
  const patronymic = String(formData.get("patronymic") ?? "").trim() || null;
  const phone = digits(String(formData.get("phone") ?? ""));
  const email = String(formData.get("email") ?? "").trim() || null;
  const groupId = String(formData.get("group_id") ?? "").trim();

  const subgroupId = String(formData.get("subgroup_id") ?? "").trim() || null;

  if (!first_name || !last_name || !phone) return;

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .insert({ first_name, last_name, patronymic, phone, email })
    .select("id")
    .single();

  if (!error && profile && groupId) {
    await supabaseAdmin.from("client_groups").insert({
      profile_id: profile.id,
      group_id: groupId,
      subgroup_id: subgroupId,
    });
  }

  revalidatePath("/admin/clients");
}

export async function addLesson(formData: FormData) {
  await requireAdmin();

  const group_id = String(formData.get("group_id") ?? "");
  const subgroup_id = String(formData.get("subgroup_id") ?? "").trim() || null;
  const date = String(formData.get("date") ?? "");
  const start_time = String(formData.get("start_time") ?? "");
  const end_time = String(formData.get("end_time") ?? "");
  const coach_name = String(formData.get("coach_name") ?? "").trim() || null;

  if (!group_id || !date || !start_time || !end_time) return;

  await supabaseAdmin
    .from("lessons")
    .insert({ group_id, subgroup_id, date, start_time, end_time, coach_name });

  revalidatePath("/admin/schedule");
  revalidatePath("/admin/attendance");
}

/* ---------- Управление клиентом ---------- */

export async function enrollClient(formData: FormData) {
  await requireAdmin();
  const profile_id = String(formData.get("profile_id") ?? "");
  const group_id = String(formData.get("group_id") ?? "");
  const subgroup_id = String(formData.get("subgroup_id") ?? "").trim() || null;
  if (!profile_id || !group_id) return;

  await supabaseAdmin
    .from("client_groups")
    .upsert(
      { profile_id, group_id, subgroup_id },
      { onConflict: "profile_id,group_id" }
    );

  revalidatePath("/admin/clients");
}

export async function unenrollClient(formData: FormData) {
  await requireAdmin();
  const profile_id = String(formData.get("profile_id") ?? "");
  const group_id = String(formData.get("group_id") ?? "");
  if (!profile_id || !group_id) return;

  await supabaseAdmin
    .from("client_groups")
    .delete()
    .eq("profile_id", profile_id)
    .eq("group_id", group_id);

  revalidatePath("/admin/clients");
}

export async function addManualPayment(formData: FormData) {
  await requireAdmin();
  const profile_id = String(formData.get("profile_id") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const description =
    String(formData.get("description") ?? "").trim() || "Оплата абонемента";
  if (!profile_id || !amount || amount <= 0) return;

  await supabaseAdmin.from("payments").insert({
    profile_id,
    amount,
    description,
    status: "paid",
    payment_method: "manual",
    paid_at: new Date().toISOString(),
  });

  revalidatePath("/admin/clients");
  revalidatePath("/admin/payments");
}

export async function excludeClient(formData: FormData) {
  await requireAdmin();
  const profile_id = String(formData.get("profile_id") ?? "");
  if (!profile_id) return;

  // Убираем из всех групп (аккаунт не удаляем)
  await supabaseAdmin
    .from("client_groups")
    .delete()
    .eq("profile_id", profile_id);

  revalidatePath("/admin/clients");
}

export async function cancelLesson(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("lesson_id") ?? "");
  if (!id) return;
  await supabaseAdmin
    .from("lessons")
    .update({ status: "cancelled" })
    .eq("id", id);
  revalidatePath("/admin/schedule");
}

export async function markAttendance(formData: FormData) {
  await requireAdmin();

  const lesson_id = String(formData.get("lesson_id") ?? "");
  const profile_id = String(formData.get("profile_id") ?? "");
  const status = String(formData.get("status") ?? "present") as
    | "present"
    | "absent"
    | "late";

  if (!lesson_id || !profile_id) return;

  await supabaseAdmin
    .from("attendance")
    .upsert(
      { lesson_id, profile_id, status, marked_at: new Date().toISOString() },
      { onConflict: "lesson_id,profile_id" }
    );

  revalidatePath("/admin/attendance");
}

/* ---------- Новости ---------- */

export async function saveNews(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  let slug = String(formData.get("slug") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim() || null;
  const content = String(formData.get("content") ?? "").trim();
  const image_url = String(formData.get("image_url") ?? "").trim() || null;
  const published =
    formData.get("published") === "on" || formData.get("published") === "true";
  if (!title || !content) return;
  if (!slug) slug = slugify(title);

  const now = new Date().toISOString();
  const base = { title, slug, excerpt, content, image_url, published, updated_at: now };

  if (id) {
    const { data: prev } = await supabaseAdmin
      .from("news")
      .select("published_at")
      .eq("id", id)
      .maybeSingle();
    const published_at = published
      ? (prev as { published_at: string | null } | null)?.published_at ?? now
      : null;
    await supabaseAdmin.from("news").update({ ...base, published_at }).eq("id", id);
  } else {
    await supabaseAdmin
      .from("news")
      .insert({ ...base, published_at: published ? now : null });
  }

  revalidatePath("/admin/news");
  revalidatePath("/news");
}

export async function deleteNews(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await supabaseAdmin.from("news").delete().eq("id", id);
  revalidatePath("/admin/news");
  revalidatePath("/news");
}

/* ---------- Сборы ---------- */

export async function saveCamp(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  let slug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim() || null;
  const date_start = String(formData.get("date_start") ?? "").trim() || null;
  const date_end = String(formData.get("date_end") ?? "").trim() || null;
  const priceRaw = String(formData.get("price") ?? "").trim();
  const price = priceRaw ? Number(priceRaw) : null;
  const image_url = String(formData.get("image_url") ?? "").trim() || null;
  const published =
    formData.get("published") === "on" || formData.get("published") === "true";
  if (!title || !description) return;
  if (!slug) slug = slugify(title);

  const now = new Date().toISOString();
  const base = {
    title,
    slug,
    description,
    location,
    date_start,
    date_end,
    price,
    image_url,
    published,
    updated_at: now,
  };

  if (id) {
    const { data: prev } = await supabaseAdmin
      .from("camps")
      .select("published_at")
      .eq("id", id)
      .maybeSingle();
    const published_at = published
      ? (prev as { published_at: string | null } | null)?.published_at ?? now
      : null;
    await supabaseAdmin.from("camps").update({ ...base, published_at }).eq("id", id);
  } else {
    await supabaseAdmin
      .from("camps")
      .insert({ ...base, published_at: published ? now : null });
  }

  revalidatePath("/admin/camps");
  revalidatePath("/camps");
}

export async function deleteCamp(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await supabaseAdmin.from("camps").delete().eq("id", id);
  revalidatePath("/admin/camps");
  revalidatePath("/camps");
}

/* ---------- Шаблоны расписания ---------- */

export async function saveTemplate(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const group_id = String(formData.get("group_id") ?? "").trim();
  const subgroup_id = String(formData.get("subgroup_id") ?? "").trim() || null;
  const day_of_week = Number(formData.get("day_of_week") ?? 0);
  const start_time = String(formData.get("start_time") ?? "").trim();
  const end_time = String(formData.get("end_time") ?? "").trim();
  const coach = String(formData.get("coach") ?? "").trim();
  if (!name || !group_id || !day_of_week || !start_time || !end_time || !coach)
    return;

  const row = { name, group_id, subgroup_id, day_of_week, start_time, end_time, coach };
  if (id) {
    await supabaseAdmin.from("schedule_templates").update(row).eq("id", id);
  } else {
    await supabaseAdmin.from("schedule_templates").insert(row);
  }
  revalidatePath("/admin/templates");
}

export async function deleteTemplate(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await supabaseAdmin.from("schedule_templates").delete().eq("id", id);
  revalidatePath("/admin/templates");
}

/* ---------- Генерация недели по шаблонам ---------- */

function addDaysISO(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export async function generateWeek(
  mondayISO: string
): Promise<{ created: number; skipped: number }> {
  await requireAdmin();
  if (!mondayISO) return { created: 0, skipped: 0 };

  const { data: templates } = await supabaseAdmin
    .from("schedule_templates")
    .select("*");
  const tpls = (templates ?? []) as {
    group_id: string;
    subgroup_id: string | null;
    day_of_week: number;
    start_time: string;
    end_time: string;
    coach: string;
  }[];
  if (tpls.length === 0) return { created: 0, skipped: 0 };

  const dates = Array.from({ length: 7 }, (_, i) => addDaysISO(mondayISO, i));
  const { data: existing } = await supabaseAdmin
    .from("lessons")
    .select("group_id,date,start_time")
    .in("date", dates);
  const seen = new Set(
    (existing ?? []).map(
      (e: { group_id: string; date: string; start_time: string }) =>
        `${e.group_id}|${e.date}|${e.start_time}`
    )
  );

  const toInsert: Record<string, unknown>[] = [];
  for (const t of tpls) {
    const date = addDaysISO(mondayISO, t.day_of_week - 1);
    const key = `${t.group_id}|${date}|${t.start_time}`;
    if (seen.has(key)) continue;
    seen.add(key);
    toInsert.push({
      group_id: t.group_id,
      subgroup_id: t.subgroup_id ?? null,
      date,
      start_time: t.start_time,
      end_time: t.end_time,
      coach_name: t.coach,
    });
  }

  let created = 0;
  if (toInsert.length) {
    const { data, error } = await supabaseAdmin
      .from("lessons")
      .insert(toInsert)
      .select("id");
    if (!error) created = data?.length ?? 0;
  }

  revalidatePath("/admin/schedule");
  revalidatePath("/admin/attendance");
  return { created, skipped: tpls.length - created };
}

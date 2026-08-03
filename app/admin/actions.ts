"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, digits } from "@/lib/account";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getClientDetail,
  getGroupDetail,
  getClientJournal,
} from "@/lib/queries";
import { slugify } from "@/lib/slug";

/** Читает подробную карточку клиента (для модалки в админке). */
export async function getClientDetailAction(profileId: string) {
  await requireAdmin();
  return getClientDetail(profileId);
}

/** Полный журнал посещений клиента (и его детей). */
export async function getClientJournalAction(profileId: string) {
  await requireAdmin();
  return getClientJournal(profileId);
}

/** Читает подробности группы с участниками (для модалки в админке). */
export async function getGroupDetailAction(groupId: string) {
  await requireAdmin();
  return getGroupDetail(groupId);
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
  // Участник: сам клиент (пусто) или его ребёнок.
  const child_id = String(formData.get("child_id") ?? "").trim() || null;
  if (!profile_id || !group_id) return;

  // select-then-write: уникальность — (profile_id, group_id, child_id),
  // но индекс на COALESCE-выражении, поэтому onConflict тут не подходит.
  let existing = supabaseAdmin
    .from("client_groups")
    .select("id")
    .eq("profile_id", profile_id)
    .eq("group_id", group_id);
  existing = child_id
    ? existing.eq("child_id", child_id)
    : existing.is("child_id", null);
  const { data: found } = await existing.maybeSingle();

  if (found) {
    await supabaseAdmin
      .from("client_groups")
      .update({ subgroup_id })
      .eq("id", (found as { id: string }).id);
  } else {
    await supabaseAdmin
      .from("client_groups")
      .insert({ profile_id, group_id, subgroup_id, child_id });
  }

  revalidatePath("/admin/clients");
  revalidatePath("/admin/groups");
}

/** Удаляет конкретную запись участника в группе по id строки client_groups. */
export async function unenrollClient(formData: FormData) {
  await requireAdmin();
  const cg_id = String(formData.get("cg_id") ?? "");
  if (!cg_id) return;

  await supabaseAdmin.from("client_groups").delete().eq("id", cg_id);

  revalidatePath("/admin/clients");
  revalidatePath("/admin/groups");
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
  const child_id = String(formData.get("child_id") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "present") as
    | "present"
    | "absent"
    | "late";

  if (!lesson_id || !profile_id) return;

  // Уникальность на (lesson, profile, child) с индексом на COALESCE-выражении,
  // поэтому select-then-write вместо upsert.
  let q = supabaseAdmin
    .from("attendance")
    .select("id")
    .eq("lesson_id", lesson_id)
    .eq("profile_id", profile_id);
  q = child_id ? q.eq("child_id", child_id) : q.is("child_id", null);
  const { data: found } = await q.maybeSingle();

  const marked_at = new Date().toISOString();
  if (found) {
    await supabaseAdmin
      .from("attendance")
      .update({ status, marked_at })
      .eq("id", (found as { id: string }).id);
  } else {
    await supabaseAdmin
      .from("attendance")
      .insert({ lesson_id, profile_id, child_id, status, marked_at });
  }

  revalidatePath("/admin/attendance");
  revalidatePath("/admin/clients");
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

/* ---------- Галерея ---------- */

export async function addGalleryImage(formData: FormData) {
  await requireAdmin();
  const image_url = String(formData.get("image_url") ?? "").trim();
  const caption = String(formData.get("caption") ?? "").trim() || null;
  if (!image_url) return;

  await supabaseAdmin.from("gallery").insert({ image_url, caption });

  revalidatePath("/admin/gallery");
  revalidatePath("/");
}

export async function deleteGalleryImage(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const image_url = String(formData.get("image_url") ?? "");
  if (!id) return;

  await supabaseAdmin.from("gallery").delete().eq("id", id);

  // Пытаемся удалить и сам файл из Storage (bucket gallery).
  const marker = "/gallery/";
  const idx = image_url.indexOf(marker);
  if (idx !== -1) {
    const path = image_url.slice(idx + marker.length);
    if (path) {
      try {
        await supabaseAdmin.storage.from("gallery").remove([path]);
      } catch {
        /* файл мог быть внешним URL — игнорируем */
      }
    }
  }

  revalidatePath("/admin/gallery");
  revalidatePath("/");
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

/* ---------- Шаблон-«блокнот» (набор занятий под одним именем) ---------- */

interface TemplateLessonInput {
  date: string; // YYYY-MM-DD — конкретная дата занятия
  group_id: string;
  subgroup_id: string | null;
  start_time: string;
  end_time: string;
  coach: string;
  hall: string | null;
}

/** 1=Пн … 7=Вс из ISO-даты. */
function dowOf(iso: string): number {
  const d = new Date(iso + "T00:00:00");
  return ((d.getDay() + 6) % 7) + 1;
}

/** Сохраняет весь шаблон: удаляет прежние строки этого имени и вставляет заново.
 *  Каждое занятие привязано к конкретной дате (lesson_date). */
export async function saveTemplateSet(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const originalName = String(formData.get("original_name") ?? "").trim();
  let lessons: TemplateLessonInput[] = [];
  try {
    lessons = JSON.parse(String(formData.get("lessons") ?? "[]"));
  } catch (e) {
    console.error("[saveTemplateSet] bad lessons JSON:", e);
    return { ok: false, error: "Некорректные данные занятий" };
  }
  if (!name) return { ok: false, error: "Укажите название шаблона" };

  // Удаляем прежние строки (по старому имени при переименовании и по новому).
  const names = Array.from(new Set([name, originalName].filter(Boolean)));
  const { error: delErr } = await supabaseAdmin
    .from("schedule_templates")
    .delete()
    .in("name", names);
  if (delErr) {
    console.error("[saveTemplateSet] delete:", delErr);
    return { ok: false, error: delErr.message };
  }

  const rows = lessons
    .filter(
      (l) =>
        l.date && l.group_id && l.start_time && l.end_time && l.coach
    )
    .map((l) => ({
      name,
      group_id: l.group_id,
      subgroup_id: l.subgroup_id || null,
      lesson_date: l.date,
      day_of_week: dowOf(l.date),
      start_time: l.start_time,
      end_time: l.end_time,
      coach: l.coach,
      hall: l.hall || null,
    }));

  if (rows.length) {
    const { error: insErr } = await supabaseAdmin
      .from("schedule_templates")
      .insert(rows);
    if (insErr) {
      console.error("[saveTemplateSet] insert:", insErr);
      return { ok: false, error: insErr.message };
    }
  }

  revalidatePath("/admin/templates");
  return { ok: true, count: rows.length };
}

/** Удаляет весь шаблон (все строки этого имени). */
export async function deleteTemplateSet(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await supabaseAdmin.from("schedule_templates").delete().eq("name", name);
  revalidatePath("/admin/templates");
}

/** Применяет шаблон: разворачивает занятия по датам шаблона в реальные lessons
 *  на 31 день вперёд от сегодня. Пропускает дубликаты и даты вне окна. */
export async function applyTemplateMonth(
  name: string
): Promise<{ created: number; skipped: number }> {
  await requireAdmin();
  if (!name) return { created: 0, skipped: 0 };

  const { data: tpls } = await supabaseAdmin
    .from("schedule_templates")
    .select("*")
    .eq("name", name);
  const rows = (tpls ?? []) as {
    group_id: string;
    subgroup_id: string | null;
    lesson_date: string | null;
    start_time: string;
    end_time: string;
    coach: string;
    hall: string | null;
  }[];
  if (rows.length === 0) return { created: 0, skipped: 0 };

  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
  const endISO = addDaysISO(todayISO, 31);

  // Даты, которые реально применяем (в окне [сегодня, +31], есть дата)
  const dated = rows.filter(
    (t) => t.lesson_date && t.lesson_date >= todayISO && t.lesson_date <= endISO
  );

  const dates = Array.from(new Set(dated.map((t) => t.lesson_date as string)));
  const { data: existing } =
    dates.length > 0
      ? await supabaseAdmin
          .from("lessons")
          .select("group_id,date,start_time")
          .in("date", dates)
      : { data: [] };
  const seen = new Set(
    (existing ?? []).map(
      (e: { group_id: string; date: string; start_time: string }) =>
        `${e.group_id}|${e.date}|${e.start_time}`
    )
  );

  const toInsert: Record<string, unknown>[] = [];
  for (const t of dated) {
    const date = t.lesson_date as string;
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
  return { created, skipped: dated.length - created };
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

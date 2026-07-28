import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  monthStartISO,
  type Group,
  type Lesson,
  type Payment,
  type Profile,
  type Attendance,
  type Subgroup,
  type EnrolledGroup,
  type News,
  type Camp,
  type ScheduleTemplate,
} from "@/lib/db";

/* Все запросы обёрнуты в safe() и возвращают пустые данные, если миграция
   ещё не выполнена — чтобы страницы не падали. */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/* ---------- Подгруппы ---------- */

export function getAllSubgroups(): Promise<Subgroup[]> {
  return safe(async () => {
    const { data } = await supabaseAdmin
      .from("subgroups")
      .select("*")
      .order("created_at", { ascending: true });
    return (data ?? []) as Subgroup[];
  }, []);
}

async function subgroupMap(): Promise<Map<string, string>> {
  const subs = await getAllSubgroups();
  return new Map(subs.map((s) => [s.id, s.name]));
}

/* ---------- Клиент ---------- */

export function getProfileGroups(profileId: string): Promise<EnrolledGroup[]> {
  return safe(async () => {
    const subs = await subgroupMap();
    const { data } = await supabaseAdmin
      .from("client_groups")
      .select("*, group:groups(name)")
      .eq("profile_id", profileId);
    return ((data ?? []) as unknown as {
      group_id: string;
      subgroup_id: string | null;
      group: { name: string } | null;
    }[])
      .filter((r) => r.group_id)
      .map((r) => ({
        group_id: r.group_id,
        group_name: r.group?.name ?? "—",
        subgroup_id: r.subgroup_id ?? null,
        subgroup_name: r.subgroup_id ? subs.get(r.subgroup_id) ?? null : null,
      }));
  }, []);
}

export function hasPaidThisMonth(profileId: string): Promise<boolean> {
  return safe(async () => {
    const { data } = await supabaseAdmin
      .from("payments")
      .select("id")
      .eq("profile_id", profileId)
      .eq("status", "paid")
      .gte("created_at", monthStartISO())
      .limit(1);
    return (data ?? []).length > 0;
  }, false);
}

export interface LessonWithMeta extends Lesson {
  group_name: string;
  subgroup_name: string | null;
  attendance: Attendance["status"] | null;
}

export function getProfileLessons(
  profileId: string
): Promise<LessonWithMeta[]> {
  return safe(async () => {
    const subs = await subgroupMap();
    const { data: cg } = await supabaseAdmin
      .from("client_groups")
      .select("group_id")
      .eq("profile_id", profileId);
    const groupIds = (cg ?? []).map((r: { group_id: string }) => r.group_id);
    if (groupIds.length === 0) return [];

    const { data: lessons } = await supabaseAdmin
      .from("lessons")
      .select("*, group:groups(name)")
      .in("group_id", groupIds)
      .order("date", { ascending: true });

    const lessonRows = (lessons ?? []) as (Lesson & {
      group: { name: string } | null;
    })[];

    const { data: att } = await supabaseAdmin
      .from("attendance")
      .select("lesson_id, status")
      .eq("profile_id", profileId);
    const attMap = new Map(
      (att ?? []).map(
        (a: { lesson_id: string; status: Attendance["status"] }) => [
          a.lesson_id,
          a.status,
        ]
      )
    );

    return lessonRows.map((l) => ({
      ...l,
      group_name: l.group?.name ?? "—",
      subgroup_name: l.subgroup_id ? subs.get(l.subgroup_id) ?? null : null,
      attendance: attMap.get(l.id) ?? null,
    }));
  }, []);
}

export function getProfilePayments(profileId: string): Promise<Payment[]> {
  return safe(async () => {
    const { data } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false });
    return (data ?? []) as Payment[];
  }, []);
}

/* ---------- Админ ---------- */

export interface ProfileRow extends Profile {
  enrolled: EnrolledGroup[];
  paid_this_month: boolean;
}

export function getAllProfiles(): Promise<ProfileRow[]> {
  return safe(async () => {
    const subs = await subgroupMap();

    const { data } = await supabaseAdmin
      .from("profiles")
      .select("*, client_groups(*, group:groups(name))")
      .order("created_at", { ascending: false });

    const { data: paid } = await supabaseAdmin
      .from("payments")
      .select("profile_id")
      .eq("status", "paid")
      .gte("created_at", monthStartISO());
    const paidSet = new Set(
      (paid ?? []).map((p: { profile_id: string }) => p.profile_id)
    );

    return ((data ?? []) as unknown as (Profile & {
      client_groups: {
        group_id: string;
        subgroup_id: string | null;
        group: { name: string } | null;
      }[];
    })[]).map((p) => ({
      ...p,
      paid_this_month: paidSet.has(p.id),
      enrolled: (p.client_groups ?? [])
        .filter((cg) => cg.group_id)
        .map((cg) => ({
          group_id: cg.group_id,
          group_name: cg.group?.name ?? "—",
          subgroup_id: cg.subgroup_id ?? null,
          subgroup_name: cg.subgroup_id
            ? subs.get(cg.subgroup_id) ?? null
            : null,
        })),
    }));
  }, []);
}

export function getAllGroups(): Promise<Group[]> {
  return safe(async () => {
    const { data } = await supabaseAdmin
      .from("groups")
      .select("*")
      .order("name");
    return (data ?? []) as Group[];
  }, []);
}

export interface GroupWithCount extends Group {
  student_count: number;
}

export function getGroupsWithCounts(): Promise<GroupWithCount[]> {
  return safe(async () => {
    const { data } = await supabaseAdmin
      .from("groups")
      .select("*, client_groups(count)")
      .order("name");
    return ((data ?? []) as (Group & {
      client_groups: { count: number }[];
    })[]).map((g) => ({
      ...g,
      student_count: g.client_groups?.[0]?.count ?? 0,
    }));
  }, []);
}

export interface PaymentWithClient extends Payment {
  client_name: string;
}

export function getAllPayments(): Promise<PaymentWithClient[]> {
  return safe(async () => {
    const { data } = await supabaseAdmin
      .from("payments")
      .select("*, profile:profiles(first_name,last_name)")
      .order("created_at", { ascending: false });
    return ((data ?? []) as (Payment & {
      profile: { first_name: string; last_name: string } | null;
    })[]).map((p) => ({
      ...p,
      client_name: p.profile
        ? `${p.profile.last_name} ${p.profile.first_name}`
        : "—",
    }));
  }, []);
}

export interface LessonAdmin extends Lesson {
  group_name: string;
  subgroup_name: string | null;
}

export function getAllLessons(): Promise<LessonAdmin[]> {
  return safe(async () => {
    const subs = await subgroupMap();
    const { data } = await supabaseAdmin
      .from("lessons")
      .select("*, group:groups(name)")
      .order("date", { ascending: false });
    return ((data ?? []) as (Lesson & { group: { name: string } | null })[]).map(
      (l) => ({
        ...l,
        group_name: l.group?.name ?? "—",
        subgroup_name: l.subgroup_id ? subs.get(l.subgroup_id) ?? null : null,
      })
    );
  }, []);
}

export interface RosterEntry {
  profile_id: string;
  name: string;
  status: Attendance["status"] | null;
}

export interface LessonRoster {
  lesson: LessonAdmin | null;
  roster: RosterEntry[];
}

export function getLessonRoster(lessonId: string): Promise<LessonRoster> {
  return safe(
    async () => {
      const { data: lesson } = await supabaseAdmin
        .from("lessons")
        .select("*, group:groups(name)")
        .eq("id", lessonId)
        .maybeSingle();
      if (!lesson) return { lesson: null, roster: [] };
      const l = lesson as Lesson & { group: { name: string } | null };

      const { data: cg } = await supabaseAdmin
        .from("client_groups")
        .select("profile:profiles(id,first_name,last_name,patronymic)")
        .eq("group_id", l.group_id);

      const { data: att } = await supabaseAdmin
        .from("attendance")
        .select("profile_id,status")
        .eq("lesson_id", lessonId);
      const attMap = new Map(
        (att ?? []).map(
          (a: { profile_id: string; status: Attendance["status"] }) => [
            a.profile_id,
            a.status,
          ]
        )
      );

      const roster: RosterEntry[] = (
        (cg ?? []) as unknown as {
          profile: {
            id: string;
            first_name: string;
            last_name: string;
            patronymic: string | null;
          } | null;
        }[]
      )
        .filter((r) => r.profile)
        .map((r) => ({
          profile_id: r.profile!.id,
          name: `${r.profile!.last_name} ${r.profile!.first_name}`,
          status: attMap.get(r.profile!.id) ?? null,
        }));

      return {
        lesson: { ...l, group_name: l.group?.name ?? "—", subgroup_name: null },
        roster,
      };
    },
    { lesson: null, roster: [] }
  );
}

/* ---------- Детальная карточка клиента (админ) ---------- */

export interface ClientDetail {
  profile: Profile;
  enrolled: EnrolledGroup[];
  payments: Payment[];
  paidThisMonth: boolean;
  attendedThisMonth: number;
  totalThisMonth: number;
  attendedAllTime: number;
  totalAllTime: number;
}

export function getClientDetail(profileId: string): Promise<ClientDetail | null> {
  return safe(
    async () => {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .maybeSingle();
      if (!profile) return null;

      const [enrolled, payments] = await Promise.all([
        getProfileGroups(profileId),
        getProfilePayments(profileId),
      ]);

      const paidThisMonth = payments.some(
        (p) => p.status === "paid" && p.created_at >= monthStartISO()
      );

      const groupIds = enrolled.map((e) => e.group_id);
      const today = todayISO();
      const ms = monthStartISO();

      let totalAllTime = 0;
      let totalThisMonth = 0;
      if (groupIds.length) {
        const { data: occurred } = await supabaseAdmin
          .from("lessons")
          .select("date")
          .in("group_id", groupIds)
          .neq("status", "cancelled")
          .lte("date", today);
        const rows = (occurred ?? []) as { date: string }[];
        totalAllTime = rows.length;
        totalThisMonth = rows.filter((r) => r.date >= ms).length;
      }

      const { data: att } = await supabaseAdmin
        .from("attendance")
        .select("status, lesson:lessons(date)")
        .eq("profile_id", profileId)
        .in("status", ["present", "late"]);
      const attRows = (att ?? []) as unknown as {
        lesson: { date: string } | null;
      }[];
      const attendedAllTime = attRows.length;
      const attendedThisMonth = attRows.filter(
        (a) => (a.lesson?.date ?? "") >= ms
      ).length;

      return {
        profile: profile as Profile,
        enrolled,
        payments,
        paidThisMonth,
        attendedThisMonth,
        totalThisMonth,
        attendedAllTime,
        totalAllTime,
      };
    },
    null
  );
}

/* ---------- Новости ---------- */

export function getPublishedNews(limit?: number): Promise<News[]> {
  return safe(async () => {
    let q = supabaseAdmin
      .from("news")
      .select("*")
      .eq("published", true)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (limit) q = q.limit(limit);
    const { data } = await q;
    return (data ?? []) as News[];
  }, []);
}

export function getNewsBySlug(slug: string): Promise<News | null> {
  return safe(async () => {
    const { data } = await supabaseAdmin
      .from("news")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    return (data as News) ?? null;
  }, null);
}

export function getAllNews(): Promise<News[]> {
  return safe(async () => {
    const { data } = await supabaseAdmin
      .from("news")
      .select("*")
      .order("created_at", { ascending: false });
    return (data ?? []) as News[];
  }, []);
}

export function getNewsById(id: string): Promise<News | null> {
  return safe(async () => {
    const { data } = await supabaseAdmin
      .from("news")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return (data as News) ?? null;
  }, null);
}

/* ---------- Сборы ---------- */

export function getPublishedCamps(): Promise<Camp[]> {
  return safe(async () => {
    const { data } = await supabaseAdmin
      .from("camps")
      .select("*")
      .eq("published", true)
      .order("date_start", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    return (data ?? []) as Camp[];
  }, []);
}

export function getCampBySlug(slug: string): Promise<Camp | null> {
  return safe(async () => {
    const { data } = await supabaseAdmin
      .from("camps")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    return (data as Camp) ?? null;
  }, null);
}

export function getAllCamps(): Promise<Camp[]> {
  return safe(async () => {
    const { data } = await supabaseAdmin
      .from("camps")
      .select("*")
      .order("created_at", { ascending: false });
    return (data ?? []) as Camp[];
  }, []);
}

export function getCampById(id: string): Promise<Camp | null> {
  return safe(async () => {
    const { data } = await supabaseAdmin
      .from("camps")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return (data as Camp) ?? null;
  }, null);
}

/* ---------- Шаблоны расписания ---------- */

export interface TemplateRow extends ScheduleTemplate {
  group_name: string;
  subgroup_name: string | null;
}

export function getScheduleTemplates(): Promise<TemplateRow[]> {
  return safe(async () => {
    const subs = await subgroupMap();
    const { data } = await supabaseAdmin
      .from("schedule_templates")
      .select("*, group:groups(name)")
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });
    return ((data ?? []) as (ScheduleTemplate & {
      group: { name: string } | null;
    })[]).map((t) => ({
      ...t,
      group_name: t.group?.name ?? "—",
      subgroup_name: t.subgroup_id ? subs.get(t.subgroup_id) ?? null : null,
    }));
  }, []);
}

export function getTemplateById(id: string): Promise<ScheduleTemplate | null> {
  return safe(async () => {
    const { data } = await supabaseAdmin
      .from("schedule_templates")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return (data as ScheduleTemplate) ?? null;
  }, null);
}

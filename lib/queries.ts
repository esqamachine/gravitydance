import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  monthStartISO,
  paidCutoffISO,
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
  type Child,
  type GalleryImage,
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

/* ---------- Дети клиента ---------- */

export function getProfileChildren(profileId: string): Promise<Child[]> {
  return safe(async () => {
    const { data } = await supabaseAdmin
      .from("children")
      .select("*")
      .eq("parent_id", profileId)
      .order("created_at", { ascending: true });
    return (data ?? []) as Child[];
  }, []);
}

/* ---------- Клиент ---------- */

export function getProfileGroups(profileId: string): Promise<EnrolledGroup[]> {
  return safe(async () => {
    const subs = await subgroupMap();
    // Обогащённый запрос с участником-ребёнком. До миграций 012/013 столбца
    // child_id и таблицы children нет — тогда падаем на легаси-запрос, чтобы
    // группы клиента не пропадали.
    const enriched = await supabaseAdmin
      .from("client_groups")
      .select(
        "id, group_id, subgroup_id, child_id, group:groups(name), child:children(full_name)"
      )
      .eq("profile_id", profileId);

    if (enriched.error) {
      const legacy = await supabaseAdmin
        .from("client_groups")
        .select("id, group_id, subgroup_id, group:groups(name)")
        .eq("profile_id", profileId);
      return ((legacy.data ?? []) as unknown as {
        id: string;
        group_id: string;
        subgroup_id: string | null;
        group: { name: string } | null;
      }[])
        .filter((r) => r.group_id)
        .map((r) => ({
          cg_id: r.id,
          group_id: r.group_id,
          group_name: r.group?.name ?? "—",
          subgroup_id: r.subgroup_id ?? null,
          subgroup_name: r.subgroup_id ? subs.get(r.subgroup_id) ?? null : null,
          child_id: null,
          participant_name: null,
        }));
    }

    return ((enriched.data ?? []) as unknown as {
      id: string;
      group_id: string;
      subgroup_id: string | null;
      child_id: string | null;
      group: { name: string } | null;
      child: { full_name: string } | null;
    }[])
      .filter((r) => r.group_id)
      .map((r) => ({
        cg_id: r.id,
        group_id: r.group_id,
        group_name: r.group?.name ?? "—",
        subgroup_id: r.subgroup_id ?? null,
        subgroup_name: r.subgroup_id ? subs.get(r.subgroup_id) ?? null : null,
        child_id: r.child_id ?? null,
        participant_name: r.child?.full_name ?? null,
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
      .gte("created_at", paidCutoffISO())
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
      .gte("created_at", paidCutoffISO());
    const paidSet = new Set(
      (paid ?? []).map((p: { profile_id: string }) => p.profile_id)
    );

    return ((data ?? []) as unknown as (Profile & {
      client_groups: {
        id: string;
        group_id: string;
        subgroup_id: string | null;
        child_id?: string | null;
        group: { name: string } | null;
      }[];
    })[]).map((p) => ({
      ...p,
      paid_this_month: paidSet.has(p.id),
      enrolled: (p.client_groups ?? [])
        .filter((cg) => cg.group_id)
        .map((cg) => ({
          cg_id: cg.id,
          group_id: cg.group_id,
          group_name: cg.group?.name ?? "—",
          subgroup_id: cg.subgroup_id ?? null,
          subgroup_name: cg.subgroup_id
            ? subs.get(cg.subgroup_id) ?? null
            : null,
          child_id: cg.child_id ?? null,
          participant_name: null,
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

/* ---------- Детали группы с участниками (админ) ---------- */

export interface GroupParticipant {
  cg_id: string;
  name: string;
  phone: string;
  subgroup_id: string | null;
  is_child: boolean;
  paid: boolean;
}

export interface GroupDetail {
  group: Group;
  subgroups: Subgroup[];
  participants: GroupParticipant[];
}

export function getGroupDetail(groupId: string): Promise<GroupDetail | null> {
  return safe(
    async () => {
      const { data: group } = await supabaseAdmin
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .maybeSingle();
      if (!group) return null;

      const { data: subgroups } = await supabaseAdmin
        .from("subgroups")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true });

      const { data: cg } = await supabaseAdmin
        .from("client_groups")
        .select(
          "id, subgroup_id, child_id, profile:profiles(id,first_name,last_name,patronymic,phone), child:children(full_name,phone)"
        )
        .eq("group_id", groupId);

      const rows = (cg ?? []) as unknown as {
        id: string;
        subgroup_id: string | null;
        child_id: string | null;
        profile: {
          id: string;
          first_name: string;
          last_name: string;
          patronymic: string | null;
          phone: string;
        } | null;
        child: { full_name: string; phone: string | null } | null;
      }[];

      // Кто оплатил в этом месяце (по родительскому профилю)
      const profileIds = rows.map((r) => r.profile?.id).filter(Boolean) as string[];
      const paidSet = new Set<string>();
      if (profileIds.length) {
        const { data: paid } = await supabaseAdmin
          .from("payments")
          .select("profile_id")
          .eq("status", "paid")
          .gte("created_at", paidCutoffISO())
          .in("profile_id", profileIds);
        (paid ?? []).forEach((p: { profile_id: string }) =>
          paidSet.add(p.profile_id)
        );
      }

      const participants: GroupParticipant[] = rows
        .filter((r) => r.profile)
        .map((r) => {
          const isChild = !!r.child_id && !!r.child;
          return {
            cg_id: r.id,
            name: isChild
              ? r.child!.full_name
              : `${r.profile!.last_name} ${r.profile!.first_name}`,
            phone: (isChild ? r.child!.phone : r.profile!.phone) || "—",
            subgroup_id: r.subgroup_id ?? null,
            is_child: isChild,
            paid: paidSet.has(r.profile!.id),
          };
        });

      return {
        group: group as Group,
        subgroups: (subgroups ?? []) as Subgroup[],
        participants,
      };
    },
    null
  );
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
  child_id: string | null;
  is_child: boolean;
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
        .select(
          "child_id, profile:profiles(id,first_name,last_name,patronymic), child:children(full_name)"
        )
        .eq("group_id", l.group_id);

      const { data: att } = await supabaseAdmin
        .from("attendance")
        .select("profile_id,child_id,status")
        .eq("lesson_id", lessonId);
      const key = (pid: string, cid: string | null) => `${pid}|${cid ?? ""}`;
      const attMap = new Map(
        (att ?? []).map(
          (a: {
            profile_id: string;
            child_id: string | null;
            status: Attendance["status"];
          }) => [key(a.profile_id, a.child_id ?? null), a.status]
        )
      );

      const roster: RosterEntry[] = (
        (cg ?? []) as unknown as {
          child_id: string | null;
          profile: {
            id: string;
            first_name: string;
            last_name: string;
            patronymic: string | null;
          } | null;
          child: { full_name: string } | null;
        }[]
      )
        .filter((r) => r.profile)
        .map((r) => {
          const isChild = !!r.child_id && !!r.child;
          return {
            profile_id: r.profile!.id,
            child_id: r.child_id ?? null,
            is_child: isChild,
            name: isChild
              ? r.child!.full_name
              : `${r.profile!.last_name} ${r.profile!.first_name}`,
            status: attMap.get(key(r.profile!.id, r.child_id ?? null)) ?? null,
          };
        });

      return {
        lesson: { ...l, group_name: l.group?.name ?? "—", subgroup_name: null },
        roster,
      };
    },
    { lesson: null, roster: [] }
  );
}

/* ---------- Журнал посещений клиента (и его детей) ---------- */

export interface JournalEntry {
  id: string;
  date: string;
  group_name: string;
  participant: string; // «основной» или имя ребёнка
  status: Attendance["status"];
}

export function getClientJournal(profileId: string): Promise<JournalEntry[]> {
  return safe(async () => {
    const { data } = await supabaseAdmin
      .from("attendance")
      .select(
        "id, status, marked_at, child:children(full_name), lesson:lessons(date, group:groups(name))"
      )
      .eq("profile_id", profileId)
      .order("marked_at", { ascending: false });

    return ((data ?? []) as unknown as {
      id: string;
      status: Attendance["status"];
      child: { full_name: string } | null;
      lesson: { date: string; group: { name: string } | null } | null;
    }[]).map((a) => ({
      id: a.id,
      date: a.lesson?.date ?? "",
      group_name: a.lesson?.group?.name ?? "—",
      participant: a.child?.full_name ?? "основной",
      status: a.status,
    }));
  }, []);
}

/* ---------- Детальная карточка клиента (админ) ---------- */

export interface ClientDetail {
  profile: Profile;
  children: Child[];
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

      const [enrolled, payments, children] = await Promise.all([
        getProfileGroups(profileId),
        getProfilePayments(profileId),
        getProfileChildren(profileId),
      ]);

      const paidThisMonth = payments.some(
        (p) => p.status === "paid" && p.created_at >= paidCutoffISO()
      );

      const groupIds = enrolled.map((e) => e.group_id);
      const ms = monthStartISO();
      // Начало следующего месяца — верхняя граница «текущего месяца».
      const _d = new Date();
      const nextMs = `${
        _d.getMonth() === 11 ? _d.getFullYear() + 1 : _d.getFullYear()
      }-${String(((_d.getMonth() + 1) % 12) + 1).padStart(2, "0")}-01`;

      // Y = сколько занятий у групп клиента в текущем месяце (всего по расписанию).
      let totalThisMonth = 0;
      if (groupIds.length) {
        const { count } = await supabaseAdmin
          .from("lessons")
          .select("id", { count: "exact", head: true })
          .in("group_id", groupIds)
          .neq("status", "cancelled")
          .gte("date", ms)
          .lt("date", nextMs);
        totalThisMonth = count ?? 0;
      }

      // Отметки посещений клиента (и его детей — profile_id указывает на родителя).
      const { data: att } = await supabaseAdmin
        .from("attendance")
        .select("status, lesson:lessons(date)")
        .eq("profile_id", profileId);
      const attRows = (att ?? []) as unknown as {
        lesson: { date: string } | null;
      }[];
      // Всего посещений = сколько всего отметок (одна цифра).
      const attendedAllTime = attRows.length;
      const totalAllTime = attendedAllTime; // совместимость с интерфейсом
      // X = сколько отметок приходится на занятия текущего месяца.
      const attendedThisMonth = attRows.filter((a) => {
        const d = a.lesson?.date ?? "";
        return d >= ms && d < nextMs;
      }).length;

      return {
        profile: profile as Profile,
        children,
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

/* ---------- Галерея ---------- */

export function getGalleryImages(): Promise<GalleryImage[]> {
  return safe(async () => {
    const { data } = await supabaseAdmin
      .from("gallery")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    return (data ?? []) as GalleryImage[];
  }, []);
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
      .order("lesson_date", { ascending: true, nullsFirst: false })
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

/** Шаблон-«блокнот»: набор занятий на неделю под одним именем. */
export interface TemplateSet {
  name: string;
  lessons: TemplateRow[];
}

export function getTemplateSets(): Promise<TemplateSet[]> {
  return safe(async () => {
    const rows = await getScheduleTemplates();
    const byName = new Map<string, TemplateRow[]>();
    for (const r of rows) {
      const arr = byName.get(r.name) ?? [];
      arr.push(r);
      byName.set(r.name, arr);
    }
    return Array.from(byName.entries())
      .map(([name, lessons]) => ({
        name,
        lessons: lessons.sort(
          (a, b) =>
            (a.lesson_date ?? "").localeCompare(b.lesson_date ?? "") ||
            a.start_time.localeCompare(b.start_time)
        ),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
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

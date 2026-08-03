/* Типы строк таблиц Supabase (см. supabase/migrations/001_init.sql) */

export type Role = "client" | "admin" | "coach";

export interface Profile {
  id: string;
  phone: string;
  email: string | null;
  first_name: string;
  last_name: string;
  patronymic: string | null;
  role: Role;
  birth_date: string | null;
  created_at: string;
}

/** Ребёнок клиента (таблица children, миграция 012). */
export interface Child {
  id: string;
  parent_id: string;
  full_name: string;
  phone: string | null;
  birth_date: string | null;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  age_range: string | null;
  schedule: string | null;
  duration: string | null;
  max_students: number;
  is_active: boolean;
}

export interface Subgroup {
  id: string;
  group_id: string;
  name: string;
  created_at: string;
}

export interface ClientGroup {
  id: string;
  profile_id: string;
  group_id: string;
  subgroup_id: string | null;
  enrolled_at: string;
}

/** Группа клиента с (опциональной) подгруппой — для ЛК и админки.
 *  Участник: сам клиент (child_id=null) либо его ребёнок (participant_name). */
export interface EnrolledGroup {
  cg_id: string;
  group_id: string;
  group_name: string;
  subgroup_id: string | null;
  subgroup_name: string | null;
  child_id: string | null;
  participant_name: string | null; // имя ребёнка, либо null = «основной»
}

export interface Lesson {
  id: string;
  group_id: string;
  subgroup_id: string | null;
  date: string;
  start_time: string;
  end_time: string;
  coach_name: string | null;
  status: "scheduled" | "completed" | "cancelled";
  created_at: string;
}

/** ISO-дата первого дня текущего месяца (локально). */
export function monthStartISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export interface Attendance {
  id: string;
  lesson_id: string;
  profile_id: string;
  status: "present" | "absent" | "late";
  marked_at: string;
}

export interface Payment {
  id: string;
  profile_id: string;
  amount: number;
  description: string | null;
  status: "pending" | "paid" | "failed" | "refunded";
  payment_method: string | null;
  external_id: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface News {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  image_url: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Camp {
  id: string;
  title: string;
  slug: string;
  description: string;
  location: string | null;
  date_start: string | null;
  date_end: string | null;
  price: number | null;
  image_url: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GalleryImage {
  id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export interface ScheduleTemplate {
  id: string;
  name: string;
  group_id: string;
  subgroup_id: string | null;
  day_of_week: number; // 1=Пн … 7=Вс
  start_time: string;
  end_time: string;
  coach: string;
  hall: string | null;
  created_at: string;
}

/** 1=Понедельник … 7=Воскресенье */
export const DOW_RU = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
];

export function fullName(p: {
  last_name: string;
  first_name: string;
  patronymic?: string | null;
}): string {
  return [p.last_name, p.first_name, p.patronymic].filter(Boolean).join(" ");
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export const PAYMENT_STATUS_RU: Record<Payment["status"], string> = {
  pending: "Ожидает",
  paid: "Оплачено",
  failed: "Ошибка",
  refunded: "Возврат",
};

export const ATTENDANCE_RU: Record<Attendance["status"], string> = {
  present: "Был",
  absent: "Не был",
  late: "Опоздал",
};

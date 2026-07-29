/* ---------- Нормализация телефона ----------
   Единый формат хранения/сопоставления по всему проекту.
   getSession() сопоставляет profiles.phone с digits(auth.users.phone),
   поэтому канонический вид — 11 цифр «79XXXXXXXXX» (без плюса). */

/** Приводит любой ввод к «79XXXXXXXXX» (11 цифр) или "" если номер некорректный. */
export function normalizePhone(input: string): string {
  let d = (input ?? "").replace(/\D/g, "");
  // ведущая 8 → 7 (российские номера)
  if (d.length === 11 && d[0] === "8") d = "7" + d.slice(1);
  // 10 цифр без кода страны (9XXXXXXXXX) → добавляем 7
  if (d.length === 10 && d[0] === "9") d = "7" + d;
  if (d.length === 11 && d[0] === "7") return d;
  return "";
}

/** «79XXXXXXXXX» → «+7XXXXXXXXXX». Для нормализованного номера. */
export function toPlus(norm: string): string {
  return norm.length === 11 ? "+" + norm : norm;
}

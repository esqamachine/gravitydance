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

/** Маска для поля ввода: любой ввод → «+7 (XXX) XXX-XX-XX». */
export function formatPhoneInput(value: string): string {
  let d = (value ?? "").replace(/\D/g, "").replace(/^8/, "7");
  if (d[0] !== "7") d = "7" + d;
  d = d.slice(0, 11);
  const p = d.slice(1);
  let out = "+7";
  if (p.length > 0) out += " (" + p.slice(0, 3);
  if (p.length >= 3) out += ") " + p.slice(3, 6);
  if (p.length >= 6) out += "-" + p.slice(6, 8);
  if (p.length >= 8) out += "-" + p.slice(8, 10);
  return out;
}

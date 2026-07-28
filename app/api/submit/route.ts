import { normalizePhone, toPlus } from "@/lib/phone";

/** Экранирование для parse_mode: HTML */
function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Текущие дата и время по Москве */
function moscowTime(): string {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

export async function POST(request: Request) {
  let body: { name?: string; phone?: string; group?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Некорректный запрос" }, { status: 500 });
  }

  const name = (body.name ?? "").trim();
  const phone = (body.phone ?? "").trim();
  const group = (body.group ?? "").trim();

  // Валидация: имя и телефон обязательны
  if (!name || !phone) {
    return Response.json(
      { error: "Имя и телефон обязательны" },
      { status: 400 }
    );
  }

  // Нормализуем телефон к +7XXXXXXXXXX (если распознан), иначе оставляем как есть
  const norm = normalizePhone(phone);
  const phoneOut = norm ? toPlus(norm) : phone;

  const text =
    `📩 Новая заявка с сайта!\n\n` +
    `👤 Имя: ${esc(name)}\n` +
    `📞 Телефон: ${esc(phoneOut)}\n` +
    `💃 Группа: ${esc(group || "не указана")}\n` +
    `🕐 Время: ${moscowTime()} (МСК)`;

  // Отправка в Telegram. Если недоступен — логируем, но пользователю
  // всё равно показываем успех.
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.error("[submit] Не заданы TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID");
    } else {
      // Тело — строго JSON.stringify (не URLSearchParams/FormData),
      // Content-Type с charset=utf-8, чтобы кириллица дошла корректно.
      const payload = JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      });

      const res = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          // Явно кодируем в UTF-8 байты — гарантирует корректную кириллицу.
          body: new TextEncoder().encode(payload),
        }
      );

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        console.error(`[submit] Telegram вернул ${res.status}: ${detail}`);
      }
    }
  } catch (err) {
    console.error("[submit] Ошибка отправки в Telegram:", err);
  }

  // Заявка принята — всегда показываем пользователю успех
  return Response.json({ success: true }, { status: 200 });
}

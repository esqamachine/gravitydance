/** Экранирование для parse_mode: HTML */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST(request: Request) {
  const { name, phone, group } = await request.json();

  // Валидация
  if (!name || !phone) {
    return Response.json({ error: "Заполните все поля" }, { status: 400 });
  }

  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    return Response.json(
      { error: "Приём заявок временно недоступен" },
      { status: 500 }
    );
  }

  let text = `📩 Новая заявка!\n\n👤 Имя: ${esc(name)}\n📱 Телефон: ${esc(
    phone
  )}`;
  if (group) text += `\n💃 Группа: ${esc(group)}`;

  const res = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text,
        parse_mode: "HTML",
      }),
    }
  );

  if (!res.ok) {
    return Response.json({ error: "Ошибка отправки" }, { status: 500 });
  }

  return Response.json({ success: true });
}

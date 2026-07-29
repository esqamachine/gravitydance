import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/phone";

/** Разбивает «Имя Фамилия» на first_name/last_name (профиль хранит их раздельно). */
function splitName(full: string): { first_name: string; last_name: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  return {
    first_name: parts[0] ?? "",
    last_name: parts.slice(1).join(" "),
  };
}

/**
 * POST /api/auth/register  { name, phone, email, password }
 * Создаёт пользователя (email сразу подтверждён — письмо не требуется) и профиль.
 * Клиент после успеха делает signInWithPassword для автовхода.
 */
export async function POST(request: Request) {
  const missingEnv = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ].filter((k) => !process.env[k]);
  if (missingEnv.length) {
    console.error("[register] Нет переменных окружения:", missingEnv.join(", "));
    return Response.json({ error: "Сервис не настроен" }, { status: 500 });
  }

  let body: { name?: string; phone?: string; email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const phone = normalizePhone(body.phone ?? "");

  if (!name) return Response.json({ error: "Укажите имя" }, { status: 400 });
  if (!email.includes("@"))
    return Response.json({ error: "Некорректный email" }, { status: 400 });
  if (!phone)
    return Response.json({ error: "Некорректный номер телефона" }, { status: 400 });
  if (password.length < 6)
    return Response.json(
      { error: "Пароль должен быть не короче 6 символов" },
      { status: 400 }
    );

  // Телефон уже занят другим профилем?
  const { data: byPhone } = await supabaseAdmin
    .from("profiles")
    .select("id, email")
    .eq("phone", phone)
    .maybeSingle();
  if (byPhone && byPhone.email && byPhone.email.toLowerCase() !== email) {
    return Response.json(
      { error: "Этот номер телефона уже зарегистрирован" },
      { status: 409 }
    );
  }

  console.log("[register] Создаю пользователя:", { email, phone });

  // Создаём пользователя с подтверждённым email (без письма-подтверждения)
  const { data: created, error: createErr } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createErr || !created?.user) {
    const msg = createErr?.message ?? "";
    if (/already|registered|exists/i.test(msg)) {
      return Response.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 409 }
      );
    }
    console.error("[register] createUser:", msg);
    return Response.json({ error: "Не удалось создать аккаунт" }, { status: 500 });
  }

  // Создаём/обновляем профиль (getSession сопоставляет по email)
  const { first_name, last_name } = splitName(name);
  const { error: profErr } = await supabaseAdmin.from("profiles").upsert(
    { phone, email, first_name, last_name },
    { onConflict: "phone" }
  );

  if (profErr) {
    // Откатываем созданного пользователя, чтобы не осталось «half-registered»
    await supabaseAdmin.auth.admin.deleteUser(created.user.id).catch(() => {});
    console.error("[register] Профиль:", {
      message: profErr.message,
      code: profErr.code,
      details: profErr.details,
      hint: profErr.hint,
    });
    return Response.json({ error: "Не удалось сохранить профиль" }, { status: 500 });
  }

  console.log("[register] Успех:", { userId: created.user.id, email, phone });
  return Response.json({ success: true });
}

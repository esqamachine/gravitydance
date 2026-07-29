import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/phone";

/**
 * POST /api/auth/resolve-phone  { phone }
 * Возвращает email профиля по номеру телефона (для входа по паролю, когда
 * пользователь ввёл телефон вместо email). Профили закрыты RLS — читаем через
 * service_role.
 */
export async function POST(request: Request) {
  let body: { phone?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const phone = normalizePhone(body.phone ?? "");
  if (!phone) {
    return Response.json({ error: "Некорректный номер телефона" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("email")
    .eq("phone", phone)
    .maybeSingle();

  if (error) {
    console.error("[resolve-phone] Ошибка чтения профиля:", {
      message: error.message,
      code: error.code,
    });
    return Response.json({ error: "Ошибка сервера" }, { status: 500 });
  }
  if (!data?.email) {
    console.log("[resolve-phone] Не найден профиль/email для телефона:", phone);
    return Response.json(
      { error: "Аккаунт с таким номером не найден" },
      { status: 404 }
    );
  }

  console.log("[resolve-phone] Телефон", phone, "→ email", data.email);
  return Response.json({ email: data.email });
}

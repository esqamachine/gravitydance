import { getSession } from "@/lib/account";
import { supabaseAdmin } from "@/lib/supabase/admin";

const ALLOWED_BUCKETS = ["news", "camps", "gallery"];

/**
 * POST /api/admin/upload  (multipart: file, bucket)
 * Загружает изображение в Supabase Storage (через service_role) и возвращает
 * публичный URL. Только для админов.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (session?.profile?.role !== "admin") {
    return Response.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const file = form.get("file");
  const bucket = String(form.get("bucket") ?? "");
  if (!(file instanceof File)) {
    return Response.json({ error: "Файл не передан" }, { status: 400 });
  }
  if (!ALLOWED_BUCKETS.includes(bucket)) {
    return Response.json({ error: "Неизвестный bucket" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return Response.json({ error: "Только изображения" }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return Response.json({ error: "Файл больше 8 МБ" }, { status: 400 });
  }

  const ext = (file.name.split(".").pop() || "jpg")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = new Uint8Array(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (error) {
    console.error("[upload] Storage:", error.message);
    return Response.json(
      { error: "Не удалось загрузить (bucket создан миграцией 015?)" },
      { status: 500 }
    );
  }

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  return Response.json({ url: data.publicUrl });
}

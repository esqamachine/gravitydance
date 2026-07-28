import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Админский клиент с service_role — ОБХОДИТ RLS.
 * Использовать ТОЛЬКО на сервере (server components, route handlers, actions).
 * Никогда не импортировать в клиентские компоненты.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

-- ============================================================
-- Миграция 010: онлайн-статус пользователей
-- Выполнить в Supabase → SQL Editor. Идемпотентна.
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_last_seen BOOLEAN DEFAULT true;

-- ============================================================
-- Миграция 012: Дети клиентов + дата рождения профиля
-- Выполнить в Supabase → SQL Editor (после 001, 002).
-- Идемпотентна.
--
-- ПРИМЕЧАНИЕ: parent_id ссылается на profiles(id), а НЕ на auth.users(id).
-- В этом проекте profiles.id — независимый ключ (getSession сопоставляет
-- пользователя с профилем по email/телефону), и вся админка джойнит по profiles.
-- Доступ к таблице идёт через server actions на service_role (как везде),
-- поэтому RLS-политики построены на существующем хелпере public.is_admin().
-- ============================================================

CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  birth_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_children_parent ON children(parent_id);

ALTER TABLE children ENABLE ROW LEVEL SECURITY;

-- Читать всех детей могут админы (клиентский доступ — через server actions).
DROP POLICY IF EXISTS "children admin all" ON children;
CREATE POLICY "children admin all" ON children FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Дата рождения самого клиента (пока необязательная).
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS birth_date DATE;

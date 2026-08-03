-- ============================================================
-- Миграция 006: RLS self-read для мобильного приложения
-- Выполнить в Supabase → SQL Editor (после 001–004). Идемпотентна.
--
-- Зачем: profiles / client_groups / payments имеют RLS БЕЗ политик, поэтому
-- с anon-ключом мобильное приложение их не читает. Сайт обходит это через
-- service_role на сервере, но в приложении service_role держать нельзя.
-- Разрешаем авторизованному пользователю читать ТОЛЬКО свои строки (по email
-- из JWT). Права на запись не выдаём — админка по-прежнему через service_role.
-- ============================================================

-- Профиль: пользователь видит свой профиль (сопоставление по email)
DROP POLICY IF EXISTS "own profile read" ON profiles;
CREATE POLICY "own profile read" ON profiles
  FOR SELECT TO authenticated
  USING (lower(email) = lower(auth.jwt() ->> 'email'));

-- Профиль: пользователь может редактировать свой профиль (имя и т.п.)
DROP POLICY IF EXISTS "own profile update" ON profiles;
CREATE POLICY "own profile update" ON profiles
  FOR UPDATE TO authenticated
  USING (lower(email) = lower(auth.jwt() ->> 'email'))
  WITH CHECK (lower(email) = lower(auth.jwt() ->> 'email'));

-- Группы клиента: строки, чей profile_id принадлежит текущему пользователю
DROP POLICY IF EXISTS "own client_groups read" ON client_groups;
CREATE POLICY "own client_groups read" ON client_groups
  FOR SELECT TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE lower(email) = lower(auth.jwt() ->> 'email')
    )
  );

-- Платежи клиента
DROP POLICY IF EXISTS "own payments read" ON payments;
CREATE POLICY "own payments read" ON payments
  FOR SELECT TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE lower(email) = lower(auth.jwt() ->> 'email')
    )
  );

-- ============================================================
-- Миграция 022: self-доступ к таблице children для мобильного приложения
-- Выполнить в Supabase → SQL Editor (после 012/013). Идемпотентна.
--
-- Зачем: до сих пор у children была только политика admin-all (сайт пишет через
-- service_role). В приложении service_role держать нельзя, поэтому разрешаем
-- авторизованному пользователю управлять ТОЛЬКО своими детьми — по email из JWT,
-- т.к. profiles.id ≠ auth.uid() (сопоставление идёт по email).
--
-- Группу ребёнка приложение читает через client_groups (child_id), где
-- profile_id = родитель, поэтому существующая политика «own client_groups read»
-- из 006 уже пускает — отдельная политика на группы не нужна.
-- ============================================================

-- Читать своих детей.
DROP POLICY IF EXISTS "own children read" ON children;
CREATE POLICY "own children read" ON children
  FOR SELECT TO authenticated
  USING (
    parent_id IN (
      SELECT id FROM profiles WHERE lower(email) = lower(auth.jwt() ->> 'email')
    )
  );

-- Добавлять ребёнка себе.
DROP POLICY IF EXISTS "own children insert" ON children;
CREATE POLICY "own children insert" ON children
  FOR INSERT TO authenticated
  WITH CHECK (
    parent_id IN (
      SELECT id FROM profiles WHERE lower(email) = lower(auth.jwt() ->> 'email')
    )
  );

-- Удалять своего ребёнка.
DROP POLICY IF EXISTS "own children delete" ON children;
CREATE POLICY "own children delete" ON children
  FOR DELETE TO authenticated
  USING (
    parent_id IN (
      SELECT id FROM profiles WHERE lower(email) = lower(auth.jwt() ->> 'email')
    )
  );

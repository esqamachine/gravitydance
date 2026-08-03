-- ============================================================
-- Миграция 015: Storage buckets для фото (новости, сборы, галерея)
-- Выполнить после 002 (нужен public.is_admin()) и 014.
-- Идемпотентна.
--
-- ПРИМЕЧАНИЕ: загрузка/удаление в Storage идёт через server actions на
-- service_role (обходит RLS), но политики ниже позволяют это и напрямую
-- авторизованному админу. Проверка админа — через public.is_admin().
-- ============================================================

-- Публичные бакеты
INSERT INTO storage.buckets (id, name, public) VALUES ('news', 'news', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('camps', 'camps', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true)
  ON CONFLICT (id) DO NOTHING;

-- Загрузка (INSERT) в любой из бакетов — только админ
DROP POLICY IF EXISTS "media admin upload" ON storage.objects;
CREATE POLICY "media admin upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('news', 'camps', 'gallery') AND public.is_admin());

-- Удаление — только админ
DROP POLICY IF EXISTS "media admin delete" ON storage.objects;
CREATE POLICY "media admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('news', 'camps', 'gallery') AND public.is_admin());

-- Просмотр — всем (бакеты публичные)
DROP POLICY IF EXISTS "media public read" ON storage.objects;
CREATE POLICY "media public read" ON storage.objects FOR SELECT TO public
  USING (bucket_id IN ('news', 'camps', 'gallery'));

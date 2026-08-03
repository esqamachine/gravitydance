-- ============================================================
-- Миграция 007: аватары профилей (колонка + Storage bucket + политики)
-- Выполнить в Supabase → SQL Editor. Идемпотентна.
-- ============================================================

-- 1. Колонка avatar_url в profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Bucket для аватаров (публичный на чтение). Можно также создать вручную:
--    Supabase Dashboard → Storage → New bucket → name: avatars, Public: true
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Политики Storage: пользователь работает только со своей папкой {auth.uid()}/...
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- 4. Политика на обновление avatar_url в profiles.
--    ВНИМАНИЕ: в этой схеме profiles.id НЕ равен auth.uid() (сопоставление по
--    email). Политика self-update по email уже есть в 006_mobile_rls.sql
--    («own profile update»), она покрывает и avatar_url. Ниже — вариант из ТЗ
--    для случая, если profiles.id == auth.uid(); при несовпадении он не сработает,
--    поэтому оставляем рабочей политику из 006.
-- DROP POLICY IF EXISTS "Users can update own avatar_url" ON profiles;
-- CREATE POLICY "Users can update own avatar_url" ON profiles
--   FOR UPDATE TO authenticated
--   USING (id = auth.uid()) WITH CHECK (id = auth.uid());

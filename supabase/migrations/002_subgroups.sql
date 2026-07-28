-- ============================================================
-- Миграция 002: подгруппы (subgroups)
-- Выполнить в Supabase → SQL Editor (после 001_init.sql).
-- Идемпотентна: можно запускать повторно.
-- ============================================================

-- 1. Таблица подгрупп
CREATE TABLE IF NOT EXISTS subgroups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Привязка подгруппы к записи клиента в группе и к занятию
ALTER TABLE client_groups
  ADD COLUMN IF NOT EXISTS subgroup_id UUID REFERENCES subgroups(id) ON DELETE SET NULL;

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS subgroup_id UUID REFERENCES subgroups(id) ON DELETE SET NULL;

-- 3. Заполнить подгруппы (только если таблица ещё пуста)
INSERT INTO subgroups (group_id, name)
SELECT g.id, sub
FROM groups g,
  unnest(
    CASE g.name
      WHEN 'Малыши' THEN ARRAY['Малыши', 'Дошколята']
      WHEN 'Продолжающие' THEN ARRAY['Концертная', 'Развитие', 'Арт']
      WHEN 'Начинающие' THEN ARRAY['Старт']
      WHEN 'ПРО' THEN ARRAY['ПРО']
      WHEN 'ПРО МАКС' THEN ARRAY['ПРО МАКС']
      ELSE ARRAY[g.name] -- Растяжка, Индивидуальные → подгруппа с тем же именем
    END
  ) AS sub
WHERE NOT EXISTS (SELECT 1 FROM subgroups);

-- 4. Хелпер: является ли текущий пользователь админом
--    SECURITY DEFINER — чтобы обойти RLS таблицы profiles внутри политики.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.role = 'admin'
      AND (
        p.email = auth.email()
        OR p.phone = regexp_replace(coalesce(auth.jwt() ->> 'phone', ''), '\D', '', 'g')
      )
  );
$$;

-- 5. RLS для subgroups: читать могут все, писать — только admin
ALTER TABLE subgroups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subgroups read all" ON subgroups;
CREATE POLICY "subgroups read all" ON subgroups FOR SELECT USING (true);

DROP POLICY IF EXISTS "subgroups admin write" ON subgroups;
CREATE POLICY "subgroups admin write" ON subgroups FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 6. Добавить админа во все группы и назначить первую подгруппу каждой группы
INSERT INTO client_groups (profile_id, group_id)
SELECT '66f20c3b-c1e5-4721-98d6-691eb1750c37', id
FROM groups
ON CONFLICT (profile_id, group_id) DO NOTHING;

UPDATE client_groups cg
SET subgroup_id = (
  SELECT s.id FROM subgroups s
  WHERE s.group_id = cg.group_id
  ORDER BY s.created_at ASC
  LIMIT 1
)
WHERE cg.profile_id = '66f20c3b-c1e5-4721-98d6-691eb1750c37';

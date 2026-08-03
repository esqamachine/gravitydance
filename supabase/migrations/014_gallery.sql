-- ============================================================
-- Миграция 014: Галерея (таблица + публичное чтение)
-- Выполнить после 002 (нужен public.is_admin()).
-- Идемпотентна.
-- ============================================================

CREATE TABLE IF NOT EXISTS gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gallery public read" ON gallery;
CREATE POLICY "gallery public read" ON gallery FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "gallery admin all" ON gallery;
CREATE POLICY "gallery admin all" ON gallery FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

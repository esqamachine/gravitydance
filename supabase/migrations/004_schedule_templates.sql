-- ============================================================
-- Миграция 004: Шаблоны расписания
-- Выполнить в Supabase → SQL Editor (после 001, 002).
-- day_of_week: 1=Понедельник … 7=Воскресенье.
-- Идемпотентна.
-- ============================================================

CREATE TABLE IF NOT EXISTS schedule_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  subgroup_id UUID REFERENCES subgroups(id) ON DELETE SET NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  coach TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE schedule_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "templates_admin" ON schedule_templates;
CREATE POLICY "templates_admin" ON schedule_templates FOR ALL USING (is_admin());

-- ============================================================
-- Миграция 017: шаблоны расписания — календарная модель (по датам)
-- Выполнить в Supabase → SQL Editor (после 002).
-- Идемпотентна.
--
-- ВАЖНО: таблица schedule_templates из миграции 004, судя по всему, НЕ была
-- создана (INSERT в неё падал → «шаблоны не сохранялись»). Эта миграция
-- создаёт её заново под новую модель: занятие привязано к конкретной ДАТЕ
-- (lesson_date), плюс есть зал (hall). Если таблица уже была старой схемы —
-- недостающие колонки добавятся, а day_of_week станет необязательным.
-- ============================================================

CREATE TABLE IF NOT EXISTS schedule_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  subgroup_id UUID REFERENCES subgroups(id) ON DELETE SET NULL,
  lesson_date DATE,
  day_of_week INTEGER,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  coach TEXT NOT NULL,
  hall TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- На случай, если таблица уже существовала старой схемы (миграция 004):
ALTER TABLE schedule_templates ADD COLUMN IF NOT EXISTS lesson_date DATE;
ALTER TABLE schedule_templates ADD COLUMN IF NOT EXISTS hall TEXT;
ALTER TABLE schedule_templates ALTER COLUMN day_of_week DROP NOT NULL;

ALTER TABLE schedule_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "templates_admin" ON schedule_templates;
CREATE POLICY "templates_admin" ON schedule_templates FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

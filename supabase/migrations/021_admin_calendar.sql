-- ============================================================
-- Миграция 021: персональный календарь администратора
-- Выполнить в Supabase → SQL Editor. Идемпотентна в части политики/индексов.
-- ============================================================

CREATE TABLE IF NOT EXISTS admin_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  category TEXT DEFAULT 'default',
  color TEXT DEFAULT '#EC4899',
  recurrence TEXT DEFAULT 'none',
  reminder TEXT DEFAULT 'none',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE admin_calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage own calendar events" ON admin_calendar_events;
CREATE POLICY "Admins can manage own calendar events"
  ON admin_calendar_events FOR ALL
  USING (admin_id IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (admin_id IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_admin_calendar_admin_id ON admin_calendar_events(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_calendar_start_time ON admin_calendar_events(start_time);

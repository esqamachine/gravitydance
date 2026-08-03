-- ============================================================
-- Миграция 008: чат (комнаты + сообщения + Realtime)
-- Выполнить в Supabase → SQL Editor. Идемпотентна.
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  sender_name TEXT NOT NULL,
  sender_role TEXT DEFAULT 'client',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_group ON chat_rooms(group_name);

ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read chat_rooms" ON chat_rooms;
CREATE POLICY "Authenticated can read chat_rooms" ON chat_rooms
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can read messages" ON messages;
CREATE POLICY "Authenticated can read messages" ON messages
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can insert messages" ON messages;
CREATE POLICY "Authenticated can insert messages" ON messages
  FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

-- Добавить messages в публикацию Realtime (без ошибки при повторном запуске)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO chat_rooms (group_name) VALUES
  ('Малыши'), ('Начинающие'), ('Продолжающие'),
  ('ПРО'), ('ПРО МАКС'), ('Растяжка'), ('Индивидуальные')
ON CONFLICT (group_name) DO NOTHING;

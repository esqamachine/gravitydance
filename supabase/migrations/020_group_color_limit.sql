-- ============================================================
-- Миграция 020: цвет группы + лимит участников 20 → 50
-- Выполнить в Supabase → SQL Editor (после 001). Идемпотентна.
--
-- • color — произвольный HEX-цвет группы (акцент в админке/расписании).
--   Если NULL — цвет берётся из палитры по имени (lib/db.groupColor).
-- • max_students по умолчанию теперь 50; существующие группы с лимитом 20
--   (значение по умолчанию из 001) поднимаются до 50.
-- ============================================================

ALTER TABLE groups ADD COLUMN IF NOT EXISTS color TEXT;

ALTER TABLE groups ALTER COLUMN max_students SET DEFAULT 50;

UPDATE groups
SET max_students = 50
WHERE max_students IS NULL OR max_students = 20;

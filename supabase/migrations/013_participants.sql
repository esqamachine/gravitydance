-- ============================================================
-- Миграция 013: участник группы (родитель или ребёнок) + посещения детей
-- Выполнить после 012.
-- Идемпотентна.
-- ============================================================

-- В группе может быть либо сам клиент (child_id IS NULL), либо его ребёнок.
ALTER TABLE client_groups
  ADD COLUMN IF NOT EXISTS child_id UUID REFERENCES children(id) ON DELETE CASCADE;

-- Старое ограничение UNIQUE(profile_id, group_id) мешало добавить в одну группу
-- и родителя, и ребёнка (одинаковый profile_id). Снимаем и заменяем на
-- уникальность с учётом ребёнка (NULL-child = сам родитель).
ALTER TABLE client_groups
  DROP CONSTRAINT IF EXISTS client_groups_profile_id_group_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_client_group_participant
  ON client_groups (profile_id, group_id, COALESCE(child_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Посещения (таблица есть с 001): добавляем ребёнка.
-- Если отмечен ребёнок — child_id заполнен, profile_id указывает на родителя.
ALTER TABLE attendance
  ADD COLUMN IF NOT EXISTS child_id UUID REFERENCES children(id) ON DELETE CASCADE;

ALTER TABLE attendance
  DROP CONSTRAINT IF EXISTS attendance_lesson_id_profile_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_attendance_participant
  ON attendance (lesson_id, profile_id, COALESCE(child_id, '00000000-0000-0000-0000-000000000000'::uuid));

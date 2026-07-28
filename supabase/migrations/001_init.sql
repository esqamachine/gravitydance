-- Профили клиентов
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  patronymic TEXT,
  role TEXT DEFAULT 'client' CHECK (role IN ('client', 'admin', 'coach')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Группы
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age_range TEXT,
  schedule TEXT,
  duration TEXT,
  max_students INT DEFAULT 20,
  is_active BOOLEAN DEFAULT true
);

-- Привязка клиентов к группам (один клиент может быть в нескольких группах)
CREATE TABLE client_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, group_id)
);

-- Расписание занятий
CREATE TABLE schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  coach_name TEXT
);

-- Занятия (конкретные даты)
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  coach_name TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Посещения
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late')),
  marked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lesson_id, profile_id)
);

-- Платежи
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method TEXT,
  external_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Включить RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Политики: группы и расписание видны всем
CREATE POLICY "Groups visible to all" ON groups FOR SELECT USING (true);
CREATE POLICY "Schedule visible to all" ON schedule FOR SELECT USING (true);
CREATE POLICY "Lessons visible to all" ON lessons FOR SELECT USING (true);

-- Заполнить группы начальными данными
INSERT INTO groups (name, age_range, schedule, duration) VALUES
  ('Малыши', '3–5 лет', '2 тренировки в неделю', '45 минут'),
  ('Начинающие', 'дети', '2 тренировки в неделю', '60 минут'),
  ('Продолжающие', 'дети', '2–3 тренировки в неделю', '60 минут'),
  ('ПРО', 'дети', '2–3 тренировки в неделю', '60–90 минут'),
  ('ПРО МАКС', 'взрослые', '1–3 тренировки в неделю', '60 минут'),
  ('Растяжка', 'дети и взрослые', '2 тренировки в неделю', '60 минут'),
  ('Индивидуальные', 'все возрасты', 'по договорённости', '60 минут');

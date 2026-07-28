-- ============================================================
-- Миграция 003: Новости и Сборы
-- Выполнить в Supabase → SQL Editor (после 001 и 002).
-- Требует функцию is_admin() из миграции 002.
-- Идемпотентна.
-- ============================================================

-- Новости
CREATE TABLE IF NOT EXISTS news (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Сборы
CREATE TABLE IF NOT EXISTS camps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  date_start DATE,
  date_end DATE,
  price INTEGER,
  image_url TEXT,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE camps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "news_read" ON news;
CREATE POLICY "news_read" ON news FOR SELECT USING (published = true);
DROP POLICY IF EXISTS "news_admin" ON news;
CREATE POLICY "news_admin" ON news FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "camps_read" ON camps;
CREATE POLICY "camps_read" ON camps FOR SELECT USING (published = true);
DROP POLICY IF EXISTS "camps_admin" ON camps;
CREATE POLICY "camps_admin" ON camps FOR ALL USING (is_admin());

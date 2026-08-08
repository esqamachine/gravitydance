-- ============================================================
-- Миграция 023: доступ администратора для мобильной админки
-- Выполнить в Supabase → SQL Editor (после 006/012/013/020). Идемпотентна.
--
-- Зачем: на сайте админка ходит через service_role и обходит RLS. В приложении
-- service_role держать нельзя, поэтому даём администратору (public.is_admin(),
-- сопоставление по email/телефону из JWT) полный доступ к таблицам, которые
-- редактирует админка. У news/camps/gallery/children/subgroups/schedule_templates
-- политика admin-all уже есть (миграции 003/012/014/002/016) — здесь добавляем
-- недостающие: profiles, client_groups, payments, groups, lessons, attendance.
--
-- Политики складываются по ИЛИ с уже существующими self-политиками (006):
-- обычный клиент по-прежнему видит только своё, админ — всё.
-- ============================================================

-- Профили: админ видит и правит всех.
DROP POLICY IF EXISTS "profiles admin all" ON profiles;
CREATE POLICY "profiles admin all" ON profiles FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Записи в группы.
ALTER TABLE client_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "client_groups admin all" ON client_groups;
CREATE POLICY "client_groups admin all" ON client_groups FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Платежи.
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payments admin all" ON payments;
CREATE POLICY "payments admin all" ON payments FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Группы (создание/редактирование/удаление). Публичное чтение уже есть.
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "groups admin all" ON groups;
CREATE POLICY "groups admin all" ON groups FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Разовые занятия.
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lessons admin all" ON lessons;
CREATE POLICY "lessons admin all" ON lessons FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Недельное расписание (таблица schedule).
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "schedule admin all" ON schedule;
CREATE POLICY "schedule admin all" ON schedule FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Посещаемость.
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "attendance admin all" ON attendance;
CREATE POLICY "attendance admin all" ON attendance FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

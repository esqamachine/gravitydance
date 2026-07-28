-- Коды подтверждения для SMS-авторизации (провайдер SMS.ru).
-- Код живёт 5 минут, одноразовый. Доступ — только через service_role
-- (RLS включён, публичных политик нет).

CREATE TABLE IF NOT EXISTS phone_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '5 minutes'),
  used BOOLEAN DEFAULT false
);

CREATE INDEX idx_phone_codes_phone ON phone_codes(phone);

ALTER TABLE phone_codes ENABLE ROW LEVEL SECURITY;

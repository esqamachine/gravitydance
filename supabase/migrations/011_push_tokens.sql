-- 011: Expo push-токены для мобильных уведомлений.
-- Токен получаем на устройстве (registerForPushNotifications) и сохраняем в профиль.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;

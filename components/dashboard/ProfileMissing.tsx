import { UserX } from "lucide-react";

export default function ProfileMissing({
  contact,
}: {
  contact: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[1.75rem] border border-white/10 bg-card p-10 text-center">
      <UserX size={48} className="text-primary" />
      <h2 className="font-heading text-xl font-bold text-ink">
        Профиль не найден
      </h2>
      <p className="max-w-md font-body text-muted">
        Вы вошли как <span className="text-ink">{contact}</span>, но профиль
        клиента ещё не создан. Обратитесь к администратору студии, чтобы вас
        добавили в систему.
      </p>
    </div>
  );
}

import { Phone, Mail, User, Users } from "lucide-react";
import { getSession } from "@/lib/account";
import { getProfileGroups, getProfileChildren } from "@/lib/queries";
import { fullName } from "@/lib/db";
import ProfileMissing from "@/components/dashboard/ProfileMissing";
import ChildrenManager from "@/components/dashboard/ChildrenManager";
import BirthDateEditor from "@/components/dashboard/BirthDateEditor";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getSession();
  const profile = session?.profile;

  if (!profile) {
    return (
      <ProfileMissing
        contact={session?.email || session?.phone || "неизвестно"}
      />
    );
  }

  const [groups, children] = await Promise.all([
    getProfileGroups(profile.id),
    getProfileChildren(profile.id),
  ]);

  const rows = [
    { icon: User, label: "ФИО", value: fullName(profile) },
    { icon: Phone, label: "Телефон", value: profile.phone },
    { icon: Mail, label: "Email", value: profile.email || "—" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
        Мой <span className="text-gradient">профиль</span>
      </h1>

      <div className="rounded-[1.75rem] border border-white/10 bg-card p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-gradient font-heading text-2xl font-bold text-white">
            {profile.first_name.charAt(0)}
          </div>
          <div>
            <p className="font-heading text-xl font-bold text-ink">
              {fullName(profile)}
            </p>
            <p className="font-body text-sm capitalize text-muted">
              {profile.role === "admin"
                ? "Администратор"
                : profile.role === "coach"
                  ? "Тренер"
                  : "Клиент"}
            </p>
          </div>
        </div>

        <dl className="mt-6 divide-y divide-white/10">
          {rows.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.label} className="flex items-center gap-4 py-4">
                <Icon size={18} className="shrink-0 text-primary" />
                <dt className="w-28 shrink-0 font-body text-sm text-muted">
                  {r.label}
                </dt>
                <dd className="font-body text-ink">{r.value}</dd>
              </div>
            );
          })}
          <BirthDateEditor value={profile.birth_date} />
        </dl>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-card p-6 sm:p-8">
        <div className="flex items-center gap-2 font-heading text-lg font-bold text-ink">
          <Users size={20} className="text-primary" /> Мои группы
        </div>
        {groups.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {groups.map((g) => (
              <span
                key={g.cg_id}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-body text-sm text-primary-light"
              >
                {g.group_name}
                {g.subgroup_name && (
                  <span className="text-ink"> → {g.subgroup_name}</span>
                )}
                {g.participant_name && (
                  <span className="text-muted"> · {g.participant_name}</span>
                )}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-4 font-body text-sm text-muted">
            Вы пока не записаны ни в одну группу.
          </p>
        )}

        <ChildrenManager children={children} />
      </div>
    </div>
  );
}

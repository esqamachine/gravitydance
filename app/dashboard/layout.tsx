import { requireSession } from "@/lib/account";
import { fullName } from "@/lib/db";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const name = session.profile
    ? fullName(session.profile)
    : session.email || session.phone || "Гость";

  const role = session.profile?.role;
  const staffHref =
    role === "admin" ? "/admin" : role === "coach" ? "/admin/groups" : null;
  const staffLabel = role === "coach" ? "Кабинет тренера" : "Админ-панель";

  return (
    <DashboardShell name={name} staffHref={staffHref} staffLabel={staffLabel}>
      {children}
    </DashboardShell>
  );
}

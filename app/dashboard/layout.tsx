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

  return (
    <DashboardShell name={name} isAdmin={session.profile?.role === "admin"}>
      {children}
    </DashboardShell>
  );
}

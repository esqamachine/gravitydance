import { requireStaff } from "@/lib/account";
import { fullName, type Role } from "@/lib/db";
import AdminShell from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireStaff();
  const role: Role = session.profile?.role ?? "admin";
  const name = session.profile
    ? fullName(session.profile)
    : session.email || "Админ";

  return (
    <AdminShell name={name} role={role}>
      {children}
    </AdminShell>
  );
}

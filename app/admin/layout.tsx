import { requireAdmin } from "@/lib/account";
import { fullName } from "@/lib/db";
import AdminShell from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();
  const name = session.profile
    ? fullName(session.profile)
    : session.email || "Админ";

  return <AdminShell name={name}>{children}</AdminShell>;
}

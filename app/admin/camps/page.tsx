import { getAllCamps } from "@/lib/queries";
import CampsAdmin from "@/components/admin/CampsAdmin";
import { requireAdmin } from "@/lib/account";

export const dynamic = "force-dynamic";

export default async function AdminCampsPage() {
  await requireAdmin();
  const camps = await getAllCamps();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
          <span className="text-gradient">Сборы</span>
        </h1>
        <span className="font-body text-sm text-muted">
          Всего: {camps.length}
        </span>
      </div>
      <CampsAdmin camps={camps} />
    </div>
  );
}

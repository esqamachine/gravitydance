import { getAllPayments } from "@/lib/queries";
import { formatMoney } from "@/lib/db";
import PaymentsList from "@/components/admin/PaymentsList";
import { requireAdmin } from "@/lib/account";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  await requireAdmin();
  const payments = await getAllPayments();
  const paidSum = payments
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
          <span className="text-gradient">Платежи</span>
        </h1>
        <span className="font-body text-sm text-muted">
          Оплачено всего:{" "}
          <span className="font-semibold text-ink">{formatMoney(paidSum)}</span>
        </span>
      </div>
      <PaymentsList payments={payments} />
    </div>
  );
}

import { getSession } from "@/lib/account";
import { getProfilePayments } from "@/lib/queries";
import { formatMoney, formatDate, PAYMENT_STATUS_RU } from "@/lib/db";
import ProfileMissing from "@/components/dashboard/ProfileMissing";
import PaymentCard from "@/components/dashboard/PaymentCard";

export const dynamic = "force-dynamic";

const statusStyle: Record<string, string> = {
  paid: "bg-green-500/15 text-green-400",
  pending: "bg-yellow-500/15 text-yellow-400",
  failed: "bg-pink/15 text-pink",
  refunded: "bg-white/10 text-muted",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full px-3 py-1 font-body text-xs font-medium ${statusStyle[status]}`}
    >
      {PAYMENT_STATUS_RU[status as keyof typeof PAYMENT_STATUS_RU]}
    </span>
  );
}

export default async function PaymentsPage() {
  const session = await getSession();
  const profile = session?.profile;

  if (!profile) {
    return (
      <ProfileMissing
        contact={session?.email || session?.phone || "неизвестно"}
      />
    );
  }

  const payments = await getProfilePayments(profile.id);

  return (
    <div className="space-y-8">
      {/* Блок А — оплата */}
      <PaymentCard />

      {/* Блок Б — история платежей */}
      <section>
        <h2 className="mb-4 font-heading text-lg font-bold text-ink">
          История платежей
        </h2>

        {payments.length === 0 ? (
          <div className="rounded-[1.75rem] border border-white/10 bg-card p-10 text-center font-body text-muted">
            Платежей пока нет
          </div>
        ) : (
          <>
            {/* Мобильные — карточки */}
            <ul className="space-y-3 sm:hidden">
              {payments.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-card p-4"
                >
                  <div className="min-w-0">
                    <p className="font-heading font-bold text-ink">
                      {formatMoney(p.amount)}
                    </p>
                    <p className="mt-0.5 font-body text-sm text-muted">
                      {p.description || "Абонемент"}
                    </p>
                    <p className="mt-0.5 font-body text-xs text-muted">
                      {formatDate(p.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={p.status} />
                </li>
              ))}
            </ul>

            {/* Десктоп — таблица */}
            <div className="hidden overflow-hidden rounded-[1.75rem] border border-white/10 bg-card sm:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-5 py-3.5 font-body text-xs font-medium uppercase tracking-wide text-muted">
                      Дата
                    </th>
                    <th className="px-5 py-3.5 font-body text-xs font-medium uppercase tracking-wide text-muted">
                      Описание
                    </th>
                    <th className="px-5 py-3.5 font-body text-xs font-medium uppercase tracking-wide text-muted">
                      Сумма
                    </th>
                    <th className="px-5 py-3.5 text-right font-body text-xs font-medium uppercase tracking-wide text-muted">
                      Статус
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {payments.map((p) => (
                    <tr key={p.id} className="transition hover:bg-white/[0.02]">
                      <td className="whitespace-nowrap px-5 py-4 font-body text-sm text-muted">
                        {formatDate(p.created_at)}
                      </td>
                      <td className="px-5 py-4 font-body text-sm text-ink/85">
                        {p.description || "Абонемент"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-heading text-sm font-bold text-ink">
                        {formatMoney(p.amount)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

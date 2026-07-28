import { requisites } from "@/lib/legal";

/** Реквизиты ИП.
 *  compact — вариант внутри текста документа (п. 9.3 политики, раздел 10 оферты).
 *  Полный вариант — отдельный таб на /policy. */
export default function Requisites({ compact = false }: { compact?: boolean }) {
  const rows = (
    <dl className="divide-y divide-white/5">
      {requisites.map((r) => (
        <div
          key={r.label}
          className="flex flex-col gap-0.5 py-3 sm:flex-row sm:gap-4 sm:py-3.5"
        >
          <dt className="shrink-0 font-body text-xs uppercase tracking-wide text-muted sm:w-48 sm:text-sm sm:normal-case sm:tracking-normal">
            {r.label}
          </dt>
          <dd className="min-w-0 flex-1 font-body text-sm font-semibold text-ink sm:text-[15px]">
            {r.href ? (
              <a
                href={r.href}
                className="transition hover:text-primary-light"
              >
                {r.value}
              </a>
            ) : (
              r.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );

  if (compact) {
    return (
      <div className="rounded-2xl border border-white/10 bg-surface/60 px-4 py-1 sm:px-5">
        {rows}
      </div>
    );
  }

  return (
    <article className="rounded-3xl border border-white/10 bg-card p-5 sm:p-8 lg:p-12">
      <header className="border-b border-white/10 pb-6 text-center">
        <h2 className="font-heading text-2xl font-extrabold uppercase tracking-wide sm:text-3xl">
          <span className="text-gradient">Реквизиты</span>
        </h2>
        {/* sm:text-[1rem] — см. комментарий в LegalDoc.tsx: `text-base` конфликтует
            с цветом `base` из палитры. */}
        <p className="mx-auto mt-3 max-w-2xl font-body text-sm text-muted sm:text-[1rem]">
          Официальные данные Исполнителя по Договору-оферте.
        </p>
      </header>

      <div className="mt-6 sm:mt-8">{rows}</div>

      <footer className="mt-8 border-t border-white/10 pt-6 text-center font-body text-xs leading-relaxed text-muted">
        © 2026 ИП Лисовская А.И. Все права защищены.
      </footer>
    </article>
  );
}

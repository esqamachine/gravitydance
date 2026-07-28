import { Download } from "lucide-react";
import type { LegalClause, LegalDocument } from "@/lib/legal";
import Requisites from "./Requisites";

function Clause({ clause, nested = false }: { clause: LegalClause; nested?: boolean }) {
  return (
    <li className="flex gap-2.5 sm:gap-3">
      {clause.n && (
        <span
          className={`shrink-0 font-body font-semibold tabular-nums ${
            nested ? "text-muted" : "text-primary"
          }`}
        >
          {clause.n}
        </span>
      )}
      <div className="min-w-0 flex-1 space-y-2.5">
        {clause.text && (
          <p>
            {clause.lead && (
              <strong className="font-semibold text-ink">{clause.lead} </strong>
            )}
            {clause.text}
          </p>
        )}

        {clause.list && (
          <ul className="space-y-2 pl-1">
            {clause.list.map((item, i) => (
              <li key={i} className="flex gap-2.5">
                <span aria-hidden className="shrink-0 text-primary">
                  —
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        {clause.sub && (
          <ul className="space-y-2.5 pl-1">
            {clause.sub.map((s) => (
              <Clause key={s.n} clause={s} nested />
            ))}
          </ul>
        )}

        {clause.requisites && (
          <div className="pt-1">
            <Requisites compact />
          </div>
        )}
      </div>
    </li>
  );
}

export default function LegalDoc({
  doc,
  pdfHref,
  pdfLabel,
}: {
  doc: LegalDocument;
  pdfHref: string;
  pdfLabel: string;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-card p-5 sm:p-8 lg:p-12">
      {/* Шапка документа */}
      <header className="border-b border-white/10 pb-6 text-center">
        <h2 className="font-heading text-2xl font-extrabold uppercase tracking-wide sm:text-3xl">
          <span className="text-gradient">{doc.title}</span>
        </h2>
        {/* sm:text-[1rem], а не sm:text-base: в конфиге есть цвет `base`, поэтому
            `text-base` — это ещё и утилита цвета (#070B1A). В медиазапросе она
            перебивает text-muted и красит текст в цвет фона. */}
        <p className="mx-auto mt-3 max-w-2xl font-body text-sm text-muted sm:text-[1rem]">
          {doc.subtitle}
        </p>
        <p className="mt-3 font-body text-xs text-muted/80 sm:text-sm">
          {doc.place}
          <span aria-hidden className="mx-2 text-primary/50">
            |
          </span>
          {doc.published}
        </p>

        <a
          href={pdfHref}
          download
          className="btn-ghost mt-6 inline-flex items-center gap-2 px-5 py-2.5 font-heading text-sm font-semibold"
        >
          <Download size={16} className="text-primary" />
          {pdfLabel}
        </a>
      </header>

      {/* Тело документа */}
      <div className="mt-8 font-body text-sm leading-relaxed text-ink/85 sm:text-[15px] sm:leading-[1.75]">
        {doc.preamble && (
          <p className="mb-8 border-l-2 border-primary/40 pl-4 italic text-ink/75">
            {doc.preamble}
          </p>
        )}

        <div className="space-y-8">
          {doc.sections.map((section) => (
            <section key={section.n}>
              <h3 className="flex items-baseline gap-2.5 font-heading text-base font-bold uppercase tracking-wide text-ink sm:text-lg">
                <span className="text-gradient">{section.n}.</span>
                {section.title}
              </h3>

              {section.intro && (
                <p className="mt-3 text-ink/75">{section.intro}</p>
              )}

              <ul className="mt-3 space-y-3">
                {section.clauses.map((clause, i) => (
                  <Clause key={clause.n ?? i} clause={clause} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>

      <footer className="mt-10 border-t border-white/10 pt-6 text-center font-body text-xs leading-relaxed text-muted">
        {doc.footer}
      </footer>
    </article>
  );
}

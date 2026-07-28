"use client";

import { useState } from "react";
import { Check, ChevronDown, Copy } from "lucide-react";
import { paymentRequisites, requisitesAsText } from "@/lib/payment";

/** Кнопка копирования: на 2 секунды превращается в «Скопировано ✓». */
function CopyButton({
  text,
  label,
  className = "",
}: {
  text: string;
  label: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setFailed(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Буфер обмена недоступен (не-HTTPS, отказ в правах) — не молчим об этом
      setFailed(true);
      setTimeout(() => setFailed(false), 3000);
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 font-heading text-sm font-semibold text-ink transition hover:border-primary/40 hover:bg-primary/10 ${className}`}
    >
      {copied ? (
        <>
          <Check size={15} className="text-green-400" />
          Скопировано
        </>
      ) : failed ? (
        "Скопируйте вручную"
      ) : (
        <>
          <Copy size={15} className="text-primary" />
          {label}
        </>
      )}
    </button>
  );
}

export default function PaymentCard() {
  const [openRequisites, setOpenRequisites] = useState(false);

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-card p-5 sm:p-8">
      <header className="text-center">
        <h2 className="font-heading text-2xl font-extrabold sm:text-3xl">
          <span className="text-gradient">Оплатить абонемент</span>
        </h2>
        <p className="mt-2 font-body text-sm text-muted sm:text-[15px]">
          Выберите удобный способ оплаты
        </p>
      </header>

      {/* QR-код */}
      <div className="mt-7 flex flex-col items-center">
        <div className="rounded-xl bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/payment-qr.jpg"
            alt="QR-код для оплаты абонемента"
            width={220}
            height={220}
            loading="eager"
            className="h-[180px] w-[180px] sm:h-[220px] sm:w-[220px]"
          />
        </div>
        <p className="mx-auto mt-4 max-w-sm text-center font-body text-xs leading-relaxed text-muted sm:text-sm">
          Отсканируйте QR-код в приложении вашего банка
        </p>
      </div>

      {/* Разделитель */}
      <div className="mt-8 h-px bg-white/10" />

      {/* Реквизиты — сворачиваемые */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-surface/60">
        <button
          type="button"
          onClick={() => setOpenRequisites((v) => !v)}
          aria-expanded={openRequisites}
          aria-controls="payment-requisites"
          className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left font-heading text-sm font-semibold text-ink transition hover:text-primary-light sm:px-5"
        >
          Реквизиты для перевода
          <ChevronDown
            size={18}
            className={`shrink-0 text-primary transition-transform duration-200 ${
              openRequisites ? "rotate-180" : ""
            }`}
          />
        </button>

        {openRequisites && (
          <div
            id="payment-requisites"
            className="animate-pop-in border-t border-white/10 px-4 pb-5 pt-4 sm:px-5"
          >
            <dl className="divide-y divide-white/5">
              {paymentRequisites.map((r) => (
                <div
                  key={r.label}
                  className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:gap-4"
                >
                  <dt className="shrink-0 font-body text-xs text-muted sm:w-40 sm:text-sm">
                    {r.label}
                  </dt>
                  <dd className="min-w-0 flex-1 break-all font-body text-sm font-semibold text-ink">
                    {r.value}
                  </dd>
                </div>
              ))}
            </dl>

            <CopyButton
              text={requisitesAsText}
              label="Скопировать реквизиты"
              className="mt-4 w-full sm:w-auto"
            />
          </div>
        )}
      </div>

      <p className="mt-6 font-body text-xs leading-relaxed text-muted sm:text-sm">
        После перевода отправьте скриншот оплаты тренеру. Статус обновится в
        течение 24 часов.
      </p>
    </section>
  );
}

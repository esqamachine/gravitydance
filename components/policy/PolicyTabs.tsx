"use client";

import { useState } from "react";
import { privacyPolicy, offerAgreement } from "@/lib/legal";
import LegalDoc from "./LegalDoc";
import Requisites from "./Requisites";

/* Имена файлов в /public/docs/ кириллические — кодируем для корректного href. */
const PRIVACY_PDF = encodeURI("/docs/политика-конфиденциальности.pdf");
const OFFER_PDF = encodeURI("/docs/договор-оферта.pdf");

const tabs = [
  { id: "privacy", label: "Политика конфиденциальности", short: "Политика" },
  { id: "offer", label: "Договор-оферта", short: "Оферта" },
  { id: "requisites", label: "Реквизиты", short: "Реквизиты" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function PolicyTabs() {
  const [active, setActive] = useState<TabId>("privacy");

  return (
    <div>
      {/* Табы — на мобильных горизонтальный скролл без скроллбара */}
      <div
        role="tablist"
        aria-label="Юридические документы"
        className="no-scrollbar touch-scroll-x -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:justify-center sm:px-0"
      >
        {tabs.map((tab) => {
          const selected = active === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActive(tab.id)}
              className={`shrink-0 whitespace-nowrap rounded-full px-5 py-3 font-heading text-sm font-semibold shadow-none transition ${
                selected
                  ? "bg-brand-gradient text-white"
                  : "border border-white/10 bg-white/5 text-muted hover:border-primary/40 hover:text-ink"
              }`}
            >
              <span className="sm:hidden">{tab.short}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Панели */}
      <div className="mt-8 sm:mt-10">
        {active === "privacy" && (
          <div role="tabpanel" id="panel-privacy" aria-labelledby="tab-privacy">
            <LegalDoc
              doc={privacyPolicy}
              pdfHref={PRIVACY_PDF}
              pdfLabel="Скачать PDF"
            />
          </div>
        )}

        {active === "offer" && (
          <div role="tabpanel" id="panel-offer" aria-labelledby="tab-offer">
            <LegalDoc
              doc={offerAgreement}
              pdfHref={OFFER_PDF}
              pdfLabel="Скачать PDF"
            />
          </div>
        )}

        {active === "requisites" && (
          <div
            role="tabpanel"
            id="panel-requisites"
            aria-labelledby="tab-requisites"
          >
            <Requisites />
          </div>
        )}
      </div>
    </div>
  );
}

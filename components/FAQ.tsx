"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { faq } from "@/lib/data";
import Reveal from "./Reveal";

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <h2 className="font-heading text-3xl font-bold text-ink sm:text-4xl md:text-5xl">
            Частые <span className="text-gradient">вопросы</span>
          </h2>
        </Reveal>

        <div className="mt-12 space-y-3">
          {faq.map((item, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={item.q} delay={i * 50}>
                <div
                  className={`overflow-hidden rounded-2xl border bg-card transition-colors ${
                    isOpen ? "border-primary/40" : "border-white/10"
                  }`}
                >
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="font-heading text-lg font-semibold text-ink">
                      {item.q}
                    </span>
                    <ChevronDown
                      size={22}
                      className={`shrink-0 text-primary transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      isOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-5 font-body leading-relaxed text-muted">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

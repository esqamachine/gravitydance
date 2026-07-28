import { MapPin, Phone, Send, Clock } from "lucide-react";
import { contacts } from "@/lib/data";
import Reveal from "./Reveal";

export default function Contacts() {
  return (
    <section id="contacts" className="relative py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <p className="font-heading text-sm font-semibold uppercase tracking-[0.25em] text-primary">
            На связи
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold text-ink sm:text-4xl md:text-5xl">
            <span className="text-gradient">Контакты</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          {/* Информация */}
          <Reveal className="space-y-5">
            <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-card p-6">
              <MapPin className="mt-0.5 shrink-0 text-primary" size={22} />
              <div>
                <p className="font-heading font-semibold text-ink">Адрес</p>
                <p className="mt-1 font-body text-muted">{contacts.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-card p-6">
              <Clock className="mt-0.5 shrink-0 text-primary" size={22} />
              <div>
                <p className="font-heading font-semibold text-ink">
                  Режим работы
                </p>
                <p className="mt-1 font-body text-muted">
                  {contacts.workingHours}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-card p-6">
              <Phone className="mt-0.5 shrink-0 text-primary" size={22} />
              <div>
                <p className="font-heading font-semibold text-ink">Телефон</p>
                <a
                  href={contacts.phoneHref}
                  className="mt-1 inline-block font-body text-lg font-semibold text-ink transition hover:text-primary-light"
                >
                  {contacts.phone}
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-card p-6">
              <p className="font-heading font-semibold text-ink">
                Мы в соцсетях
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={contacts.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[48px] items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 font-body text-base font-medium text-ink transition hover:border-primary/40 hover:bg-primary/10"
                >
                  <Send size={18} className="text-primary" />
                  Telegram
                </a>
                <a
                  href={contacts.vk}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[48px] items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 font-body text-base font-medium text-ink transition hover:border-primary/40 hover:bg-primary/10"
                >
                  <span className="font-heading font-bold text-primary">VK</span>
                  ВКонтакте
                </a>
              </div>
            </div>
          </Reveal>

          {/* Карта (плейсхолдер src — заменить на реальную Яндекс.Карту) */}
          <Reveal delay={120}>
            <div className="h-full overflow-hidden rounded-[1.75rem] border border-white/10 bg-card">
              <iframe
                src={contacts.mapSrc}
                title="Карта — Студия танца Гравитация, Пушкино"
                className="h-80 w-full border-0 opacity-90 lg:h-full"
                loading="lazy"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

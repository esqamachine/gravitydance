import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, CalendarDays, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import Photo from "@/components/Photo";
import { getPublishedCamps } from "@/lib/queries";
import { formatDate, formatMoney } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Сборы — Студия танца Гравитация",
  description:
    "Спортивно-танцевальные сборы студии «Гравитация»: тренировки, отдых и подготовка к конкурсам.",
};

export default async function CampsPage() {
  const camps = await getPublishedCamps();

  return (
    <>
      <Header />
      <main className="pt-16 md:pt-20">
        <section className="relative py-12 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal className="text-center">
              <h1 className="font-heading text-4xl font-extrabold sm:text-5xl md:text-6xl">
                <span className="text-gradient">Сборы</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl font-body text-base text-muted sm:text-lg">
                Спортивно-танцевальные сборы на море и в Подмосковье.
              </p>
            </Reveal>

            {camps.length === 0 ? (
              <div className="mt-12 rounded-[1.75rem] border border-white/10 bg-card p-10 text-center font-body text-muted">
                Сборов пока нет.
              </div>
            ) : (
              <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {camps.map((c, i) => (
                  <Reveal key={c.id} delay={(i % 3) * 100}>
                    <Link
                      href={`/camps/${c.slug}`}
                      className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-card transition duration-300 hover:-translate-y-1 hover:border-primary/40"
                    >
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-primary/25 via-violet/20 to-pink/20">
                        {c.image_url && (
                          <Photo
                            src={c.image_url}
                            alt={c.title}
                            sizes="(max-width:640px) 100vw, 33vw"
                            className="transition-transform duration-500 group-hover:scale-105"
                          />
                        )}
                      </div>
                      <div className="flex flex-1 flex-col p-6">
                        <h2 className="font-heading text-xl font-bold text-ink">
                          {c.title}
                        </h2>
                        {c.date_start && (
                          <p className="mt-2 flex items-center gap-1.5 font-body text-sm text-primary">
                            <CalendarDays size={15} />
                            {formatDate(c.date_start)}
                            {c.date_end ? ` – ${formatDate(c.date_end)}` : ""}
                          </p>
                        )}
                        {c.location && (
                          <p className="mt-1 flex items-center gap-1.5 font-body text-sm text-muted">
                            <MapPin size={15} /> {c.location}
                          </p>
                        )}
                        <div className="mt-4 flex items-center justify-between">
                          {c.price != null ? (
                            <span className="font-heading font-bold text-ink">
                              {formatMoney(c.price)}
                            </span>
                          ) : (
                            <span />
                          )}
                          <span className="inline-flex items-center gap-1.5 font-heading text-sm font-semibold text-primary-light transition group-hover:text-primary">
                            Подробнее <ArrowRight size={15} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

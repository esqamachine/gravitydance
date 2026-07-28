import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, CalendarDays, Wallet } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Photo from "@/components/Photo";
import { getCampBySlug } from "@/lib/queries";
import { formatDate, formatMoney } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCampBySlug(slug);
  if (!c) return { title: "Сборы — Гравитация" };
  return {
    title: `${c.title} — Студия танца Гравитация`,
    description: c.description.slice(0, 160),
  };
}

export default async function CampPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = await getCampBySlug(slug);
  if (!c) notFound();

  return (
    <>
      <Header />
      <main className="pt-16 md:pt-20">
        <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16">
          <Link
            href="/camps"
            className="inline-flex items-center gap-2 font-body text-sm text-muted transition hover:text-ink"
          >
            <ArrowLeft size={16} /> Назад к сборам
          </Link>

          <h1 className="mt-6 font-heading text-3xl font-extrabold text-ink sm:text-4xl md:text-5xl">
            {c.title}
          </h1>

          {c.image_url && (
            <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-primary/25 via-violet/20 to-pink/20">
              <Photo src={c.image_url} alt={c.title} sizes="(max-width:768px) 100vw, 768px" priority />
            </div>
          )}

          {/* Мета-инфо */}
          <div className="mt-8 flex flex-wrap gap-3">
            {c.date_start && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-card px-4 py-2 font-body text-sm text-ink">
                <CalendarDays size={16} className="text-primary" />
                {formatDate(c.date_start)}
                {c.date_end ? ` – ${formatDate(c.date_end)}` : ""}
              </span>
            )}
            {c.location && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-card px-4 py-2 font-body text-sm text-ink">
                <MapPin size={16} className="text-primary" /> {c.location}
              </span>
            )}
            {c.price != null && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-card px-4 py-2 font-body text-sm text-ink">
                <Wallet size={16} className="text-primary" /> {formatMoney(c.price)}
              </span>
            )}
          </div>

          <div className="mt-8 whitespace-pre-line font-body text-lg leading-relaxed text-ink/90">
            {c.description}
          </div>

          <div className="mt-10">
            <Link
              href="/#signup"
              className="btn-cta inline-block px-8 py-4 font-heading font-bold"
            >
              Записаться →
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}

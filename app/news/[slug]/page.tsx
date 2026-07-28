import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Photo from "@/components/Photo";
import { getNewsBySlug } from "@/lib/queries";
import { formatDate } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const n = await getNewsBySlug(slug);
  if (!n) return { title: "Новость — Гравитация" };
  return {
    title: `${n.title} — Студия танца Гравитация`,
    description: n.excerpt ?? undefined,
  };
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const n = await getNewsBySlug(slug);
  if (!n) notFound();

  return (
    <>
      <Header />
      <main className="pt-16 md:pt-20">
        <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 font-body text-sm text-muted transition hover:text-ink"
          >
            <ArrowLeft size={16} /> Назад к новостям
          </Link>

          <time className="mt-6 block font-body text-sm text-primary">
            {formatDate(n.published_at ?? n.created_at)}
          </time>
          <h1 className="mt-2 font-heading text-3xl font-extrabold text-ink sm:text-4xl md:text-5xl">
            {n.title}
          </h1>

          {n.image_url && (
            <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-primary/25 via-violet/20 to-pink/20">
              <Photo src={n.image_url} alt={n.title} sizes="(max-width:768px) 100vw, 768px" priority />
            </div>
          )}

          <div className="mt-8 whitespace-pre-line font-body text-lg leading-relaxed text-ink/90">
            {n.content}
          </div>

          <div className="mt-10">
            <Link
              href="/news"
              className="btn-ghost inline-flex items-center gap-2 px-6 py-3 font-heading text-sm font-semibold"
            >
              <ArrowLeft size={16} /> Все новости
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}

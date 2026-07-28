import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import Photo from "@/components/Photo";
import { getPublishedNews } from "@/lib/queries";
import { formatDate } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Новости — Студия танца Гравитация",
  description:
    "Новости студии танца «Гравитация»: конкурсы, выступления, сборы и события.",
};

export default async function NewsPage() {
  const news = await getPublishedNews();

  return (
    <>
      <Header />
      <main className="pt-16 md:pt-20">
        <section className="relative py-12 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal className="text-center">
              <h1 className="font-heading text-4xl font-extrabold sm:text-5xl md:text-6xl">
                <span className="text-gradient">Новости</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl font-body text-base text-muted sm:text-lg">
                Следите за жизнью студии: конкурсы, выступления и события.
              </p>
            </Reveal>

            {news.length === 0 ? (
              <div className="mt-12 rounded-[1.75rem] border border-white/10 bg-card p-10 text-center font-body text-muted">
                Новостей пока нет.
              </div>
            ) : (
              <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {news.map((n, i) => (
                  <Reveal key={n.id} delay={(i % 3) * 100}>
                    <Link
                      href={`/news/${n.slug}`}
                      className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-card transition duration-300 hover:-translate-y-1 hover:border-primary/40"
                    >
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-primary/25 via-violet/20 to-pink/20">
                        {n.image_url && (
                          <Photo
                            src={n.image_url}
                            alt={n.title}
                            sizes="(max-width:640px) 100vw, 33vw"
                            className="transition-transform duration-500 group-hover:scale-105"
                          />
                        )}
                      </div>
                      <div className="flex flex-1 flex-col p-6">
                        <time className="font-body text-sm text-primary">
                          {formatDate(n.published_at ?? n.created_at)}
                        </time>
                        <h2 className="mt-2 font-heading text-xl font-bold text-ink">
                          {n.title}
                        </h2>
                        {n.excerpt && (
                          <p className="mt-3 line-clamp-3 flex-1 font-body text-muted">
                            {n.excerpt}
                          </p>
                        )}
                        <span className="mt-4 inline-flex items-center gap-1.5 font-heading text-sm font-semibold text-primary-light transition group-hover:text-primary">
                          Читать <ArrowRight size={15} />
                        </span>
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

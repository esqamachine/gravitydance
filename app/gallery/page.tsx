import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import GalleryFull from "@/components/GalleryFull";

export const metadata: Metadata = {
  title: "Галерея — Студия танца Гравитация",
  description:
    "Фотогалерея студии танца «Гравитация»: сборы, конкурсы, выступления и яркие моменты наших учеников.",
};

export default function GalleryPage() {
  return (
    <>
      <Header />
      <main className="pt-16 md:pt-20">
        <section className="relative py-12 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal className="text-center">
              <h1 className="font-heading text-4xl font-extrabold sm:text-5xl md:text-6xl">
                <span className="text-gradient">Галерея</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl font-body text-base text-muted sm:text-lg">
                Сборы, конкурсы, выступления и яркие моменты нашей студии.
              </p>
            </Reveal>

            <div className="mt-12">
              <GalleryFull />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

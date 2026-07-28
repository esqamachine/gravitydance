import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import PolicyTabs from "@/components/policy/PolicyTabs";

export const metadata: Metadata = {
  title: "Политика и документы — Студия танца Гравитация",
  description:
    "Политика конфиденциальности, договор-оферта и реквизиты студии современного танца «Гравитация» в Пушкино.",
};

export default function PolicyPage() {
  return (
    <>
      <Header />
      <main className="pt-16 md:pt-20">
        <section className="relative py-12 md:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <Reveal className="text-center">
              <h1 className="font-heading text-4xl font-extrabold sm:text-5xl">
                <span className="text-gradient">Документы</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl font-body text-base text-muted sm:text-lg">
                Политика конфиденциальности, договор-оферта и реквизиты студии.
              </p>
            </Reveal>

            <div className="mt-10 sm:mt-12">
              <PolicyTabs />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

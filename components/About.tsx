import Reveal from "./Reveal";
import LogoMark from "./Logo";

export default function About() {
  return (
    <section id="about" className="relative py-20 md:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        {/* Текст */}
        <Reveal>
          <p className="font-heading text-sm font-semibold uppercase tracking-[0.25em] text-primary">
            О студии
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold text-ink sm:text-4xl md:text-5xl">
            Мы живём <span className="text-gradient">танцем</span>
          </h2>
          <div className="mt-6 space-y-4 font-body text-base leading-relaxed text-muted sm:text-lg">
            <p>
              Добро пожаловать в «Гравитацию» — пространство, где эстрадный танец
              превращается в шоу благодаря{" "}
              <span className="text-gradient font-semibold">любви к делу</span>.
            </p>
            <p>
              Наши номера — это синтез хореографии, театра и спорта:{" "}
              <span className="text-gradient font-semibold">уверенность</span>,
              поддержки, прыжки, работа в партере и притягательные связки.
            </p>
            <p>
              Вас ждут{" "}
              <span className="text-gradient font-semibold">
                творческие проекты
              </span>
              , конкурсы и показательные выступления на мероприятиях,
              спортивно-танцевальные сборы на море и в Подмосковье — мы живём
              танцем и делимся этой энергией с каждым участником!
            </p>
          </div>
        </Reveal>

        {/* Полный логотип — без контейнера, на фоне страницы */}
        <Reveal delay={150} className="flex justify-center lg:justify-end">
          <LogoMark
            src="/images/logo-full.png"
            title="Логотип студии Гравитация"
            className="aspect-[776/877] h-[220px] sm:h-[250px] lg:h-[380px] [filter:drop-shadow(0_0_30px_rgba(74,173,223,0.25))_drop-shadow(0_0_45px_rgba(167,139,250,0.3))_drop-shadow(0_0_55px_rgba(244,114,182,0.2))]"
          />
        </Reveal>
      </div>
    </section>
  );
}

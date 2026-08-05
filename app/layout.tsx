import type { Metadata } from "next";
import { Montserrat, Manrope } from "next/font/google";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";

/**
 * Заголовки: Montserrat — геометрический гротеск с поддержкой кириллицы.
 * (В ТЗ упоминался Outfit, но у него на Google Fonts нет кириллических
 *  глифов, поэтому для русского текста используем близкий по духу Montserrat.)
 * Основной текст: Manrope.
 */
const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

// Канонический адрес сайта. На Vercel задаётся через NEXT_PUBLIC_SITE_URL,
// иначе — продакшен-домен по умолчанию.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://gravitydance.ru";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Студия танца Гравитация — Пушкино | Записаться на занятие",
  description:
    "Студия эстрадного танца «Гравитация» в Пушкино с элементами акробатики. Группы для детей 3–16 лет и взрослых, конкурсы, показательные выступления и танцевальные сборы. Стань центром притяжения!",
  keywords: [
    "танцы",
    "студия танца",
    "эстрадный танец",
    "акробатика",
    "Гравитация",
    "танцы Пушкино",
    "танцы для детей",
    "растяжка",
    "танцевальные сборы",
  ],
  openGraph: {
    title: "Студия танца Гравитация — Пушкино | Записаться на занятие",
    description:
      "Эстрадный танец с элементами акробатики для детей и взрослых в Пушкино. Стань центром притяжения!",
    url: siteUrl,
    siteName: "Студия танца «Гравитация»",
    locale: "ru_RU",
    type: "website",
    images: [
      {
        url: "/images/og.jpg",
        width: 1200,
        height: 630,
        alt: "Студия танца Гравитация",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Студия танца Гравитация — Пушкино | Записаться на занятие",
    description:
      "Эстрадный танец с элементами акробатики. Стань центром притяжения!",
    images: ["/images/og.jpg"],
  },
};

// До-гидрационный скрипт: применяет сохранённую тему из localStorage ещё до
// первой отрисовки, чтобы не мигало. По умолчанию тёмная (класс dark уже стоит).
const themeInit = `(function(){try{var t=localStorage.getItem('theme');if(t==='light'){document.documentElement.classList.remove('dark');}else{document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ru"
      className={`dark ${montserrat.variable} ${manrope.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        {/* Фирменная водяная марка под всем контентом */}
        <div className="brand-watermark" aria-hidden />
        <div className="relative z-10">{children}</div>
        <CookieBanner />
      </body>
    </html>
  );
}

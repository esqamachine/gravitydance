import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // hover:-варианты применяются только на устройствах с реальным ховером —
  // на тачскринах hover-эффекты не «залипают» после тапа.
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      colors: {
        // Тёмная тема
        base: "#070B1A", // основной фон
        card: "#0D1428", // карточки
        surface: "#131B33", // поверхности
        // Брендовый градиент: голубой → сиреневый → розовый
        primary: "#4AADDF",
        "primary-light": "#7CC8F0",
        violet: "#A78BFA",
        pink: "#F472B6",
        // Текст
        ink: "#E4EAF6",
        muted: "#8A9ABF",
        // Светлая секция (галерея)
        "light-section": "#F4F8FF",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #4AADDF, #A78BFA, #F472B6)",
      },
      boxShadow: {
        cta: "0 4px 15px rgba(74,173,223,0.3), 0 8px 30px rgba(167,139,250,0.15), inset 0 1px 0 rgba(255,255,255,0.2)",
        "cta-hover":
          "0 6px 20px rgba(74,173,223,0.4), 0 12px 40px rgba(167,139,250,0.2), inset 0 1px 0 rgba(255,255,255,0.25)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "orb-1": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(60px, -40px) scale(1.15)" },
        },
        "orb-2": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(-50px, 50px) scale(1.1)" },
        },
        "orb-3": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(40px, 60px) scale(0.9)" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.7s ease-out forwards",
        "orb-1": "orb-1 14s ease-in-out infinite",
        "orb-2": "orb-2 18s ease-in-out infinite",
        "orb-3": "orb-3 16s ease-in-out infinite",
        "spin-slow": "spin-slow 24s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;

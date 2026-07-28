"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, ChevronDown } from "lucide-react";
import { groups } from "@/lib/data";
import Reveal from "./Reveal";

/** Форматирование телефона в маску +7 (XXX) XXX-XX-XX */
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").replace(/^8/, "7");
  let d = digits;
  if (d[0] !== "7") d = "7" + d;
  d = d.slice(0, 11);

  const p = d.slice(1);
  let out = "+7";
  if (p.length > 0) out += " (" + p.slice(0, 3);
  if (p.length >= 3) out += ") " + p.slice(3, 6);
  if (p.length >= 6) out += "-" + p.slice(6, 8);
  if (p.length >= 8) out += "-" + p.slice(8, 10);
  return out;
}

type Status = "idle" | "loading" | "success" | "error";

const inputClass =
  "w-full min-h-[50px] rounded-xl border border-white/10 bg-surface px-4 py-3.5 text-base font-body text-ink placeholder-muted/60 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25";

export default function SignupForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [group, setGroup] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  // Защита от спама: секунды до разблокировки повторной отправки
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const phoneValid = phone.replace(/\D/g, "").length === 11;
  const formValid = name.trim().length >= 2 && phoneValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cooldown > 0) {
      setErrorMsg(
        `Заявка уже отправлена. Повторить можно через ${cooldown} c.`
      );
      setStatus("error");
      return;
    }

    if (!formValid) {
      setErrorMsg("Пожалуйста, заполните имя и корректный номер телефона.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone, group }),
      });

      if (!res.ok) throw new Error();
      setStatus("success");
      setCooldown(30); // блокируем повторную отправку на 30 секунд
      setName("");
      setPhone("");
      setGroup("");
    } catch {
      setErrorMsg(
        "Что-то пошло не так, позвоните нам: +7 (977) 549-37-11"
      );
      setStatus("error");
    }
  };

  return (
    <section id="signup" className="relative py-20 md:py-28">
      {/* Фоновое свечение */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-xl px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <h2 className="font-heading text-3xl font-bold text-ink sm:text-4xl md:text-5xl">
            <span className="text-gradient">Записаться на пробное занятие</span>
          </h2>
          <p className="mt-4 font-body text-muted">
            Оставьте заявку — мы свяжемся с вами и подберём идеальную группу.
          </p>
        </Reveal>

        <Reveal delay={120}>
          {status === "success" ? (
            <div className="mt-10 flex flex-col items-center gap-4 rounded-[2rem] border border-white/10 bg-card p-10 text-center">
              <CheckCircle2 size={56} className="text-primary" />
              <p className="font-heading text-xl font-semibold text-ink">
                Заявка отправлена! Мы свяжемся с вами в ближайшее время.
              </p>
              <button
                onClick={() => setStatus("idle")}
                className="font-body text-sm text-primary-light underline-offset-4 hover:underline"
              >
                Отправить ещё одну заявку
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-10 space-y-5 rounded-[2rem] border border-white/10 bg-card p-8 shadow-2xl"
              noValidate
            >
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block font-body text-sm font-medium text-ink"
                >
                  Имя
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ваше имя"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-1.5 block font-body text-sm font-medium text-ink"
                >
                  Номер телефона
                </label>
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  onFocus={() => {
                    if (!phone) setPhone("+7 (");
                  }}
                  placeholder="+7 (___) ___-__-__"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="group"
                  className="mb-1.5 block font-body text-sm font-medium text-ink"
                >
                  Группа
                </label>
                <div className="relative">
                  <select
                    id="group"
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                    className={`${inputClass} appearance-none pr-11 ${
                      group ? "text-ink" : "text-muted/70"
                    }`}
                  >
                    <option value="">Выберите группу</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.title} className="text-ink">
                        {g.emoji} {g.title}
                      </option>
                    ))}
                    <option value="Другое / Хочу уточнить" className="text-ink">
                      Другое / Хочу уточнить
                    </option>
                  </select>
                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted"
                  />
                </div>
              </div>

              {status === "error" && (
                <p className="font-body text-sm text-pink">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={status === "loading" || cooldown > 0}
                className="btn-cta flex min-h-[52px] w-full items-center justify-center gap-2 px-8 py-4 font-heading font-bold disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Отправка…
                  </>
                ) : cooldown > 0 ? (
                  `Подождите ${cooldown} c`
                ) : (
                  "Отправить заявку"
                )}
              </button>

              <p className="text-center font-body text-xs text-muted">
                Нажимая кнопку, вы соглашаетесь на обработку персональных данных
                и{" "}
                <Link
                  href="/policy"
                  className="text-primary underline-offset-2 transition hover:underline"
                >
                  Политику конфиденциальности
                </Link>
              </p>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}

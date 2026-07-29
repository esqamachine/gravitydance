"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AuthShell from "@/components/auth/AuthShell";
import PasswordInput from "@/components/auth/PasswordInput";
import PhoneField from "@/components/auth/PhoneField";

const inputClass =
  "w-full min-h-[50px] rounded-xl border border-white/10 bg-surface px-4 py-3 text-base font-body text-ink placeholder-muted/60 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25";

export default function RegisterPage() {
  const supabase = createClient();

  const [name, setName] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (name.trim().length < 2) return setError("Укажите имя");
    if (phoneDigits.length !== 10)
      return setError("Введите номер телефона полностью");
    if (!email.includes("@")) return setError("Введите корректный email");
    if (password.length < 6)
      return setError("Пароль должен быть не короче 6 символов");
    if (password !== password2) return setError("Пароли не совпадают");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: "+7" + phoneDigits, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось зарегистрироваться");
        setLoading(false);
        return;
      }

      // Автовход
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInErr) {
        // Аккаунт создан, но автовход не удался — отправим на вход
        window.location.href = "/login";
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз.");
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={
        <>
          Регистрация в <span className="text-gradient">Гравитации</span>
        </>
      }
      subtitle="Создайте аккаунт, чтобы видеть расписание, посещения и оплаты."
      footer={
        <>
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Войти
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ФИО"
          autoComplete="name"
          className={inputClass}
        />
        <PhoneField
          digits={phoneDigits}
          onChange={setPhoneDigits}
          autoComplete="tel"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Адрес электронной почты"
          autoComplete="email"
          className={inputClass}
        />
        <PasswordInput
          value={password}
          onChange={setPassword}
          placeholder="Пароль (минимум 6 символов)"
          autoComplete="new-password"
        />
        <PasswordInput
          value={password2}
          onChange={setPassword2}
          placeholder="Повторите пароль"
          autoComplete="new-password"
        />

        {error && (
          <p className="text-center font-body text-sm text-pink">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-cta flex min-h-[52px] w-full items-center justify-center gap-2 px-6 py-3.5 font-heading font-bold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : null}
          Зарегистрироваться
        </button>
      </form>
    </AuthShell>
  );
}

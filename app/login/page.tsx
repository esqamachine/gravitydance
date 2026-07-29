"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Phone, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AuthShell from "@/components/auth/AuthShell";
import PasswordInput from "@/components/auth/PasswordInput";
import PhoneField from "@/components/auth/PhoneField";

const inputClass =
  "w-full min-h-[50px] rounded-xl border border-white/10 bg-surface px-4 py-3 text-base font-body text-ink placeholder-muted/60 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25";

type Method = "phone" | "email";

function LoginForm() {
  const supabase = createClient();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/dashboard";

  const [method, setMethod] = useState<Method>("phone");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /** Выполняет вход по готовому email. */
  const signIn = async (loginEmail: string) => {
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: loginEmail.toLowerCase(),
      password,
    });
    if (signInErr) {
      // Логируем реальную причину — на проде видно в консоли браузера
      console.error("[login] signInWithPassword:", {
        status: signInErr.status,
        name: signInErr.name,
        message: signInErr.message,
      });
      const msg = signInErr.message || "";
      if (/not confirmed/i.test(msg)) {
        setError("Email не подтверждён. Обратитесь в поддержку студии.");
      } else if (/invalid login credentials/i.test(msg)) {
        setError("Неверный логин или пароль");
      } else {
        setError(msg || "Не удалось войти");
      }
      setLoading(false);
      return;
    }
    window.location.href = redirectTo;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password) return setError("Введите пароль");

    setLoading(true);
    try {
      if (method === "phone") {
        if (phoneDigits.length !== 10) {
          setError("Введите номер телефона полностью");
          setLoading(false);
          return;
        }
        // Цифры → +7XXXXXXXXXX → email из базы
        const res = await fetch("/api/auth/resolve-phone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: "+7" + phoneDigits }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Аккаунт не найден");
          setLoading(false);
          return;
        }
        await signIn(data.email);
      } else {
        if (!email.includes("@")) {
          setError("Введите корректный email");
          setLoading(false);
          return;
        }
        await signIn(email.trim());
      }
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз.");
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={
        <>
          Личный <span className="text-gradient">кабинет</span>
        </>
      }
      subtitle="Войдите, чтобы видеть расписание, посещения и оплаты."
    >
      {/* Вкладки */}
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            { id: "phone", label: "По номеру", icon: Phone },
            { id: "email", label: "По email", icon: Mail },
          ] as const
        ).map((tab) => {
          const active = method === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setMethod(tab.id);
                setError("");
              }}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-heading text-sm font-semibold transition ${
                active
                  ? "btn-cta"
                  : "border border-white/10 bg-white/5 text-muted hover:text-ink"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
        {method === "phone" ? (
          <PhoneField
            digits={phoneDigits}
            onChange={setPhoneDigits}
            autoComplete="username"
          />
        ) : (
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Адрес электронной почты"
            autoComplete="username"
            className={inputClass}
          />
        )}

        <PasswordInput
          value={password}
          onChange={setPassword}
          placeholder="Пароль"
          autoComplete="current-password"
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
          Войти
        </button>

        <div className="flex flex-col items-center gap-2 pt-1 text-center font-body text-sm">
          <Link
            href="/reset-password"
            className="text-muted transition hover:text-ink"
          >
            Забыли пароль?
          </Link>
          <span className="text-muted">
            Нет аккаунта?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Зарегистрироваться
            </Link>
          </span>
        </div>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { normalizePhone } from "@/lib/phone";
import AuthShell from "@/components/auth/AuthShell";

const inputClass =
  "w-full min-h-[50px] rounded-xl border border-white/10 bg-surface px-4 py-3 text-base font-body text-ink placeholder-muted/60 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25";

function LoginForm() {
  const supabase = createClient();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/dashboard";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const id = identifier.trim();
    if (!id || !password) return setError("Введите телефон/email и пароль");

    setLoading(true);
    try {
      // Определяем: email или телефон
      let email = id;
      if (!id.includes("@")) {
        const phone = normalizePhone(id);
        if (phone.length !== 11) {
          setError("Введите корректный телефон или email");
          setLoading(false);
          return;
        }
        // Телефон → находим email в базе
        const res = await fetch("/api/auth/resolve-phone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Аккаунт не найден");
          setLoading(false);
          return;
        }
        email = data.email;
      }

      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });
      if (signInErr) {
        setError("Неверный логин или пароль");
        setLoading(false);
        return;
      }
      window.location.href = redirectTo;
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
      footer={
        <>
          Нет аккаунта?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Зарегистрироваться
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <input
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Телефон или email"
          autoComplete="username"
          className={inputClass}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          autoComplete="current-password"
          className={inputClass}
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

        <div className="flex items-center justify-between pt-1 font-body text-sm">
          <Link
            href="/reset-password"
            className="text-muted transition hover:text-ink"
          >
            Забыли пароль?
          </Link>
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

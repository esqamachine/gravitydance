"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AuthShell from "@/components/auth/AuthShell";

const inputClass =
  "w-full min-h-[50px] rounded-xl border border-white/10 bg-surface px-4 py-3 text-base font-body text-ink placeholder-muted/60 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) return setError("Введите корректный email");

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/update-password`,
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  return (
    <AuthShell
      title={
        <>
          Сброс <span className="text-gradient">пароля</span>
        </>
      }
      subtitle={
        sent ? undefined : "Укажите email — пришлём ссылку для смены пароля."
      }
      footer={
        <Link href="/login" className="text-primary hover:underline">
          Вернуться ко входу
        </Link>
      }
    >
      {sent ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-surface p-6 text-center">
          <CheckCircle2 size={44} className="text-primary" />
          <p className="font-heading font-semibold text-ink">
            Письмо отправлено на {email}
          </p>
          <p className="font-body text-sm text-muted">
            Откройте письмо и перейдите по ссылке, чтобы задать новый пароль.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
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
            Отправить ссылку
          </button>
        </form>
      )}
    </AuthShell>
  );
}

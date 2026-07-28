"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AuthShell from "@/components/auth/AuthShell";

const inputClass =
  "w-full min-h-[50px] rounded-xl border border-white/10 bg-surface px-4 py-3 text-base font-body text-ink placeholder-muted/60 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25";

export default function UpdatePasswordPage() {
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  // Ссылка из письма создаёт recovery-сессию (detectSessionInUrl). Ждём её,
  // иначе updateUser вернёт «Auth session missing».
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6)
      return setError("Пароль должен быть не короче 6 символов");
    if (password !== password2) return setError("Пароли не совпадают");

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    window.location.href = "/dashboard";
  };

  return (
    <AuthShell
      title={
        <>
          Новый <span className="text-gradient">пароль</span>
        </>
      }
      subtitle="Придумайте новый пароль для входа."
    >
      {!ready && !error ? (
        <p className="text-center font-body text-sm text-muted">
          Проверяем ссылку… Если страница открыта не из письма для сброса пароля,
          запросите ссылку заново на странице «Забыли пароль?».
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Новый пароль (минимум 6 символов)"
            autoComplete="new-password"
            className={inputClass}
          />
          <input
            type="password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            placeholder="Повторите пароль"
            autoComplete="new-password"
            className={inputClass}
          />
          {error && (
            <p className="text-center font-body text-sm text-pink">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !ready}
            className="btn-cta flex min-h-[52px] w-full items-center justify-center gap-2 px-6 py-3.5 font-heading font-bold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : null}
            Сохранить пароль
          </button>
        </form>
      )}
    </AuthShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Куда ведёт кнопка «Личный кабинет»: /dashboard если есть сессия, иначе /login.
 *  Дефолт — /dashboard (middleware всё равно завернёт неавторизованного на /login). */
export function useDashboardHref(): string {
  const [href, setHref] = useState("/dashboard");

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setHref(data.session ? "/dashboard" : "/login");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setHref(session ? "/dashboard" : "/login");
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return href;
}

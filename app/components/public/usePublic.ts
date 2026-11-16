"use client";

import { RefObject, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export type PublicPlan = {
  id: string;
  name: string;
  description: string;
  billing_interval: "month" | "year";
  price_brl: number;
};

export const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

/** Lê os planos reais (leitura pública já permitida pela política do Supabase). Somente leitura. */
export function usePublicPlans() {
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await supabase
          .from("connect_plans")
          .select("id,name,description,billing_interval,price_brl")
          .in("id", ["connect-monthly", "connect-annual"])
          .gt("price_brl", 0)
          .order("price_brl", { ascending: true });
        if (cancelled) return;
        if (result.error) { setState("error"); return; }
        setPlans((result.data || []) as PublicPlan[]);
        setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { plans, state };
}

/**
 * Ativa as animações de revelação ao rolar. Sem JS, ou com "movimento reduzido",
 * o conteúdo permanece visível (o CSS só esconde quando data-motion="on").
 */
export function useReveal(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined") return;
    el.dataset.motion = "on";
    const io = new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add("in"); io.unobserve(entry.target); }
      }),
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    el.querySelectorAll("[data-reveal]").forEach(node => io.observe(node));
    return () => io.disconnect();
  }, [root]);
}

/** true depois que a página rolou um pouco (para o cabeçalho ganhar borda). */
export function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

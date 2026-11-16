"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Crown, LoaderCircle, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";
import SubscriptionGift from "./SubscriptionGift";

type Plan = {
  id: string;
  name: string;
  description: string;
  billing_interval: "month" | "year";
  price_brl: number;
};
type Subscription = {
  id: string;
  plan_id: string;
  status: string;
  checkout_url: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

const money = (value: number) => new Intl.NumberFormat("pt-BR", {
  style: "currency", currency: "BRL",
}).format(value);

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [planResult, subResult] = await Promise.all([
      supabase.from("connect_plans").select("id,name,description,billing_interval,price_brl")
        .eq("active", true).gt("price_brl", 0).order("price_brl", { ascending: true }),
      supabase.from("connect_subscriptions")
        .select("id,plan_id,status,checkout_url,current_period_end,cancel_at_period_end")
        .in("status", ["pending", "authorized", "paused", "past_due", "cancelled"])
        .order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (planResult.error) setMessage("Não foi possível carregar os planos: " + planResult.error.message);
    else setPlans((planResult.data || []) as Plan[]);
    if (subResult.error) setMessage("Não foi possível consultar sua assinatura: " + subResult.error.message);
    else setSubscription(subResult.data as Subscription | null);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function subscribe(plan: Plan) {
    setBusy(plan.id);
    setMessage("");
    try {
      const { data, error } = await supabase.functions.invoke("mercadopago-subscriptions", {
        body: { action: "create", planId: plan.id },
      });
      if (error) throw error;
      if (!data?.init_point) throw new Error(data?.error || "O Mercado Pago não retornou o link de checkout.");
      window.location.assign(data.init_point);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível iniciar a assinatura.");
      setBusy("");
    }
  }

  async function cancel() {
    if (!subscription) return;
    if (!window.confirm("Deseja cancelar a renovação desta assinatura?")) return;
    setBusy("cancel");
    setMessage("");
    try {
      const { data, error } = await supabase.functions.invoke("mercadopago-subscriptions", {
        body: { action: "cancel", subscriptionId: subscription.id },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Não foi possível cancelar.");
      setMessage("Renovação cancelada. O acesso permanece até o fim do período já pago, quando essa data estiver disponível.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível cancelar a assinatura.");
    } finally {
      setBusy("");
    }
  }

  const active = subscription && (["pending", "authorized", "paused", "past_due"].includes(subscription.status) || (subscription.status === "cancelled" && Boolean(subscription.current_period_end) && new Date(subscription.current_period_end!).getTime() > Date.now()));
  return (
    <section style={{ display: "grid", gap: 18 }}>
      <div style={{ borderRadius: 20, padding: 24, color: "#f7f8fb", background: "linear-gradient(135deg,#151b2d,#25204a 65%,#173b45)", border: "1px solid #ffffff1c" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#c7baff", fontSize: 12, fontWeight: 800, letterSpacing: 1.4 }}>
          <Sparkles size={17}/> PACOTE CONNECT
        </div>
        <h2 style={{ margin: "12px 0 8px", fontSize: 26 }}>Buscas ilimitadas</h2>
        <p style={{ margin: 0, maxWidth: 620, color: "#d2d5e2", lineHeight: 1.6 }}>
          Continue encontrando pessoas sem o limite diário de 20 buscas. Escolha cobrança mensal ou anual; a renovação é automática até o cancelamento.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 18, color: "#d9f6e8", fontSize: 13 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Check size={15}/> Buscas ilimitadas enquanto a assinatura estiver válida</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><ShieldCheck size={15}/> Pagamento processado pelo Mercado Pago</span>
        </div>
      </div>

      {message && <div role="status" style={{ padding: 13, borderRadius: 12, background: "#fff4df", color: "#744b08", fontSize: 14 }}>{message}</div>}

      {active && subscription && (
        <div style={{ border: "1px solid #a9dfc1", background: "#effaf3", borderRadius: 16, padding: 18, color: "#174b30" }}>
          <strong style={{ display: "flex", alignItems: "center", gap: 8 }}><Crown size={18}/> Você tem uma assinatura CONNECT</strong>
          <p style={{ margin: "8px 0", fontSize: 14 }}>Status: {subscription.status === "authorized" ? "ativa" : subscription.status === "paused" ? "pausada" : subscription.status === "cancelled" ? "renovação cancelada" : subscription.status === "past_due" ? "pagamento pendente" : "aguardando pagamento"}.</p>
          {subscription.current_period_end && <p style={{ margin: "6px 0", fontSize: 13 }}>Período atual até {new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}.</p>}
          {subscription.status === "pending" && subscription.checkout_url && <button type="button" onClick={() => window.location.assign(subscription.checkout_url!)} style={{ marginTop: 8, border: 0, borderRadius: 10, padding: "10px 14px", background: "#6c5ce7", color: "white", fontWeight: 700, cursor: "pointer" }}>Continuar pagamento</button>}{subscription.status === "authorized" && !subscription.cancel_at_period_end && <button type="button" disabled={busy === "cancel"} onClick={() => void cancel()} style={{ marginTop: 8, border: "1px solid #8bbda0", borderRadius: 10, padding: "10px 14px", background: "white", color: "#174b30", fontWeight: 700, cursor: "pointer" }}>{busy === "cancel" ? "Cancelando..." : "Cancelar renovação"}</button>}
        </div>
      )}

      {loading ? <div style={{ display: "flex", alignItems: "center", gap: 9, padding: 24 }}><LoaderCircle size={18}/> Carregando planos...</div> :
        plans.length ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 14 }}>
          {plans.map(plan => <article key={plan.id} style={{ border: "1px solid var(--border, #dedfe5)", borderRadius: 16, padding: 20, background: "var(--card, #fff)", display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ fontSize: 11, letterSpacing: 1.2, fontWeight: 800, color: "#7771b9" }}>{plan.billing_interval === "month" ? "COBRANÇA MENSAL" : "COBRANÇA ANUAL"}</span>
            <h3 style={{ margin: 0, fontSize: 20 }}>{plan.name}</h3>
            <strong style={{ fontSize: 27 }}>{money(Number(plan.price_brl))}<small style={{ fontSize: 13, fontWeight: 500, color: "var(--muted,#777)" }}> / {plan.billing_interval === "month" ? "mês" : "ano"}</small></strong>
            <p style={{ margin: 0, minHeight: 42, color: "var(--muted,#777)", lineHeight: 1.5 }}>{plan.description || "Buscas ilimitadas no CONNECT."}</p>
            <button type="button" disabled={Boolean(busy) || Boolean(active)} onClick={() => void subscribe(plan)} style={{ marginTop: "auto", border: 0, borderRadius: 10, padding: 13, background: "#6c5ce7", color: "white", fontWeight: 800, cursor: "pointer", opacity: busy || active ? .6 : 1 }}>
              {busy === plan.id ? "Abrindo checkout..." : "Assinar com Mercado Pago"}
            </button>
          </article>)}
        </div> :
          <div style={{ border: "1px dashed var(--border,#c9cbd4)", borderRadius: 16, padding: 22 }}>
            <strong>Planos em configuração</strong>
            <p style={{ margin: "8px 0 0", color: "var(--muted,#777)", lineHeight: 1.6 }}>
              A estrutura de assinatura mensal e anual está preparada. Os valores ainda precisam ser definidos e cadastrados antes de liberar cobranças. Nenhum pagamento será iniciado sem um preço ativo.
            </p>
          </div>
      }
      <SubscriptionGift/>
      <button type="button" onClick={() => void load()} disabled={loading || Boolean(busy)} style={{ justifySelf: "start", display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid var(--border,#ddd)", borderRadius: 10, padding: "9px 12px", background: "transparent", cursor: "pointer" }}><RefreshCw size={15}/> Atualizar assinatura</button>
      <small style={{ color: "var(--muted,#777)", lineHeight: 1.5 }}>A confirmação do pagamento é feita pelo servidor após validação da notificação do Mercado Pago. Não liberamos benefícios apenas pelo retorno do checkout.</small>
    </section>
  );
}

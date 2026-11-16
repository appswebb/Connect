"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Crown, Gift, LoaderCircle, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";
import SubscriptionGift from "./SubscriptionGift";

type Plan = {
  id: string;
  name: string;
  description: string;
  billing_interval: "month" | "year";
  price_brl: number;
  active: boolean;
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
  const [giftPlan, setGiftPlan] = useState<Plan | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [planResult, subResult] = await Promise.all([
      supabase.from("connect_plans").select("id,name,description,billing_interval,price_brl,active")
        .in("id", ["connect-monthly", "connect-annual"]).gt("price_brl", 0).order("price_brl", { ascending: true }),
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
      if (error) throw new Error(data?.error || error.message || "Não foi possível conectar ao Mercado Pago.");
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
      if (error) throw new Error(data?.error || error.message || "Não foi possível cancelar.");
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
          Continue encontrando pessoas sem o limite diário de 20 buscas. Escolha o pacote mensal ou anual para sua conta, ou compre um deles para presentear um amigo.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 18, color: "#d9f6e8", fontSize: 13 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Check size={15}/> Buscas ilimitadas enquanto a assinatura estiver válida</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><ShieldCheck size={15}/> Pagamento processado pelo Mercado Pago</span>
        </div>
      </div>

      {message && <div role="status" style={{ padding: 13, borderRadius: 12, background: "#3a2b18", border: "1px solid #8b642c", color: "#ffe0a6", fontSize: 14, lineHeight: 1.55 }}>{message}</div>}

      {active && subscription && (
        <div style={{ border: "1px solid #426b4d", background: "linear-gradient(145deg,#17291e,#14221b)", borderRadius: 16, padding: 18, color: "#e3f7e8" }}>
          <strong style={{ display: "flex", alignItems: "center", gap: 8 }}><Crown size={18}/> Você tem uma assinatura CONNECT</strong>
          <p style={{ margin: "8px 0", fontSize: 14 }}>Status: {subscription.status === "authorized" ? "ativa" : subscription.status === "paused" ? "pausada" : subscription.status === "cancelled" ? "renovação cancelada" : subscription.status === "past_due" ? "pagamento pendente" : "aguardando pagamento"}.</p>
          {subscription.current_period_end && <p style={{ margin: "6px 0", fontSize: 13 }}>Período atual até {new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}.</p>}
          {subscription.status === "pending" && subscription.checkout_url && <button type="button" onClick={() => window.location.assign(subscription.checkout_url!)} style={{ marginTop: 8, border: 0, borderRadius: 10, padding: "10px 14px", background: "#b9ed70", color: "#15200d", fontWeight: 800, cursor: "pointer" }}>Continuar pagamento</button>}{subscription.status === "authorized" && !subscription.cancel_at_period_end && <button type="button" disabled={busy === "cancel"} onClick={() => void cancel()} style={{ marginTop: 8, border: "1px solid #547b60", borderRadius: 10, padding: "10px 14px", background: "#1c3024", color: "#e3f7e8", fontWeight: 700, cursor: "pointer" }}>{busy === "cancel" ? "Cancelando..." : "Cancelar renovação"}</button>}
        </div>
      )}

      {loading ? <div style={{ display: "flex", alignItems: "center", gap: 9, padding: 24 }}><LoaderCircle size={18}/> Carregando planos...</div> :
        plans.length ? <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 14 }}>
          {plans.map(plan => <article key={plan.id} style={{ border: "1px solid #34483e", borderRadius: 16, padding: 20, background: "linear-gradient(145deg,#18221f,#121a1b)", display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ fontSize: 11, letterSpacing: 1.2, fontWeight: 800, color: "#7771b9" }}>{plan.billing_interval === "month" ? "PACOTE MENSAL · 1 MÊS" : "PACOTE ANUAL · 1 ANO"}</span>
            <h3 style={{ margin: 0, fontSize: 20, color: "#f4f8f5" }}>{plan.name}</h3>
            <strong style={{ fontSize: 27, color: "#f4f8f5" }}>{money(Number(plan.price_brl))}<small style={{ fontSize: 13, fontWeight: 500, color: "#aebbb4" }}> / {plan.billing_interval === "month" ? "1 mês" : "1 ano"}</small></strong>
            <p style={{ margin: 0, minHeight: 42, color: "#aebbb4", lineHeight: 1.5 }}>{plan.description || "Buscas ilimitadas no CONNECT."}</p>
            <button type="button" disabled={!plan.active || Boolean(busy) || Boolean(active)} onClick={() => void subscribe(plan)} style={{ marginTop: "auto", border: 0, borderRadius: 10, padding: 13, background: "#6c5ce7", color: "white", fontWeight: 800, cursor: plan.active ? "pointer" : "not-allowed", opacity: !plan.active || busy || active ? .6 : 1 }}>
              {busy === plan.id ? "Abrindo checkout..." : plan.active ? "Comprar para minha conta" : "Pagamento em validação"}
            </button>
            <button type="button" disabled={!plan.active} onClick={() => setGiftPlan(plan)} style={{ border: "1px solid #405148", borderRadius: 10, padding: 12, background: "transparent", color: "#e8f0eb", fontWeight: 750, cursor: plan.active ? "pointer" : "not-allowed", opacity: plan.active ? 1 : .55, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Gift size={16}/> {plan.active ? "Presentear um amigo" : "Presente em validação"}
            </button>
          </article>)}
        </div>
        {plans.some(plan => !plan.active) && <p style={{ margin: 0, color: "#aebbb4", fontSize: 13, lineHeight: 1.5 }}>Os valores dos pacotes já estão cadastrados. A compra e o presente serão liberados depois da validação final do checkout do Mercado Pago.</p>}
        </> :
          <div style={{ border: "1px dashed #52645a", borderRadius: 16, padding: 22 }}>
            <strong style={{ color: "#f2f7f3" }}>Planos em configuração</strong>
            <p style={{ margin: "8px 0 0", color: "#aebbb4", lineHeight: 1.6 }}>
              Os dois pacotes e seus valores já estão cadastrados. A compra e o envio de presente serão liberados assim que a validação final do checkout do Mercado Pago terminar.
            </p>
          </div>
      }
      {giftPlan && <SubscriptionGift plan={giftPlan} onClose={() => setGiftPlan(null)}/>}
      <button type="button" onClick={() => void load()} disabled={loading || Boolean(busy)} style={{ justifySelf: "start", display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid #405148", borderRadius: 10, padding: "9px 12px", background: "#18221f", color: "#e8f0eb", cursor: "pointer" }}><RefreshCw size={15}/> Atualizar assinatura</button>
      <small style={{ color: "var(--muted,#777)", lineHeight: 1.5 }}>A confirmação do pagamento é feita pelo servidor após validação da notificação do Mercado Pago. Não liberamos benefícios apenas pelo retorno do checkout.</small>
    </section>
  );
}

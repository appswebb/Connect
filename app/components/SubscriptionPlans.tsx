"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Crown, LoaderCircle, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";
import ConnectCardCheckout from "./ConnectCardCheckout";
import ConnectPixCheckout from "./ConnectPixCheckout";

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
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "pix">("card");

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
      <div style={{ borderRadius: 20, padding: 24, color: "#252941", background: "linear-gradient(135deg,#f0efff,#e9eaff 65%,#eff8f1)", border: "1px solid #ffffff1c" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#5b5cf0", fontSize: 12, fontWeight: 800, letterSpacing: 1.4 }}>
          <Sparkles size={17}/> PACOTE CONNECT
        </div>
        <h2 style={{ margin: "12px 0 8px", fontSize: 26 }}>Buscas ilimitadas</h2>
        <p style={{ margin: 0, maxWidth: 620, color: "#777c91", lineHeight: 1.6 }}>
          Continue encontrando pessoas sem o limite diário de 20 buscas. Escolha o pacote mensal ou anual para sua conta.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 18, color: "#4d946b", fontSize: 13 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Check size={15}/> Buscas ilimitadas enquanto a assinatura estiver válida</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><ShieldCheck size={15}/> Pagamento processado pelo Mercado Pago</span>
        </div>
      </div>

      {selectedPlan && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="connect-checkout-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            overflowY: "auto",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: "clamp(10px, 3vw, 28px)",
            background: "rgba(32,36,58,.28)",
            backdropFilter: "blur(14px)",
          }}
        >
          <div style={{ width: "100%", maxWidth: 1100, margin: "auto" }}>
            <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:10,flexWrap:"wrap"}}>
              <button type="button" onClick={()=>setPaymentMethod("card")} style={{padding:"9px 14px",borderRadius:10,border:"1px solid #e6e7ef",background:paymentMethod==="card"?"#5b5cf0":"#f7f7fb",color:"#fff",fontWeight:800}}>Cartão · recorrente</button>
              <button type="button" onClick={()=>setPaymentMethod("pix")} style={{padding:"9px 14px",borderRadius:10,border:"1px solid #e6e7ef",background:paymentMethod==="pix"?"#5b5cf0":"#f7f7fb",color:"#fff",fontWeight:800}}>Pix · pagamento único</button>
            </div>
            {paymentMethod === "pix" ?
              <ConnectPixCheckout plan={selectedPlan} onBack={() => setSelectedPlan(null)} onComplete={() => { setSelectedPlan(null); void load(); }} /> :
              <ConnectCardCheckout plan={selectedPlan} onBack={() => setSelectedPlan(null)} onComplete={() => { setSelectedPlan(null); void load(); }} />}
          </div>
        </div>
      )}

      {message && <div role="status" style={{ padding: 13, borderRadius: 12, background: "#fff7e8", border: "1px solid #f0dfbd", color: "#916c36", fontSize: 14, lineHeight: 1.55 }}>{message}</div>}

      {active && subscription && (
        <div style={{ border: "1px solid #d5e8da", background: "#eff8f1", borderRadius: 16, padding: 18, color: "#3c6849" }}>
          <strong style={{ display: "flex", alignItems: "center", gap: 8 }}><Crown size={18}/> Você tem uma assinatura CONNECT</strong>
          <p style={{ margin: "8px 0", fontSize: 14 }}>Status: {subscription.status === "authorized" ? "ativa" : subscription.status === "paused" ? "pausada" : subscription.status === "cancelled" ? "renovação cancelada" : subscription.status === "past_due" ? "pagamento pendente" : "aguardando pagamento"}.</p>
          {subscription.current_period_end && <p style={{ margin: "6px 0", fontSize: 13 }}>Período atual até {new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}.</p>}
          {subscription.status === "pending" && <><p role="status" style={{ margin: "10px 0 0", color: "#557b60", fontSize: 13 }}>Seu pagamento ainda não foi concluído. Continue pelo checkout seguro dentro do CONNECT.</p><button type="button" onClick={() => { const plan = plans.find(item => item.id === subscription.plan_id); if (plan) { setMessage(""); setSelectedPlan(plan); } else setMessage("Não foi possível localizar o plano desta assinatura. Atualize a página."); }} style={{ marginTop: 10, border: 0, borderRadius: 10, padding: "11px 15px", background: "#5b5cf0", color: "#fff", fontWeight: 850, cursor: "pointer" }}>Continuar pagamento no CONNECT</button></>}{subscription.status === "authorized" && !subscription.cancel_at_period_end && <button type="button" disabled={busy === "cancel"} onClick={() => void cancel()} style={{ marginTop: 8, border: "1px solid #d5e8da", borderRadius: 10, padding: "10px 14px", background: "#f6fbf7", color: "#3c6849", fontWeight: 700, cursor: "pointer" }}>{busy === "cancel" ? "Cancelando..." : "Cancelar renovação"}</button>}
        </div>
      )}

      {loading ? <div style={{ display: "flex", alignItems: "center", gap: 9, padding: 24 }}><LoaderCircle size={18}/> Carregando planos...</div> :
        plans.length ? <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 14 }}>
          {plans.map(plan => <article key={plan.id} style={{ border: "1px solid #e7e8ef", borderRadius: 16, padding: 20, background: "#ffffff", display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ fontSize: 11, letterSpacing: 1.2, fontWeight: 800, color: "#5b5cf0" }}>{plan.billing_interval === "month" ? "PACOTE MENSAL · 1 MÊS" : "PACOTE ANUAL · 1 ANO"}</span>
            <h3 style={{ margin: 0, fontSize: 20, color: "#252941" }}>{plan.name}</h3>
            <strong style={{ fontSize: 27, color: "#252941" }}>{money(Number(plan.price_brl))}<small style={{ fontSize: 13, fontWeight: 500, color: "#85899b" }}> / {plan.billing_interval === "month" ? "1 mês" : "1 ano"}</small></strong>
            <p style={{ margin: 0, minHeight: 42, color: "#85899b", lineHeight: 1.5 }}>{plan.description || "Buscas ilimitadas no CONNECT."}</p>
            <button type="button" disabled={!plan.active || Boolean(busy) || Boolean(active)} onClick={() => { setMessage(""); setPaymentMethod("card"); setSelectedPlan(plan); }} style={{ marginTop: "auto", border: 0, borderRadius: 10, padding: 13, background: "#5b5cf0", color: "white", fontWeight: 800, cursor: plan.active ? "pointer" : "not-allowed", opacity: !plan.active || busy || active ? .6 : 1 }}>
              {plan.active ? "Ver pagamento" : "Pagamento em validação"}
            </button>
          </article>)}
        </div>
        {plans.some(plan => !plan.active) && <p style={{ margin: 0, color: "#85899b", fontSize: 13, lineHeight: 1.5 }}>Os valores dos pacotes já estão cadastrados. A compra será liberada depois da validação final do checkout do Mercado Pago.</p>}
        </> :
          <div style={{ border: "1px dashed #dfe1ea", borderRadius: 16, padding: 22 }}>
            <strong style={{ color: "#555a70" }}>Planos em configuração</strong>
            <p style={{ margin: "8px 0 0", color: "#85899b", lineHeight: 1.6 }}>
              Os dois pacotes e seus valores já estão cadastrados. A compra será liberada assim que a validação final do checkout do Mercado Pago terminar.
            </p>
          </div>
      }
      <button type="button" onClick={() => void load()} disabled={loading || Boolean(busy)} style={{ justifySelf: "start", display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid #e5e6ef", borderRadius: 10, padding: "9px 12px", background: "#f7f7fb", color: "#555a70", cursor: "pointer" }}><RefreshCw size={15}/> Atualizar assinatura</button>
      <small style={{ color: "var(--muted,#777)", lineHeight: 1.5 }}>A confirmação do pagamento é feita pelo servidor após validação da notificação do Mercado Pago. Não liberamos benefícios apenas pelo retorno do checkout.</small>
    </section>
  );
}

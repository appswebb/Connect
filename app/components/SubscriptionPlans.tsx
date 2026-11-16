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
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

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

      {selectedPlan && (
        <div role="dialog" aria-modal="true" aria-labelledby="connect-checkout-title" style={{ position: "fixed", inset: 0, zIndex: 10000, overflowY: "auto", display: "grid", placeItems: "center", padding: 18, background: "rgba(5,8,15,.94)", backdropFilter: "blur(12px)" }}>
          <div style={{ width: "100%", maxWidth: 480, borderRadius: 26, overflow: "hidden", border: "1px solid #ffffff24", background: "linear-gradient(160deg,#171d32 0%,#17172b 58%,#102a2b 100%)", boxShadow: "0 24px 90px #0009", color: "#f7f8ff" }}>
            <div style={{ padding: "24px 24px 20px", background: "linear-gradient(120deg,#6c5ce7,#344b80 58%,#147b78)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, color: "#e6e1ff" }}>CONNECT</div>
                <h2 id="connect-checkout-title" style={{ margin: "8px 0 0", fontSize: 25, lineHeight: 1.15 }}>Finalizar assinatura</h2>
              </div>
              <div style={{ width: 48, height: 48, borderRadius: 16, display: "grid", placeItems: "center", background: "#ffffff20", border: "1px solid #ffffff35" }}><Crown size={25}/></div>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#bdb4ff", fontSize: 11, fontWeight: 850, letterSpacing: 1.3 }}><ShieldCheck size={15}/> RESUMO DO PEDIDO</div>
              <div style={{ marginTop: 16, padding: 18, borderRadius: 18, background: "#ffffff0a", border: "1px solid #ffffff18" }}>
                <div style={{ fontSize: 13, color: "#b9bfd3" }}>Pacote selecionado</div>
                <div style={{ marginTop: 5, fontSize: 20, fontWeight: 850 }}>{selectedPlan.name}</div>
                <div style={{ marginTop: 5, color: "#b9bfd3", fontSize: 13 }}>{selectedPlan.billing_interval === "month" ? "Cobrança recorrente mensal" : "Cobrança recorrente anual"}</div>
                <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid #ffffff1c", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ color: "#c5c9d8", fontSize: 14 }}>Total de hoje</span>
                  <strong style={{ fontSize: 28, letterSpacing: -.6 }}>{money(Number(selectedPlan.price_brl))}</strong>
                </div>
              </div>
              <div style={{ display: "grid", gap: 12, margin: "18px 0", color: "#d7dbea", fontSize: 13, lineHeight: 1.5 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}><Check size={17} color="#b9ed70"/> Buscas ilimitadas durante o período da assinatura</div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}><ShieldCheck size={17} color="#b9ed70"/> Pagamento processado com segurança pelo Mercado Pago</div>
              </div>
              <div style={{ padding: 12, borderRadius: 12, background: "#ffffff0a", color: "#aeb6cb", fontSize: 12, lineHeight: 1.5 }}>
                Na próxima etapa, você será direcionado ao ambiente seguro do Mercado Pago para escolher ou confirmar a forma de pagamento. A cobrança será recorrente conforme o plano escolhido.
              </div>
              {message && <div role="alert" style={{ marginTop: 14, padding: 12, borderRadius: 12, background: "#492b2b", border: "1px solid #a45b5b", color: "#ffe0e0", fontSize: 13 }}>{message}</div>}
              <button type="button" disabled={Boolean(busy)} onClick={() => void subscribe(selectedPlan)} style={{ width: "100%", marginTop: 18, border: 0, borderRadius: 14, padding: 15, background: "linear-gradient(100deg,#7666f2,#5c52d8)", color: "white", fontSize: 15, fontWeight: 900, cursor: busy ? "wait" : "pointer", boxShadow: "0 8px 24px #5d51d84d", display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
                {busy === selectedPlan.id ? <><LoaderCircle size={18}/> Conectando ao pagamento...</> : <>Continuar para pagamento seguro <ShieldCheck size={18}/></>}
              </button>
              <button type="button" disabled={Boolean(busy)} onClick={() => setSelectedPlan(null)} style={{ width: "100%", marginTop: 10, border: "1px solid #ffffff26", borderRadius: 14, padding: 13, background: "transparent", color: "#d8dbea", fontWeight: 750, cursor: "pointer" }}>Voltar aos planos</button>
              <div style={{ marginTop: 18, textAlign: "center", color: "#8992aa", fontSize: 11 }}>CONNECT · Pagamento protegido pelo Mercado Pago</div>
            </div>
          </div>
        </div>
      )}

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
            <button type="button" disabled={!plan.active || Boolean(busy) || Boolean(active)} onClick={() => { setMessage(""); setSelectedPlan(plan); }} style={{ marginTop: "auto", border: 0, borderRadius: 10, padding: 13, background: "#6c5ce7", color: "white", fontWeight: 800, cursor: plan.active ? "pointer" : "not-allowed", opacity: !plan.active || busy || active ? .6 : 1 }}>
              {plan.active ? "Ver pagamento" : "Pagamento em validação"}
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

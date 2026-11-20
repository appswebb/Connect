"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Crown, Gift, LoaderCircle, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";
import SubscriptionGift from "./SubscriptionGift";
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

const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [giftPlan, setGiftPlan] = useState<Plan | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "pix">("card");

  const load = useCallback(async () => {
    setLoading(true);
    const [planResult, subResult] = await Promise.all([
      supabase
        .from("connect_plans")
        .select("id,name,description,billing_interval,price_brl,active")
        .in("id", ["connect-monthly", "connect-annual"])
        .gt("price_brl", 0)
        .order("price_brl", { ascending: true }),
      supabase
        .from("connect_subscriptions")
        .select("id,plan_id,status,checkout_url,current_period_end,cancel_at_period_end")
        .in("status", ["pending", "authorized", "paused", "past_due", "cancelled"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (planResult.error) setMessage("Não foi possível carregar os planos: " + planResult.error.message);
    else setPlans((planResult.data || []) as Plan[]);

    if (subResult.error) setMessage("Não foi possível consultar sua assinatura: " + subResult.error.message);
    else setSubscription(subResult.data as Subscription | null);

    setLoading(false);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "return") {
      const status = params.get("status");
      if (status === "failure") {
        setMessage("O pagamento não foi concluído. Você pode tentar novamente quando quiser.");
      } else if (status === "pending") {
        setMessage("Pagamento em análise no Mercado Pago. Assim que o servidor confirmar, sua assinatura será ativada.");
      } else if (status === "success") {
        setMessage("Retorno do pagamento recebido. Verificando confirmação oficial no servidor...");
      }
    }
    void load();
  }, [load]);

  async function cancel() {
    if (!subscription || busy) return;
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

  const active = Boolean(
    subscription &&
      (["pending", "authorized", "paused", "past_due"].includes(subscription.status) ||
        (subscription.status === "cancelled" &&
          Boolean(subscription.current_period_end) &&
          new Date(subscription.current_period_end!).getTime() > Date.now())),
  );

  return (
    <section className="subscription-workspace" aria-label="Planos e assinatura CONNECT">
      <header className="subscription-hero">
        <span className="subscription-kicker"><Sparkles size={17} /> PACOTE CONNECT</span>
        <h2>Buscas ilimitadas.</h2>
        <p>
          Continue encontrando pessoas sem o limite diário de 20 buscas. Escolha o pacote mensal ou anual para sua conta, ou compre um deles para presentear um amigo.
        </p>
        <div className="subscription-benefits">
          <span><Check size={15} /> Buscas ilimitadas enquanto a assinatura estiver válida</span>
          <span><ShieldCheck size={15} /> Pagamento processado pelo Mercado Pago</span>
        </div>
      </header>

      {selectedPlan && (
        <div className="subscription-checkout-backdrop" role="dialog" aria-modal="true" aria-labelledby="connect-checkout-title">
          <div className="subscription-checkout-dialog">
            <header className="subscription-checkout-heading">
              <div>
                <small>FINALIZAÇÃO SEGURA</small>
                <h2 id="connect-checkout-title">Escolha como pagar</h2>
              </div>
              <button type="button" className="subscription-close" onClick={() => setSelectedPlan(null)} aria-label="Fechar checkout">×</button>
            </header>
            <div className="payment-method-switch" role="group" aria-label="Método de pagamento">
              <button type="button" aria-pressed={paymentMethod === "card"} className={paymentMethod === "card" ? "active" : ""} onClick={() => setPaymentMethod("card")}>
                Cartão · recorrente
              </button>
              <button type="button" aria-pressed={paymentMethod === "pix"} className={paymentMethod === "pix" ? "active" : ""} onClick={() => setPaymentMethod("pix")}>
                Pix · pagamento único
              </button>
            </div>
            {paymentMethod === "pix" ? (
              <ConnectPixCheckout
                plan={selectedPlan}
                onBack={() => setSelectedPlan(null)}
                onComplete={() => { setSelectedPlan(null); void load(); }}
              />
            ) : (
              <ConnectCardCheckout
                plan={selectedPlan}
                onBack={() => setSelectedPlan(null)}
                onComplete={() => { setSelectedPlan(null); void load(); }}
              />
            )}
          </div>
        </div>
      )}

      {message && <div className="subscription-message" role="status" aria-live="polite">{message}</div>}

      {active && subscription && (
        <section className="subscription-current">
          <div className="subscription-current-title"><Crown size={19} /><strong>Você tem uma assinatura CONNECT</strong></div>
          <p>Status: {subscription.status === "authorized" ? "ativa" : subscription.status === "paused" ? "pausada" : subscription.status === "cancelled" ? "renovação cancelada" : subscription.status === "past_due" ? "pagamento pendente" : "aguardando pagamento"}.</p>
          {subscription.current_period_end && <p>Período atual até {new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}.</p>}
          {subscription.status === "pending" && (
            <div className="subscription-pending">
              <p role="status">Seu pagamento ainda não foi concluído. Continue pelo checkout seguro dentro do CONNECT.</p>
              <button type="button" onClick={() => {
                const plan = plans.find((item) => item.id === subscription.plan_id);
                if (plan) { setMessage(""); setSelectedPlan(plan); }
                else setMessage("Não foi possível localizar o plano desta assinatura. Atualize a página.");
              }}>Continuar pagamento no CONNECT</button>
            </div>
          )}
          {subscription.status === "authorized" && !subscription.cancel_at_period_end && (
            <button type="button" className="subscription-cancel" disabled={busy === "cancel"} onClick={() => void cancel()}>
              {busy === "cancel" ? "Cancelando..." : "Cancelar renovação"}
            </button>
          )}
        </section>
      )}

      {loading ? (
        <div className="subscription-loading"><LoaderCircle className="spin" size={19} /> Carregando planos...</div>
      ) : plans.length ? (
        <div className="subscription-plan-grid">
          {plans.map((plan) => (
            <article key={plan.id} className={"subscription-plan-card" + (plan.billing_interval === "year" ? " annual" : "")}>
              <span className="subscription-plan-kicker">{plan.billing_interval === "month" ? "PACOTE MENSAL · 1 MÊS" : "PACOTE ANUAL · 1 ANO"}</span>
              <h3>{plan.name}</h3>
              <strong className="subscription-price">
                {money(Number(plan.price_brl))}
                <small> / {plan.billing_interval === "month" ? "1 mês" : "1 ano"}</small>
              </strong>
              <p>{plan.description || "Buscas ilimitadas no CONNECT."}</p>
              <button
                type="button"
                className="subscription-buy"
                disabled={!plan.active || Boolean(busy) || active}
                onClick={() => { setMessage(""); setPaymentMethod("card"); setSelectedPlan(plan); }}
              >
                {plan.active ? "Ver pagamento" : "Pagamento em validação"}
              </button>
              <button type="button" className="subscription-gift" disabled={!plan.active} onClick={() => setGiftPlan(plan)}>
                <Gift size={16} /> {plan.active ? "Presentear um amigo" : "Presente em validação"}
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="subscription-empty">
          <strong>Planos em configuração</strong>
          <p>Os dois pacotes e seus valores já estão cadastrados. A compra e o envio de presente serão liberados assim que a validação final do checkout do Mercado Pago terminar.</p>
        </div>
      )}

      {!loading && plans.some((plan) => !plan.active) && (
        <p className="subscription-note">Os valores dos pacotes já estão cadastrados. A compra e o presente serão liberados depois da validação final do checkout do Mercado Pago.</p>
      )}

      {giftPlan && <SubscriptionGift plan={giftPlan} onClose={() => setGiftPlan(null)} />}

      <button type="button" className="subscription-refresh" onClick={() => void load()} disabled={loading || Boolean(busy)}>
        <RefreshCw size={15} /> Atualizar assinatura
      </button>
      <small className="subscription-security-note">
        A confirmação do pagamento é feita pelo servidor após validação da notificação do Mercado Pago. Não liberamos benefícios apenas pelo retorno do checkout.
      </small>
    </section>
  );
}

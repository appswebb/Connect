"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabase";

type Plan = { id: string; name: string; billing_interval: "month" | "year"; price_brl: number };
type CardFormInstance = { unmount?: () => void; getCardFormData: () => { token?: string } };
type MercadoPagoInstance = { cardForm: (config: Record<string, unknown>) => CardFormInstance };
declare global { interface Window { MercadoPago?: new (key: string, options?: Record<string, unknown>) => MercadoPagoInstance } }

const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function ConnectCardCheckout({ plan, onBack, onComplete }: { plan: Plan; onBack: () => void; onComplete: () => void }) {
  const formRef = useRef<CardFormInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let instance: CardFormInstance | null = null;

    async function mount() {
      try {
        const { data, error: keyError } = await supabase.functions.invoke("mercadopago-subscriptions", { body: { action: "public_key" } });
        if (keyError || !data?.public_key) throw new Error(data?.error || keyError?.message || "Não foi possível preparar o pagamento.");
        if (cancelled) return;

        const loadSdk = () => new Promise<void>((resolve, reject) => {
          if (window.MercadoPago) return resolve();
          const existing = document.querySelector<HTMLScriptElement>('script[src="https://sdk.mercadopago.com/js/v2"]');
          if (existing) {
            existing.addEventListener("load", () => resolve(), { once: true });
            existing.addEventListener("error", () => reject(new Error("Não foi possível carregar o checkout seguro.")), { once: true });
            if (window.MercadoPago) resolve();
            return;
          }
          const script = document.createElement("script");
          script.src = "https://sdk.mercadopago.com/js/v2";
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Não foi possível carregar o checkout seguro."));
          document.head.appendChild(script);
        });
        await loadSdk();
        if (cancelled || !window.MercadoPago) return;
        const mp = new window.MercadoPago(data.public_key, { locale: "pt-BR" });
        instance = mp.cardForm({
          amount: Number(plan.price_brl).toFixed(2),
          iframe: true,
          form: {
            id: "connect-card-checkout",
            cardNumber: { id: "connect-card-number", placeholder: "Número do cartão" },
            expirationDate: { id: "connect-card-expiry", placeholder: "MM/AA" },
            securityCode: { id: "connect-card-cvv", placeholder: "CVV" },
            cardholderName: { id: "connect-card-name", placeholder: "Nome impresso no cartão" },
            issuer: { id: "connect-card-issuer", placeholder: "Banco emissor" },
            installments: { id: "connect-card-installments", placeholder: "Parcelas" },
            identificationType: { id: "connect-card-doc-type", placeholder: "Tipo de documento" },
            identificationNumber: { id: "connect-card-doc-number", placeholder: "CPF" },
            cardholderEmail: { id: "connect-card-email", placeholder: "E-mail" },
          },
          callbacks: {
            onFormMounted: (mountError: unknown) => {
              if (mountError) setError("Não foi possível carregar os campos do cartão. Atualize a página e tente novamente.");
              setLoading(false);
            },
            onSubmit: (event: Event) => {
              event.preventDefault();
              if (submitting || !instance) return;
              const token = instance.getCardFormData()?.token;
              if (!token) { setError("Confira os dados do cartão e tente novamente."); return; }
              setSubmitting(true);
              setError("");
              void supabase.functions.invoke("mercadopago-subscriptions", {
                body: { action: "create", planId: plan.id, cardTokenId: token },
              }).then(({ data: result, error: invokeError }) => {
                if (invokeError || !result?.success) throw new Error(result?.error || invokeError?.message || "O Mercado Pago não autorizou a assinatura.");
                onComplete();
              }).catch((submitError: unknown) => {
                setError(submitError instanceof Error ? submitError.message : "Não foi possível concluir a assinatura.");
                setSubmitting(false);
              });
            },
            onFetching: () => {
              const progress = document.getElementById("connect-card-progress");
              progress?.removeAttribute("value");
              return () => progress?.setAttribute("value", "0");
            },
          },
        });
        formRef.current = instance;
      } catch (mountError) {
        if (!cancelled) { setError(mountError instanceof Error ? mountError.message : "Não foi possível abrir o checkout."); setLoading(false); }
      }
    }
    void mount();
    return () => { cancelled = true; instance?.unmount?.(); formRef.current = null; };
  }, [plan.id, plan.price_brl, onComplete, submitting]);

  return (
    <div style={{ marginTop: 18, padding: 18, borderRadius: 18, background: "#0d1424", border: "1px solid #ffffff20" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 16 }}>
        <div><div style={{ color: "#aeb8d0", fontSize: 12 }}>Pagamento da assinatura</div><strong style={{ display: "block", marginTop: 4, fontSize: 22 }}>{money(Number(plan.price_brl))}</strong></div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#b9edcf", fontSize: 11, fontWeight: 800 }}><LockKeyhole size={15}/> AMBIENTE SEGURO</div>
      </div>
      <form id="connect-card-checkout" style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6, color: "#d8deed", fontSize: 12 }}>Número do cartão<div id="connect-card-number" style={fieldStyle}/></label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <label style={{ display: "grid", gap: 6, color: "#d8deed", fontSize: 12 }}>Validade<div id="connect-card-expiry" style={fieldStyle}/></label>
          <label style={{ display: "grid", gap: 6, color: "#d8deed", fontSize: 12 }}>Código de segurança<div id="connect-card-cvv" style={fieldStyle}/></label>
        </div>
        <label style={{ display: "grid", gap: 6, color: "#d8deed", fontSize: 12 }}>Nome do titular<input id="connect-card-name" autoComplete="cc-name" placeholder="Nome impresso no cartão" style={inputStyle}/></label>
        <label style={{ display: "grid", gap: 6, color: "#d8deed", fontSize: 12 }}>CPF<select id="connect-card-doc-type" style={inputStyle}/><input id="connect-card-doc-number" inputMode="numeric" placeholder="Somente números" style={inputStyle}/></label>
        <label style={{ display: "grid", gap: 6, color: "#d8deed", fontSize: 12 }}>E-mail<input id="connect-card-email" type="email" autoComplete="email" placeholder="Seu e-mail" style={inputStyle}/></label>
        <label style={{ display: "grid", gap: 6, color: "#d8deed", fontSize: 12 }}>Banco emissor<select id="connect-card-issuer" style={inputStyle}/></label>
        <label style={{ display: "grid", gap: 6, color: "#d8deed", fontSize: 12 }}>Parcelas<select id="connect-card-installments" style={inputStyle}/></label>
        <progress id="connect-card-progress" value="0" max="100" style={{ width: "100%", accentColor: "#8c7cff" }}/>
        {error && <div role="alert" style={{ padding: 11, borderRadius: 10, background: "#492b2b", border: "1px solid #a45b5b", color: "#ffe0e0", fontSize: 13 }}>{error}</div>}
        <button type="submit" disabled={loading || submitting} style={{ width: "100%", border: 0, borderRadius: 13, padding: 15, background: "linear-gradient(100deg,#7666f2,#5c52d8)", color: "white", fontSize: 15, fontWeight: 900, cursor: loading || submitting ? "wait" : "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
          {loading || submitting ? <><LoaderCircle size={18}/> {loading ? "Preparando checkout..." : "Confirmando assinatura..."}</> : <>Assinar com segurança <ShieldCheck size={18}/></>}
        </button>
      </form>
      <p style={{ margin: "12px 0 0", color: "#8992aa", fontSize: 11, lineHeight: 1.5 }}>Os dados do cartão são capturados diretamente nos campos seguros do Mercado Pago. O CONNECT não recebe nem armazena o número completo ou o código de segurança.</p>
      <button type="button" disabled={submitting} onClick={onBack} style={{ width: "100%", marginTop: 10, border: "1px solid #ffffff26", borderRadius: 12, padding: 12, background: "transparent", color: "#d8dbea", fontWeight: 750 }}>Voltar aos planos</button>
    </div>
  );
}

const fieldStyle: React.CSSProperties = { minHeight: 44, border: "1px solid #39445f", borderRadius: 10, background: "#151e32", padding: "10px 12px", color: "#f7f8ff" };
const inputStyle: React.CSSProperties = { width: "100%", minHeight: 44, boxSizing: "border-box", border: "1px solid #39445f", borderRadius: 10, background: "#151e32", padding: "10px 12px", color: "#f7f8ff", outline: "none" };

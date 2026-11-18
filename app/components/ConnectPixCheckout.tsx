"use client";

import { useState } from "react";
import { ArrowLeft, Check, Copy, LoaderCircle, QrCode, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabase";

type Plan = {
  id: string;
  name: string;
  billing_interval: "month" | "year";
  price_brl: number;
};

type PixCheckout = {
  id: string;
  code: string;
  image: string;
  expires: string;
};

export default function ConnectPixCheckout({
  plan,
  onBack,
  onComplete,
}: {
  plan: Plan;
  onBack: () => void;
  onComplete: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [pix, setPix] = useState<PixCheckout | null>(null);

  const money = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(plan.price_brl));

  async function createPix() {
    if (loading) return;
    setLoading(true);
    setMessage("");
    try {
      const { data, error } = await supabase.functions.invoke("mercadopago-subscriptions", {
        body: { action: "create_pix", planId: plan.id },
      });
      if (error || !data?.pix_checkout_id || !data?.qr_code || !data?.qr_code_base64) {
        throw new Error(data?.error || error?.message || "Não foi possível gerar o Pix.");
      }
      setPix({
        id: data.pix_checkout_id,
        code: data.qr_code,
        image: data.qr_code_base64,
        expires: data.expires_at,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao gerar Pix.");
    } finally {
      setLoading(false);
    }
  }

  async function checkStatus() {
    if (!pix || checking) return;
    setChecking(true);
    setMessage("");
    try {
      const { data, error } = await supabase.functions.invoke("mercadopago-subscriptions", {
        body: { action: "pix_status", pixCheckoutId: pix.id },
      });
      if (error || !data) throw new Error(data?.error || error?.message || "Não foi possível consultar.");
      if (data.status === "approved") {
        onComplete();
      } else {
        setMessage("O pagamento ainda não foi confirmado. A liberação acontece automaticamente após a confirmação do Mercado Pago.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao consultar o pagamento.");
    } finally {
      setChecking(false);
    }
  }

  async function copyCode() {
    if (!pix) return;
    try {
      await navigator.clipboard.writeText(pix.code);
      setCopied(true);
      setMessage("");
    } catch {
      setMessage("Não foi possível copiar automaticamente. Selecione o código e copie.");
    }
  }

  return (
    <section className="pix-checkout" aria-labelledby="pix-checkout-title">
      <header className="pix-checkout-header">
        <button type="button" className="pix-back" onClick={onBack} disabled={loading || checking}>
          <ArrowLeft size={16} /> Voltar
        </button>
        <span className="pix-brand">CONNECT</span>
      </header>

      <div className="pix-checkout-intro">
        <span className="pix-security"><ShieldCheck size={17} /> Pix seguro pelo Mercado Pago</span>
        <h2 id="pix-checkout-title">Pague com Pix</h2>
        <p>{plan.name} · <strong>{money}</strong> · cobrança {plan.billing_interval === "year" ? "anual" : "mensal"}. Pagamento único, sem renovação automática.</p>
      </div>

      {!pix ? (
        <div className="pix-generate">
          <div className="pix-qr-placeholder"><QrCode size={34} /><span>Seu QR Code será exibido aqui</span></div>
          <button type="button" className="pix-primary-action" onClick={() => void createPix()} disabled={loading}>
            {loading ? <><LoaderCircle className="spin" size={18} /> Gerando Pix...</> : <><QrCode size={18} /> Gerar QR Code Pix</>}
          </button>
        </div>
      ) : (
        <div className="pix-payment-details">
          <div className="pix-qr-frame">
            <img
              alt="QR Code Pix para pagamento"
              src={"data:image/png;base64," + pix.image}
              width={220}
              height={220}
            />
          </div>
          <p className="pix-instruction">Abra o aplicativo do seu banco e escaneie o QR Code.</p>
          <button type="button" className="pix-copy-action" onClick={() => void copyCode()}>
            {copied ? <Check size={17} /> : <Copy size={17} />}
            {copied ? "Código copiado" : "Copiar código Pix"}
          </button>
          <label className="pix-code-label">
            Pix copia e cola
            <textarea readOnly value={pix.code} aria-label="Código Pix copia e cola" onFocus={(event) => event.currentTarget.select()} />
          </label>
          <p className="pix-expiration">Válido até {pix.expires ? new Date(pix.expires).toLocaleString("pt-BR") : "o prazo informado pelo Mercado Pago"}.</p>
          <button type="button" className="pix-primary-action" onClick={() => void checkStatus()} disabled={checking}>
            {checking ? <><LoaderCircle className="spin" size={18} /> Consultando...</> : "Já paguei · verificar status"}
          </button>
        </div>
      )}

      {message && <p className="pix-feedback" role="status" aria-live="polite">{message}</p>}
      <footer className="pix-checkout-footer">
        <ShieldCheck size={15} />
        <span>A assinatura só é liberada após a confirmação do pagamento pelo Mercado Pago.</span>
      </footer>
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, CreditCard, LockKeyhole, LoaderCircle, ShieldCheck, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";

type Plan = { id: string; name: string; billing_interval: "month" | "year"; price_brl: number };
type CardFormInstance = { unmount?: () => void; getCardFormData: () => { token?: string } };
type MercadoPagoInstance = { cardForm: (config: Record<string, unknown>) => CardFormInstance };
declare global { interface Window { MercadoPago?: new (key: string, options?: Record<string, unknown>) => MercadoPagoInstance } }

const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const periodLabel = (interval: Plan["billing_interval"]) => interval === "year" ? "ano" : "mês";

async function invokeErrorMessage(error: unknown, data: unknown, fallback: string) {
  const payload = data as { error?: string; message?: string } | null;
  if (payload?.error || payload?.message) return payload.error || payload.message || fallback;
  const context = (error as { context?: unknown } | null)?.context;
  if (typeof Response !== "undefined" && context instanceof Response) {
    const body = await context.clone().json().catch(() => null) as { error?: string; message?: string } | null;
    if (body?.error || body?.message) return body.error || body.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export default function ConnectCardCheckout({ plan, onBack, onComplete }: { plan: Plan; onBack: () => void; onComplete: () => void }) {
  const submittingRef = useRef(false);
  const formReadyRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formReady, setFormReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let instance: CardFormInstance | null = null;

    async function mount() {
      try {
        const { data, error: keyError } = await supabase.functions.invoke("mercadopago-subscriptions", { body: { action: "public_key" } });
        if (keyError || !data?.public_key) throw new Error(await invokeErrorMessage(keyError, data, "Não foi possível preparar o pagamento."));
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
            identificationNumber: { id: "connect-card-doc-number", placeholder: "Somente números" },
            cardholderEmail: { id: "connect-card-email", placeholder: "voce@email.com" },
          },
          callbacks: {
            onFormMounted: (mountError: unknown) => {
              if (mountError) {
                formReadyRef.current = false;
                setError("Não foi possível carregar os campos seguros do cartão. Atualize a página e tente novamente.");
                setFormReady(false);
              } else {
                formReadyRef.current = true;
                setFormReady(true);
              }
              setLoading(false);
            },
            onSubmit: (event: Event) => {
              event.preventDefault();
              if (submittingRef.current || !instance || !formReadyRef.current) return;
              const token = instance.getCardFormData()?.token;
              if (!token) { setError("Confira os dados do cartão e tente novamente."); return; }
              submittingRef.current = true;
              setSubmitting(true);
              setError("");
              void supabase.functions.invoke("mercadopago-subscriptions", {
                body: { action: "create", planId: plan.id, cardTokenId: token },
              }).then(({ data: result, error: invokeError }) => {
                if (invokeError || !result?.success) throw new Error(result?.error || invokeError?.message || "O Mercado Pago não autorizou a assinatura.");
                onCompleteRef.current();
              }).catch((submitError: unknown) => {
                setError(submitError instanceof Error ? submitError.message : "Não foi possível concluir a assinatura.");
                submittingRef.current = false;
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
      } catch (mountError) {
        if (!cancelled) {
          setError(mountError instanceof Error ? mountError.message : "Não foi possível abrir o checkout.");
          setLoading(false);
        }
      }
    }
    void mount();
    return () => { cancelled = true; formReadyRef.current = false; instance?.unmount?.(); };
  }, [plan.id, plan.price_brl]);

  const isAnnual = plan.billing_interval === "year";

  return (
    <section className="connect-pay-shell">
      <style>{`
        .connect-pay-shell{width:100%;max-width:1040px;margin:22px auto 34px;color:#29212a;font-family:inherit}
        .connect-pay-top{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:18px}
        .connect-pay-back{display:inline-flex;align-items:center;gap:8px;border:1px solid #eadfe1;background:#fff8f5;color:#6d6068;border-radius:12px;padding:10px 13px;font-size:13px;font-weight:750;cursor:pointer}
        .connect-pay-brand{display:flex;align-items:center;gap:9px;font-weight:950;letter-spacing:2px;font-size:16px}
        .connect-pay-brandmark{display:grid;place-items:center;width:34px;height:34px;border-radius:11px;background:#e94f68;box-shadow:0 7px 24px #e94f6822}
        .connect-pay-trust{display:flex;align-items:center;gap:9px;padding:11px 14px;border:1px solid #d5e8da;background:#eff8f1;border-radius:14px;color:#477653;font-size:12px;font-weight:750}
        .connect-pay-layout{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(270px,.8fr);gap:18px;align-items:start}
        .connect-pay-panel{border:1px solid #e0e4db;background:#ffffff;border-radius:23px;box-shadow:0 22px 70px rgba(32,36,58,.08);overflow:hidden}
        .connect-pay-main{padding:clamp(18px,3vw,30px)}
        .connect-pay-heading{font-size:clamp(22px,3vw,29px);font-weight:900;letter-spacing:-.8px;margin:0}
        .connect-pay-sub{font-size:13px;color:#786d75;line-height:1.6;margin:8px 0 22px}
        .connect-pay-steps{display:flex;align-items:center;gap:10px;margin:0 0 24px;color:#786d75;font-size:11px;font-weight:800;letter-spacing:.5px;text-transform:uppercase}
        .connect-pay-step{display:flex;align-items:center;gap:7px}
        .connect-pay-stepnum{display:grid;place-items:center;width:23px;height:23px;border-radius:50%;background:#e94f68;color:white;font-size:11px}
        .connect-pay-line{height:1px;max-width:42px;flex:1;background:#e0e4db}
        .connect-pay-label{display:block;color:#4f424b;font-size:12px;font-weight:750;margin:0 0 7px}
        .connect-pay-field{width:100%;min-height:47px;box-sizing:border-box;border:1px solid #eadfe1;border-radius:12px;background:#fffafa;padding:11px 13px;color:#29212a;outline:none;transition:border .18s,box-shadow .18s}
        .connect-pay-field:focus{border-color:#ff6b84;box-shadow:0 0 0 3px #ff6b8420}
        .connect-pay-mpfield{min-height:47px;border:1px solid #eadfe1;border-radius:12px;background:#fffafa;padding:11px 13px;color:#29212a;box-sizing:border-box}
        .connect-pay-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .connect-pay-fieldgroup{display:grid;gap:7px;margin-bottom:15px;min-width:0}
        .connect-pay-submit{display:flex;justify-content:center;align-items:center;gap:10px;width:100%;border:0;border-radius:14px;padding:16px;background:linear-gradient(105deg,#e94f68,#a42c4a);box-shadow:0 12px 30px #e94f6822;color:white;font-size:14px;font-weight:900;cursor:pointer;transition:transform .18s,filter .18s}
        .connect-pay-submit:hover:not(:disabled){transform:translateY(-1px);filter:brightness(1.08)}
        .connect-pay-submit:disabled{opacity:.58;cursor:not-allowed;box-shadow:none}
        .connect-pay-summary{padding:24px;position:relative;background:#f2f2ff}
        .connect-pay-plan{padding:17px;border:1px solid #e0e4db;background:#fff8f5;border-radius:17px;margin:18px 0}
        .connect-pay-price{font-size:32px;font-weight:950;letter-spacing:-1.2px;margin-top:7px}
        .connect-pay-benefit{display:flex;align-items:flex-start;gap:9px;color:#777c91;font-size:12px;line-height:1.5;margin:13px 0}
        .connect-pay-check{display:grid;place-items:center;width:18px;height:18px;flex:0 0 18px;border-radius:50%;background:#4d946b;color:#ffffff}
        .connect-pay-security{border-top:1px solid #e0e4db;margin-top:22px;padding-top:18px}
        .connect-pay-mp{display:flex;align-items:center;gap:10px;padding:12px;border-radius:13px;background:#e8f0e6;border:1px solid #d1e1cf;color:#49644f}
        .connect-pay-mpicon{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#315f49;color:white}
        .connect-pay-note{color:#786d75;font-size:11px;line-height:1.6;margin:12px 0 0}
        .connect-pay-error{padding:12px 14px;border-radius:12px;background:#fff0f1;border:1px solid #f1d4d8;color:#c65362;font-size:12px;line-height:1.5;margin:4px 0 14px}
        .connect-pay-foot{display:flex;justify-content:center;align-items:center;gap:7px;color:#a0a3b0;font-size:10px;margin-top:16px;text-align:center}
        @media(max-width:720px){.connect-pay-shell{max-width:100%;margin:0 auto 18px}.connect-pay-layout{grid-template-columns:minmax(0,1fr);gap:10px}.connect-pay-main{padding:15px}.connect-pay-panel{border-radius:17px}.connect-pay-summary{order:1;padding:13px;border-radius:16px}.connect-pay-top{align-items:center;flex-wrap:nowrap;margin-bottom:10px}.connect-pay-brand{font-size:14px}.connect-pay-brandmark{width:30px;height:30px}.connect-pay-back{padding:8px 10px;font-size:11px}.connect-pay-trust{width:100%;box-sizing:border-box;padding:9px 11px;font-size:10px;border-radius:11px}.connect-pay-plan{margin:9px 0;padding:12px}.connect-pay-price{font-size:25px}.connect-pay-benefit{font-size:10px;margin:8px 0}.connect-pay-security{margin-top:12px;padding-top:12px}.connect-pay-heading{font-size:21px}.connect-pay-sub{font-size:11px;margin:6px 0 12px}.connect-pay-steps{font-size:9px;gap:6px;margin-bottom:13px}.connect-pay-stepnum{width:20px;height:20px}.connect-pay-fieldgroup{gap:5px;margin-bottom:9px}.connect-pay-label{font-size:10px;margin-bottom:0}.connect-pay-field,.connect-pay-mpfield{min-height:40px;padding:8px 10px;border-radius:10px;font-size:16px}.connect-pay-grid2{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px}.connect-pay-main form{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;column-gap:9px}.connect-pay-main form>.connect-pay-fieldgroup:nth-of-type(1),.connect-pay-main form>.connect-pay-grid2,.connect-pay-main form>.connect-pay-fieldgroup:nth-of-type(2),.connect-pay-main form>.connect-pay-fieldgroup:nth-of-type(3),.connect-pay-main form>.connect-pay-fieldgroup:nth-of-type(4),.connect-pay-main form>progress,.connect-pay-main form>.connect-pay-error,.connect-pay-main form>.connect-pay-submit{grid-column:1/-1}.connect-pay-submit{min-height:44px;padding:11px;font-size:12px;border-radius:11px}.connect-pay-foot{font-size:9px;margin-top:11px}.connect-pay-summary>div:first-child{font-size:9px!important}.connect-pay-plan>div:first-child span:first-child{font-size:12px!important}}
        @media(max-width:390px){.connect-pay-grid2{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:7px}.connect-pay-steps{font-size:8px;gap:4px}.connect-pay-step{gap:4px}.connect-pay-stepnum{width:18px;height:18px}.connect-pay-main{padding:13px}.connect-pay-field,.connect-pay-mpfield{min-height:38px;padding:7px 9px}.connect-pay-shell{margin-bottom:12px}}

        .connect-pay-main{min-width:0}
        .connect-pay-main form{min-width:0}
        .connect-pay-fieldgroup,.connect-pay-grid2{min-width:0}
        .connect-pay-mpfield{height:46px;min-height:46px;max-height:46px;overflow:hidden;padding:0 10px;display:flex;align-items:center}
        .connect-pay-mpfield iframe{display:block;width:100%!important;height:44px!important;min-height:44px!important;max-height:44px!important;border:0!important}
        .connect-pay-field,.connect-pay-mpfield{font-size:16px;line-height:1.2}
        @media(max-width:720px){
          .connect-pay-shell{margin:0 auto 12px}
          .connect-pay-top{margin-bottom:8px}
          .connect-pay-layout{gap:8px}
          .connect-pay-main{padding:13px}
          .connect-pay-panel{border-radius:15px}
          .connect-pay-trust{gap:7px;padding:8px 10px;font-size:10px}
          .connect-pay-mpfield{height:40px;min-height:40px;max-height:40px;padding:0 8px}
          .connect-pay-mpfield iframe{height:38px!important;min-height:38px!important;max-height:38px!important}
          .connect-pay-field{height:40px;min-height:40px}
          .connect-pay-summary{padding:12px}
          .connect-pay-plan{padding:11px}
          .connect-pay-security{margin-top:10px;padding-top:10px}
          .connect-pay-foot{margin-top:9px}
        }
        @media(max-width:380px){
          .connect-pay-main{padding:11px}
          .connect-pay-steps{letter-spacing:0}
          .connect-pay-mpfield{height:38px;min-height:38px;max-height:38px}
          .connect-pay-mpfield iframe{height:36px!important;min-height:36px!important;max-height:36px!important}
        }

      `}</style>

      <div className="connect-pay-top">
        <button type="button" className="connect-pay-back" disabled={submitting} onClick={onBack}><ArrowLeft size={16}/> Voltar</button>
        <div className="connect-pay-brand"><span className="connect-pay-brandmark"><Sparkles size={18}/></span> CONNECT</div>
      </div>

      <div className="connect-pay-trust">
        <ShieldCheck size={19}/>
        <span>Checkout protegido</span>
        <span style={{ color: "#6e9d91" }}>•</span>
        <span>Pagamento processado pelo Mercado Pago</span>
      </div>

      <div className="connect-pay-layout" style={{ marginTop: 16 }}>
        <div className="connect-pay-panel">
          <div className="connect-pay-main">
            <div className="connect-pay-steps">
              <span className="connect-pay-step"><span className="connect-pay-stepnum">1</span> Seus dados</span>
              <span className="connect-pay-line"/>
              <span className="connect-pay-step"><span className="connect-pay-stepnum">2</span> Pagamento</span>
              <span className="connect-pay-line"/>
              <span className="connect-pay-step" style={{ opacity: .55 }}><span className="connect-pay-stepnum" style={{ background: "#314b3b" }}>3</span> Confirmação</span>
            </div>
            <h2 className="connect-pay-heading">Finalize sua assinatura</h2>
            <p className="connect-pay-sub">Falta pouco para desbloquear sua experiência CONNECT. Seus dados são protegidos durante todo o pagamento.</p>

            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 18, padding: "11px 13px", borderRadius: 12, background: "#203b2d", border: "1px solid #6d967855", color: "#d8ead7", fontSize: 12 }}>
              <LockKeyhole size={16}/>
              <span><strong>Ambiente seguro</strong> · campos do cartão fornecidos pelo Mercado Pago</span>
            </div>

            <form id="connect-card-checkout" style={{ display: "grid", gap: 0 }}>
              <div className="connect-pay-fieldgroup">
                <label className="connect-pay-label" htmlFor="connect-card-number">Número do cartão</label>
                <div id="connect-card-number" className="connect-pay-mpfield"/>
              </div>
              <div className="connect-pay-grid2">
                <div className="connect-pay-fieldgroup">
                  <label className="connect-pay-label" htmlFor="connect-card-expiry">Validade</label>
                  <div id="connect-card-expiry" className="connect-pay-mpfield"/>
                </div>
                <div className="connect-pay-fieldgroup">
                  <label className="connect-pay-label" htmlFor="connect-card-cvv">Código de segurança</label>
                  <div id="connect-card-cvv" className="connect-pay-mpfield"/>
                </div>
              </div>
              <div className="connect-pay-fieldgroup">
                <label className="connect-pay-label" htmlFor="connect-card-name">Nome impresso no cartão</label>
                <input id="connect-card-name" autoComplete="cc-name" placeholder="Como aparece no cartão" className="connect-pay-field"/>
              </div>
              <div className="connect-pay-fieldgroup">
                <label className="connect-pay-label" htmlFor="connect-card-doc-number">CPF do titular</label>
                <div className="connect-pay-grid2">
                  <select id="connect-card-doc-type" className="connect-pay-field" aria-label="Tipo de documento"/>
                  <input id="connect-card-doc-number" inputMode="numeric" autoComplete="off" placeholder="Somente números" className="connect-pay-field"/>
                </div>
              </div>
              <div className="connect-pay-fieldgroup">
                <label className="connect-pay-label" htmlFor="connect-card-email">E-mail para recibos e atualizações</label>
                <input id="connect-card-email" type="email" autoComplete="email" placeholder="voce@email.com" className="connect-pay-field"/>
              </div>
              <div className="connect-pay-fieldgroup">
                <label className="connect-pay-label" htmlFor="connect-card-issuer">Banco emissor</label>
                <select id="connect-card-issuer" className="connect-pay-field"/>
              </div>
              <div className="connect-pay-fieldgroup">
                <label className="connect-pay-label" htmlFor="connect-card-installments">Parcelas</label>
                <select id="connect-card-installments" className="connect-pay-field"/>
              </div>
              <progress id="connect-card-progress" value="0" max="100" style={{ width: "100%", height: 3, accentColor: "#6b9976", margin: "0 0 13px" }}/>
              {error && <div role="alert" className="connect-pay-error">{error}</div>}
              <button type="submit" disabled={loading || submitting || !formReady} className="connect-pay-submit">
                {loading || submitting ? <><LoaderCircle size={18} className="animate-spin"/>{loading ? "Preparando pagamento seguro..." : "Enviando para aprovação..."}</> : <>Confirmar assinatura <ShieldCheck size={18}/></>}
              </button>
            </form>
            <div className="connect-pay-foot"><LockKeyhole size={12}/> Conexão protegida · Seus dados financeiros não ficam armazenados no CONNECT</div>
          </div>
        </div>

        <aside className="connect-pay-panel connect-pay-summary">
          <div style={{ color: "#8c9a8f", fontSize: 11, fontWeight: 850, letterSpacing: 1.4, textTransform: "uppercase" }}>Resumo do pedido</div>
          <div className="connect-pay-plan">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#4f424b", fontSize: 14, fontWeight: 850 }}>{plan.name || "CONNECT Premium"}</span>
              <span style={{ borderRadius: 20, padding: "5px 9px", background: "#315f5024", color: "#dce78b", fontSize: 9, fontWeight: 900, letterSpacing: .7 }}>PREMIUM</span>
            </div>
            <div className="connect-pay-price">{money(Number(plan.price_brl))}</div>
            <div style={{ color: "#786d75", fontSize: 12, marginTop: 4 }}>por {periodLabel(plan.billing_interval)}</div>
            <div style={{ height: 1, background: "#e0e4db", margin: "17px 0 13px" }}/>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#786d75", fontSize: 12, marginBottom: 9 }}><span>Plano</span><span style={{ color: "#29212a" }}>{plan.name || "CONNECT Premium"}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#786d75", fontSize: 12 }}><span>Cobrança</span><span style={{ color: "#29212a" }}>{isAnnual ? "Anual" : "Mensal"}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#786d75", fontSize: 12, marginTop: 13, paddingTop: 13, borderTop: "1px solid #e0e4db" }}><strong style={{ color: "#29212a" }}>Total</strong><strong style={{ color: "#29212a", fontSize: 16 }}>{money(Number(plan.price_brl))}</strong></div>
          </div>

          <div style={{ color: "#e8eee5", fontSize: 13, fontWeight: 850, marginBottom: 5 }}>O que está incluído</div>
          {["Acesso aos benefícios do plano Premium", "Recursos exclusivos do CONNECT", "Assinatura vinculada à sua conta"].map((item) => <div className="connect-pay-benefit" key={item}><span className="connect-pay-check"><Check size={12}/></span><span>{item}</span></div>)}

          <div className="connect-pay-security">
            <div className="connect-pay-mp">
              <span className="connect-pay-mpicon"><ShieldCheck size={20}/></span>
              <span><strong style={{ display: "block", fontSize: 12, letterSpacing: .1 }}>Mercado Pago</strong><span style={{ display: "block", fontSize: 10, color: "#66816c", marginTop: 2 }}>Tecnologia de pagamento segura</span></span>
            </div>
            <p className="connect-pay-note">O pagamento é processado pelo Mercado Pago. Os campos sensíveis do cartão são carregados pelo SDK oficial do provedor; o CONNECT não recebe o número completo nem o código de segurança.</p>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 14, color: "#786d75", fontSize: 11 }}><ShieldCheck size={15} color="#4d946b"/> <span>Proteção de dados durante o pagamento</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 9, color: "#786d75", fontSize: 11 }}><CreditCard size={15} color="#e94f68"/> <span>{isAnnual ? "Renovação a cada 12 meses" : "Renovação mensal"}</span></div>
          </div>
        </aside>
      </div>
    </section>
  );
}

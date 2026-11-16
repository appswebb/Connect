import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function secretKey() {
  const plural = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (plural) {
    try { const parsed = JSON.parse(plural); if (parsed.default) return parsed.default as string; } catch { /* legacy fallback */ }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
  const key = secretKey();
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!accessToken || !key || !supabaseUrl) return json({ error: "Integração ainda não configurada: faltam secrets do Mercado Pago ou Supabase." }, 503);

  const auth = req.headers.get("Authorization") || "";
  const jwt = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!jwt) return json({ error: "Faça login para continuar." }, 401);

  const admin = createClient(supabaseUrl, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await admin.auth.getUser(jwt);
  const user = userData.user;
  if (userError || !user) return json({ error: "Sessão inválida. Entre novamente." }, 401);

  let body: { action?: string; planId?: string; subscriptionId?: string; recipientId?: string };
  try { body = await req.json(); } catch { return json({ error: "Corpo da requisição inválido." }, 400); }

  if (body.action === "cancel") {
    if (!body.subscriptionId) return json({ error: "Assinatura não informada." }, 400);
    const { data: row, error } = await admin.from("connect_subscriptions")
      .select("id,user_id,provider_subscription_id,status,current_period_end")
      .eq("id", body.subscriptionId).eq("user_id", user.id).maybeSingle();
    if (error || !row) return json({ error: "Assinatura não encontrada." }, 404);
    if (!row.provider_subscription_id) return json({ error: "Essa assinatura ainda não foi criada no Mercado Pago." }, 409);
    const mpResponse = await fetch("https://api.mercadopago.com/preapproval/" + encodeURIComponent(row.provider_subscription_id), {
      method: "PUT",
      headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    const mpData = await mpResponse.json().catch(() => ({}));
    if (!mpResponse.ok) return json({ error: mpData.message || "O Mercado Pago não conseguiu cancelar a assinatura." }, 502);
    const { error: updateError } = await admin.from("connect_subscriptions")
      .update({ status: "cancelled", cancel_at_period_end: true, updated_at: new Date().toISOString() })
      .eq("id", row.id).eq("user_id", user.id);
    if (updateError) return json({ error: "Cancelada no Mercado Pago, mas falhou ao atualizar o CONNECT. Contate o suporte." }, 500);
    return json({ success: true, current_period_end: row.current_period_end });
  }

  if (body.action === "gift_create") {
    if (!body.planId || !body.recipientId) return json({ error: "Escolha o plano e quem vai receber." }, 400);
    if (body.recipientId === user.id) return json({ error: "Você não pode presentear a si mesmo." }, 400);
    if (!user.email) return json({ error: "Sua conta precisa ter um e-mail confirmado para presentear." }, 400);

    const { data: outgoing } = await admin.from("follows").select("followed_id")
      .eq("follower_id", user.id).eq("followed_id", body.recipientId).maybeSingle();
    const { data: incoming } = await admin.from("follows").select("follower_id")
      .eq("follower_id", body.recipientId).eq("followed_id", user.id).maybeSingle();
    if (!outgoing || !incoming) return json({ error: "Só é possível presentear alguém que segue você e que você também segue." }, 403);

    const { data: plan, error: planError } = await admin.from("connect_plans")
      .select("id,name,billing_interval,price_brl,active")
      .eq("id", body.planId).eq("active", true).maybeSingle();
    if (planError || !plan) return json({ error: "Plano indisponível para presente." }, 404);
    const amount = Number(plan.price_brl);
    if (!Number.isFinite(amount) || amount <= 0) return json({ error: "Preço do plano inválido." }, 409);

    const { data: gift, error: giftError } = await admin.from("subscription_gifts").insert({
      sender_id: user.id, recipient_id: body.recipientId, plan_id: plan.id,
      duration_days: plan.billing_interval === "year" ? 365 : 30,
      billing_interval: plan.billing_interval,
      amount_brl: amount, provider: "mercadopago", status: "pending",
    }).select("id").single();
    if (giftError || !gift) return json({ error: "Não foi possível registrar o presente." }, 500);

    const siteBase = Deno.env.get("CONNECT_SITE_URL") || "https://appswebb.github.io/Connect";
    const siteUrl = siteBase.endsWith("/") ? siteBase.slice(0, -1) : siteBase;
    const apiBase = supabaseUrl.endsWith("/") ? supabaseUrl.slice(0, -1) : supabaseUrl;
    const preferenceResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json", "X-Idempotency-Key": gift.id },
      body: JSON.stringify({
        items: [{ id: plan.id, title: "Presente CONNECT - " + (plan.billing_interval === "year" ? "1 ano" : "1 mês"), quantity: 1, currency_id: "BRL", unit_price: amount }],
        payer: { email: user.email },
        external_reference: gift.id,
        notification_url: apiBase + "/functions/v1/mercadopago-webhook",
        back_urls: {
          success: siteUrl + "/?payment=return&kind=subscription_gift&status=success",
          pending: siteUrl + "/?payment=return&kind=subscription_gift&status=pending",
          failure: siteUrl + "/?payment=return&kind=subscription_gift&status=failure",
        },
        auto_return: "approved",
        statement_descriptor: "CONNECT",
      }),
    });
    const preference = await preferenceResponse.json().catch(() => ({}));
    if (!preferenceResponse.ok || !preference.init_point) {
      await admin.from("subscription_gifts").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", gift.id);
      return json({ error: preference.message || "O Mercado Pago não conseguiu criar o pagamento do presente." }, 502);
    }
    const { error: saveError } = await admin.from("subscription_gifts")
      .update({ checkout_url: preference.init_point, updated_at: new Date().toISOString() }).eq("id", gift.id);
    if (saveError) return json({ error: "Checkout criado, mas não foi possível salvar o pagamento do presente." }, 500);
    return json({ init_point: preference.init_point, gift_id: gift.id, duration_days: plan.billing_interval === "year" ? 365 : 30 });
  }

  if (body.action !== "create" || !body.planId) return json({ error: "Ação ou plano inválido." }, 400);
  const { data: current } = await admin.from("connect_subscriptions")
    .select("id,status,checkout_url").eq("user_id", user.id)
    .in("status", ["pending", "authorized", "paused", "past_due"])
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (current?.status === "authorized") return json({ error: "Você já possui uma assinatura ativa. Cancele a renovação antes de contratar outro plano." }, 409);
  if (current?.status === "pending" && current.checkout_url) return json({ init_point: current.checkout_url, subscription_id: current.id });
  if (current) return json({ error: "Você já possui uma assinatura em andamento. Consulte o status antes de contratar outro plano." }, 409);

  const { data: plan, error: planError } = await admin.from("connect_plans")
    .select("id,name,description,billing_interval,price_brl,active")
    .eq("id", body.planId).eq("active", true).maybeSingle();
  if (planError || !plan) return json({ error: "Plano indisponível." }, 404);
  const amount = Number(plan.price_brl);
  if (!Number.isFinite(amount) || amount <= 0) return json({ error: "O preço deste plano ainda não foi configurado." }, 409);
  if (!user.email) return json({ error: "Sua conta precisa ter um e-mail confirmado para assinar." }, 400);

  const siteUrl = Deno.env.get("CONNECT_SITE_URL") || "https://appswebb.github.io/Connect";
  const backUrl = siteUrl.replace(/\/$/, "") + "/?payment=return";
  const externalReference = crypto.randomUUID();
  const { data: pending, error: insertError } = await admin.from("connect_subscriptions").insert({
    user_id: user.id, plan_id: plan.id, provider: "mercadopago", status: "pending",
  }).select("id").single();
  if (insertError || !pending) return json({ error: "Não foi possível iniciar a assinatura no banco." }, 500);

  const frequency = plan.billing_interval === "year" ? 12 : 1;
  const mpResponse = await fetch("https://api.mercadopago.com/preapproval", {
    method: "POST",
    headers: { Authorization: "Bearer " + accessToken, "Content-Type": "application/json", "X-Idempotency-Key": pending.id },
    body: JSON.stringify({
      reason: plan.name || "Pacote CONNECT - buscas ilimitadas",
      external_reference: pending.id,
      payer_email: user.email,
      auto_recurring: { frequency, frequency_type: "months", transaction_amount: amount, currency_id: "BRL" },
      back_url: backUrl,
    }),
  });
  const mpData = await mpResponse.json().catch(() => ({}));
  if (!mpResponse.ok || !mpData.id || !mpData.init_point) {
    await admin.from("connect_subscriptions").delete().eq("id", pending.id);
    return json({ error: mpData.message || "O Mercado Pago recusou a criação da assinatura." }, 502);
  }
  const { error: saveError } = await admin.from("connect_subscriptions").update({
    provider_subscription_id: String(mpData.id),
    checkout_url: mpData.init_point,
    status: mpData.status === "authorized" ? "authorized" : "pending",
    updated_at: new Date().toISOString(),
  }).eq("id", pending.id);
  if (saveError) return json({ error: "Checkout criado, mas não foi possível salvar a referência no CONNECT." }, 500);
  return json({ init_point: mpData.init_point, subscription_id: pending.id });
});

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
  if (plural) { try { const parsed = JSON.parse(plural); if (parsed.default) return parsed.default as string; } catch { /* legacy fallback */ } }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);
  const token = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
  const key = secretKey();
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!token || !key || !supabaseUrl) return json({ error: "Integração de pagamentos não configurada." }, 503);
  const auth = req.headers.get("Authorization") || "";
  const jwt = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!jwt) return json({ error: "Faça login para comprar moedas." }, 401);
  const admin = createClient(supabaseUrl, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await admin.auth.getUser(jwt);
  const user = authData.user;
  if (authError || !user) return json({ error: "Sessão inválida. Entre novamente." }, 401);
  let body: { packageId?: string };
  try { body = await req.json(); } catch { return json({ error: "Requisição inválida." }, 400); }
  if (!body.packageId) return json({ error: "Escolha um pacote de moedas." }, 400);
  const { data: pack, error: packError } = await admin.from("coin_packages")
    .select("id,name,coins,price_brl").eq("id", body.packageId).eq("active", true).maybeSingle();
  if (packError || !pack) return json({ error: "Pacote indisponível." }, 404);
  if (!user.email) return json({ error: "Sua conta precisa ter um e-mail para comprar." }, 400);

  const { data: order, error: orderError } = await admin.from("coin_orders").insert({
    user_id: user.id, package_id: pack.id, coins: pack.coins, amount_brl: pack.price_brl, status: "pending",
  }).select("id").single();
  if (orderError || !order) return json({ error: "Não foi possível criar o pedido." }, 500);

  const siteUrl = (Deno.env.get("CONNECT_SITE_URL") || "https://appswebb.github.io/Connect").replace(/\/$/, "");
  const webhookUrl = Deno.env.get("MERCADOPAGO_WEBHOOK_URL") || supabaseUrl.replace(/\/$/, "") + "/functions/v1/mercadopago-webhook";
  const preferenceResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json", "X-Idempotency-Key": order.id },
    body: JSON.stringify({
      items: [{ id: pack.id, title: pack.name, description: pack.coins + " moedas CONNECT", quantity: 1, currency_id: "BRL", unit_price: Number(pack.price_brl) }],
      payer: { email: user.email },
      external_reference: order.id,
      notification_url: webhookUrl,
      back_urls: {
        success: siteUrl + "/?payment=success&kind=coins",
        pending: siteUrl + "/?payment=pending&kind=coins",
        failure: siteUrl + "/?payment=failure&kind=coins",
      },
      auto_return: "approved",
      statement_descriptor: "CONNECT",
      metadata: { user_id: user.id, coin_order_id: order.id, package_id: pack.id },
    }),
  });
  const preference = await preferenceResponse.json().catch(() => ({}));
  if (!preferenceResponse.ok || !preference.id || !preference.init_point) {
    await admin.from("coin_orders").update({ status: "cancelled", raw_event: preference }).eq("id", order.id);
    return json({ error: preference.message || "O Mercado Pago não conseguiu criar o checkout." }, 502);
  }
  const { error: saveError } = await admin.from("coin_orders").update({
    provider_preference_id: String(preference.id), checkout_url: preference.init_point, updated_at: new Date().toISOString(),
  }).eq("id", order.id);
  if (saveError) return json({ error: "Checkout criado, mas não foi possível salvar o pedido." }, 500);
  return json({ init_point: preference.init_point, order_id: order.id });
});

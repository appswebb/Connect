import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function secretKey() {
  const plural = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (plural) {
    try { const parsed = JSON.parse(plural); if (parsed.default) return parsed.default as string; } catch { /* legacy fallback */ }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
}
function response(status = 200) {
  return new Response(status === 200 ? "ok" : "invalid", { status, headers: { "Content-Type": "text/plain" } });
}
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
async function validSignature(req: Request, dataId: string, secret: string) {
  const signature = req.headers.get("x-signature") || "";
  const requestId = req.headers.get("x-request-id") || "";
  const parts = Object.fromEntries(signature.split(",").map(part => {
    const [key, ...value] = part.trim().split("=");
    return [key, value.join("=")];
  }));
  if (!parts.ts || !parts.v1 || !dataId || !requestId) return false;
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
  const cryptoKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(manifest));
  const hash = [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
  return safeEqual(hash, parts.v1);
}
const statusMap: Record<string, string> = {
  authorized: "authorized", pending: "pending", paused: "paused",
  cancelled: "cancelled", canceled: "cancelled", expired: "expired",
};
async function syncEntitlement(admin: ReturnType<typeof createClient>, userId: string) {
  const { data: paid } = await admin.from("connect_payments").select("id")
    .eq("user_id", userId).eq("status", "approved").limit(1).maybeSingle();
  const { data } = paid ? await admin.from("connect_subscriptions")
    .select("status,current_period_end").eq("user_id", userId)
    .in("status", ["authorized", "cancelled"]).not("current_period_end", "is", null)
    .gt("current_period_end", new Date().toISOString())
    .order("current_period_end", { ascending: false }).limit(1).maybeSingle() : { data: null };
  const { data: existingEntitlement } = await admin.from("queue_entitlements")
    .select("unlimited_until").eq("user_id", userId).maybeSingle();
  const candidates = [data?.current_period_end, existingEntitlement?.unlimited_until]
    .filter(Boolean).map((value: string) => new Date(value).getTime()).filter(Number.isFinite);
  const until = new Date(Math.max(Date.now(), ...candidates)).toISOString();
  await admin.from("queue_entitlements").upsert({
    user_id: userId, unlimited_until: until, updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return response(405);
  const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
  const webhookSecret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");
  const key = secretKey();
  const url = Deno.env.get("SUPABASE_URL");
  if (!accessToken || !webhookSecret || !key || !url) return response(503);

  const incoming = await req.json().catch(() => ({}));
  const dataId = String(incoming?.data?.id || new URL(req.url).searchParams.get("data.id") || "");
  if (!await validSignature(req, dataId, webhookSecret)) return response(401);

  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const type = String(incoming?.type || incoming?.topic || "");
  if (type === "subscription_preapproval" || type === "preapproval") {
    const mpResponse = await fetch("https://api.mercadopago.com/preapproval/" + encodeURIComponent(dataId), {
      headers: { Authorization: "Bearer " + accessToken },
    });
    if (!mpResponse.ok) return response(502);
    const mp = await mpResponse.json();
    const { data: sub } = await admin.from("connect_subscriptions")
      .select("id,user_id,plan_id,current_period_end")
      .eq("id", String(mp.external_reference || "")).maybeSingle();
    if (!sub) return response(200);
    const mapped = statusMap[String(mp.status || "").toLowerCase()] || "past_due";
    const plan = await admin.from("connect_plans").select("billing_interval").eq("id", sub.plan_id).maybeSingle();
    const periodEnd = mp.next_payment_date || sub.current_period_end || (() => {
      const base = new Date(mp.auto_recurring?.start_date || mp.date_created || Date.now());
      if (plan.data?.billing_interval === "year") base.setFullYear(base.getFullYear() + 1);
      else base.setMonth(base.getMonth() + 1);
      return base.toISOString();
    })();
    const periodStart = mp.auto_recurring?.start_date || mp.date_created || new Date().toISOString();
    const { error } = await admin.from("connect_subscriptions").update({
      provider_subscription_id: String(mp.id), checkout_url: mp.init_point || null,
      status: mapped, current_period_start: periodStart, current_period_end: periodEnd,
      cancel_at_period_end: mapped === "cancelled", updated_at: new Date().toISOString(),
    }).eq("id", sub.id);
    if (error) return response(500);
    await syncEntitlement(admin, sub.user_id);
    return response(200);
  }

  if (type === "payment" || type === "subscription_authorized_payment") {
    const endpoint = type === "payment" ? "/v1/payments/" : "/authorized_payments/";
    const paymentResponse = await fetch("https://api.mercadopago.com" + endpoint + encodeURIComponent(dataId), {
      headers: { Authorization: "Bearer " + accessToken },
    });
    if (!paymentResponse.ok) return response(502);
    const payment = await paymentResponse.json();
    const externalReference = String(payment.external_reference || "");
    const { data: pixCheckout } = externalReference ? await admin.from("connect_pix_checkouts")
      .select("id,user_id,plan_id,amount_brl,duration_days,status")
      .eq("id", externalReference).maybeSingle() : { data: null };
    if (pixCheckout) {
      const paymentStatus = String(payment.status || "pending").toLowerCase();
      const paymentId = String(payment.id || dataId);
      if (Number(payment.transaction_amount || 0) !== Number(pixCheckout.amount_brl) || String(payment.currency_id || "") !== "BRL") return response(400);
      const mapped = ["approved","rejected","cancelled","refunded","charged_back"].includes(paymentStatus) ? paymentStatus : "pending";
      const { data: transitioned, error: updateError } = await admin.from("connect_pix_checkouts").update({
        status: mapped, provider_payment_id: paymentId, paid_at: payment.date_approved || null,
        updated_at: new Date().toISOString(),
      }).eq("id", pixCheckout.id).eq("status", "pending").select("id").maybeSingle();
      if (updateError) return response(500);
      if (paymentStatus === "approved" && transitioned) {
        const start = new Date();
        const end = new Date(start.getTime() + Number(pixCheckout.duration_days) * 86400000);
        const { data: current } = await admin.from("queue_entitlements").select("unlimited_until")
          .eq("user_id", pixCheckout.user_id).maybeSingle();
        const currentEnd = current?.unlimited_until ? new Date(current.unlimited_until) : start;
        const base = currentEnd > start ? currentEnd : start;
        const newEnd = new Date(base.getTime() + Number(pixCheckout.duration_days) * 86400000);
        const { error: entitlementError } = await admin.from("queue_entitlements").upsert({
          user_id: pixCheckout.user_id, unlimited_until: newEnd.toISOString(), updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
        if (entitlementError) return response(500);
      }
      return response(200);
    }
    const mpSubId = String(payment.preapproval_id || payment.subscription_id || "");
    if (!mpSubId) return response(200);
    const { data: sub } = await admin.from("connect_subscriptions")
      .select("id,user_id").eq("provider_subscription_id", mpSubId).maybeSingle();
    if (!sub) return response(200);
    const status = String(payment.status || "pending");
    const mapped = ["approved", "rejected", "cancelled", "refunded", "charged_back"].includes(status) ? status : "pending";
    const paymentId = String(payment.id || dataId);
    const { error } = await admin.from("connect_payments").upsert({
      subscription_id: sub.id, user_id: sub.user_id, provider: "mercadopago",
      provider_payment_id: paymentId, amount_brl: Number(payment.transaction_amount || 0),
      status: mapped, paid_at: payment.date_approved || null, raw_event: payment,
    }, { onConflict: "provider_payment_id" });
    if (error) return response(500);
    await syncEntitlement(admin, sub.user_id);
    return response(200);
  }
  return response(200);
});

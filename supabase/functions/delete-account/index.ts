import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ORIGIN = Deno.env.get("CONNECT_SITE_ORIGIN") || "https://appswebb.github.io";
const cors = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

function secretKey() {
  const plural = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (plural) { try { const p = JSON.parse(plural); if (p.default) return p.default as string; } catch { /* fallback */ } }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
}
function anonKey() {
  const plural = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (plural) { try { const p = JSON.parse(plural); if (p.default) return p.default as string; } catch { /* fallback */ } }
  return Deno.env.get("SUPABASE_ANON_KEY") || "";
}

// Limite por instância (best-effort); a senha obrigatória é a barreira principal.
const attempts = new Map<string, { n: number; t: number }>();
function limited(id: string) {
  const now = Date.now(); const a = attempts.get(id);
  if (!a || now - a.t > 15 * 60_000) { attempts.set(id, { n: 1, t: now }); return false; }
  a.n++; return a.n > 5;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  const url = Deno.env.get("SUPABASE_URL"); const key = secretKey();
  if (!url || !key) return json({ error: "Servidor não configurado." }, 503);
  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer /, "");
  if (!jwt) return json({ error: "Faça login para continuar." }, 401);

  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: ud, error: ue } = await admin.auth.getUser(jwt);
  const user = ud?.user;
  if (ue || !user) return json({ error: "Sessão inválida. Entre novamente." }, 401);

  let body: { password?: string; confirm?: string };
  try { body = await req.json(); } catch { return json({ error: "Requisição inválida." }, 400); }
  if (body.confirm !== "EXCLUIR") return json({ error: "Confirmação ausente." }, 400);
  if (typeof body.password !== "string" || !body.password) return json({ error: "Informe sua senha para confirmar." }, 400);
  if (limited(user.id)) return json({ error: "Muitas tentativas. Aguarde alguns minutos." }, 429);

  const { data: prof } = await admin.from("profiles").select("is_demo").eq("id", user.id).maybeSingle();
  if (prof?.is_demo) return json({ error: "Contas de demonstração não podem ser excluídas." }, 403);

  // Reautenticação por senha (cliente isolado, não afeta a sessão do usuário).
  if (!user.email) return json({ error: "Conta sem e-mail: contate o suporte." }, 400);
  const probe = createClient(url, anonKey(), { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: pwError } = await probe.auth.signInWithPassword({ email: user.email, password: body.password });
  if (pwError) return json({ error: "Senha incorreta." }, 403);

  // 1) Cancela assinaturas recorrentes no Mercado Pago. Se falhar, aborta (evita cobrar conta apagada).
  const { data: subs } = await admin.from("connect_subscriptions").select("id,provider_subscription_id,status")
    .eq("user_id", user.id).in("status", ["pending", "authorized", "paused", "past_due"]);
  const mpToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
  for (const s of subs || []) {
    if (!s.provider_subscription_id) continue;
    if (!mpToken) return json({ error: "Não foi possível cancelar sua assinatura agora. Tente mais tarde." }, 503);
    const r = await fetch("https://api.mercadopago.com/preapproval/" + encodeURIComponent(s.provider_subscription_id), {
      method: "PUT", headers: { Authorization: "Bearer " + mpToken, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "canceled" }),
    });
    if (!r.ok) return json({ error: "Não foi possível cancelar sua assinatura no Mercado Pago. Nada foi excluído; tente novamente." }, 502);
  }

  // 2) Lista arquivos antes de apagar (a lista depende de linhas que serão removidas).
  const { data: paths, error: pe } = await admin.rpc("list_user_storage_paths", { p_user: user.id });
  if (pe) return json({ error: "Falha ao preparar a exclusão." }, 500);

  // 3) Exclusão transacional no banco (inclui auth.users → sessões revogadas).
  const { error: de } = await admin.rpc("delete_account_data", { p_user: user.id, p_method: "self_service" });
  if (de) {
    if (de.message?.includes("PENDING_WITHDRAWAL")) return json({ error: "Você tem um saque em andamento. Aguarde a conclusão para excluir a conta." }, 409);
    return json({ error: "Não foi possível excluir a conta. Nada foi apagado." }, 500);
  }

  // 4) Remove arquivos; o que falhar vai para a fila de órfãos (reprocessada na próxima exclusão/cron).
  const byBucket = new Map<string, string[]>();
  for (const p of (paths || []) as { bucket_id: string; object_path: string }[]) {
    byBucket.set(p.bucket_id, [...(byBucket.get(p.bucket_id) || []), p.object_path]);
  }
  for (const [bucket, list] of byBucket) {
    for (let i = 0; i < list.length; i += 100) {
      const batch = list.slice(i, i + 100);
      const { error } = await admin.storage.from(bucket).remove(batch);
      if (error) await admin.from("orphaned_storage_objects").upsert(batch.map((object_path) => ({ bucket_id: bucket, object_path })), { onConflict: "bucket_id,object_path", ignoreDuplicates: true });
    }
  }
  // Reprocessa órfãos antigos (best-effort).
  const { data: orphans } = await admin.from("orphaned_storage_objects").select("id,bucket_id,object_path").limit(200);
  for (const o of orphans || []) {
    const { error } = await admin.storage.from(o.bucket_id).remove([o.object_path]);
    if (!error) await admin.from("orphaned_storage_objects").delete().eq("id", o.id);
  }
  return json({ success: true });
});

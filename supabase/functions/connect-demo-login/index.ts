import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.119.0";

const allowedOrigin = "https://appswebb.github.io";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
const attempts = new Map<string, { count: number; resetAt: number }>();
const demoEmail = "connect-demo@connect.invalid";

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  const headers = { ...corsHeaders, "Content-Type": "application/json" };
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers });
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (origin !== allowedOrigin) return json({ error: "Origin not allowed" }, 403);
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const attempt = attempts.get(ip);
  if (attempt && attempt.resetAt > now && attempt.count >= 8) {
    return json({ error: "Muitas tentativas. Aguarde um minuto e tente novamente." }, 429);
  }
  if (!attempt || attempt.resetAt <= now) attempts.set(ip, { count: 1, resetAt: now + 60_000 });
  else attempts.set(ip, { count: attempt.count + 1, resetAt: attempt.resetAt });

  let body: { username?: string; password?: string };
  try { body = await req.json(); } catch { return json({ error: "Dados inválidos." }, 400); }
  if (body.username !== "l" || body.password !== "l") {
    return json({ error: "Usuário ou senha de demonstração incorretos." }, 401);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");
  const legacySecret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const publishableKeysRaw = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  const legacyPublishable = Deno.env.get("SUPABASE_ANON_KEY");
  let secretKey = legacySecret || "";
  let publishableKey = legacyPublishable || "";
  try {
    if (!secretKey && secretKeysRaw) secretKey = JSON.parse(secretKeysRaw).default || "";
    if (!publishableKey && publishableKeysRaw) publishableKey = JSON.parse(publishableKeysRaw).default || "";
  } catch { return json({ error: "Configuração segura do Supabase inválida." }, 503); }
  if (!url || !secretKey || !publishableKey) {
    return json({ error: "As chaves internas do Supabase não estão disponíveis para o acesso de demonstração." }, 503);
  }

  const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const publicClient = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listed.error) throw listed.error;
    let demo = listed.data.users.find(user => user.email?.toLowerCase() === demoEmail);

    if (!demo) {
      const created = await admin.auth.admin.createUser({
        email: demoEmail,
        password: crypto.randomUUID() + "Aa9!",
        email_confirm: true,
        user_metadata: {
          display_name: "Demonstração CONNECT",
          username: "connect_demo",
          gender: "prefer_not_to_say",
          looking_for: ["__demo__"],
        },
        app_metadata: { connect_demo: true },
      });
      if (created.error) throw created.error;
      demo = created.data.user;
    } else {
      const updated = await admin.auth.admin.updateUserById(demo.id, {
        app_metadata: { ...(demo.app_metadata || {}), connect_demo: true },
      });
      if (updated.error) throw updated.error;
    }

    const link = await admin.auth.admin.generateLink({ type: "magiclink", email: demoEmail });
    if (link.error || !link.data.properties?.hashed_token) throw link.error || new Error("Não foi possível gerar a sessão.");
    const verified = await publicClient.auth.verifyOtp({
      token_hash: link.data.properties.hashed_token,
      type: "magiclink",
    });
    if (verified.error || !verified.data.session) throw verified.error || new Error("Não foi possível iniciar a sessão.");
    return json({
      access_token: verified.data.session.access_token,
      refresh_token: verified.data.session.refresh_token,
      expires_in: verified.data.session.expires_in,
      token_type: verified.data.session.token_type,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Falha ao abrir a demonstração." }, 500);
  }
});

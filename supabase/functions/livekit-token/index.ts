import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.119.0";
import { AccessToken } from "npm:livekit-server-sdk@2.19.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://appswebb.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const livekitUrl = Deno.env.get("LIVEKIT_URL");
  const livekitApiKey = Deno.env.get("LIVEKIT_API_KEY");
  const livekitApiSecret = Deno.env.get("LIVEKIT_API_SECRET");

  if (!supabaseUrl || !supabaseAnonKey) return json({ error: "Supabase environment is not configured" }, 503);
  if (!livekitUrl || !livekitApiKey || !livekitApiSecret) {
    return json({ error: "LIVEKIT_NOT_CONFIGURED: Configure LIVEKIT_URL, LIVEKIT_API_KEY and LIVEKIT_API_SECRET in Supabase Edge Function secrets." }, 503);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const tokenValue = authorization.slice("Bearer ".length);
  const { data: authData, error: authError } = await supabase.auth.getUser(tokenValue);
  if (authError || !authData.user) return json({ error: "Invalid session" }, 401);

  let body: { action?: string; live_id?: string };
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  if (body.action === "check") return json({ ready: true });
  if (!body.live_id || !/^[0-9a-f-]{36}$/i.test(body.live_id)) return json({ error: "Invalid live_id" }, 400);

  const { data: live, error: liveError } = await supabase
    .from("live_sessions")
    .select("id, host_user_id, room_name, status")
    .eq("id", body.live_id)
    .eq("status", "live")
    .maybeSingle();
  if (liveError || !live) return json({ error: "Live not found or already ended" }, 404);

  const isHost = live.host_user_id === authData.user.id;
  let canPublish = isHost;
  if (!isHost) {
    const { data: guestRequest, error: guestError } = await supabase
      .from("live_guest_requests")
      .select("status")
      .eq("live_id", live.id)
      .eq("user_id", authData.user.id)
      .eq("status", "accepted")
      .maybeSingle();
    if (guestError) return json({ error: "Could not verify guest permission" }, 500);
    canPublish = !!guestRequest;
  }
  const access = new AccessToken(livekitApiKey, livekitApiSecret, {
    identity: authData.user.id,
    ttl: "2h",
  });
  access.addGrant({
    roomJoin: true,
    room: live.room_name,
    canSubscribe: true,
    canPublish: isHost,
    canPublishData: isHost,
  });
  return json({ token: await access.toJwt(), server_url: livekitUrl, is_host: isHost, can_publish: canPublish });
});
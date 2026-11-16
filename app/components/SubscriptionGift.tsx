"use client";

import { useEffect, useState } from "react";
import { Gift, LoaderCircle, Search, Users } from "lucide-react";
import { supabase } from "../lib/supabase";

type Plan = { id: string; name: string; billing_interval: "month" | "year"; price_brl: number };
type Friend = { id: string; username: string; display_name: string; avatar_url: string | null };

const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function SubscriptionGift() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [planId, setPlanId] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) { if (active) setLoading(false); return; }
      const [planResult, followingResult, followersResult] = await Promise.all([
        supabase.from("connect_plans").select("id,name,billing_interval,price_brl").eq("active", true).gt("price_brl", 0).order("price_brl"),
        supabase.from("follows").select("followed_id").eq("follower_id", user.id),
        supabase.from("follows").select("follower_id").eq("followed_id", user.id),
      ]);
      if (!active) return;
      if (planResult.error) setMessage("Não foi possível carregar os planos: " + planResult.error.message);
      else {
        const available = (planResult.data || []) as Plan[];
        setPlans(available);
        setPlanId(old => old || available[0]?.id || "");
      }
      if (followingResult.error || followersResult.error) {
        setMessage("Não foi possível consultar suas amizades.");
      } else {
        const followers = new Set((followersResult.data || []).map((x: any) => x.follower_id));
        const mutualIds = [...new Set((followingResult.data || []).map((x: any) => x.followed_id).filter((id: string) => followers.has(id)))];
        if (mutualIds.length) {
          const { data, error } = await supabase.from("profiles").select("id,username,display_name,avatar_url").in("id", mutualIds).order("display_name");
          if (error) setMessage("Não foi possível carregar seus amigos: " + error.message);
          else setFriends((data || []) as Friend[]);
        } else setFriends([]);
      }
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, []);

  const filtered = friends.filter(friend => {
    const q = search.trim().replace(/^@/, "").toLowerCase();
    return !q || friend.username.toLowerCase().includes(q) || friend.display_name.toLowerCase().includes(q);
  });
  const selectedPlan = plans.find(plan => plan.id === planId);

  async function gift() {
    if (!planId || !recipientId) { setMessage("Escolha o plano e o amigo que vai receber."); return; }
    setBusy(true); setMessage("");
    try {
      const { data, error } = await supabase.functions.invoke("mercadopago-subscriptions", {
        body: { action: "gift_create", planId, recipientId },
      });
      if (error) throw error;
      if (!data?.init_point) throw new Error(data?.error || "O Mercado Pago não retornou o checkout.");
      window.location.assign(data.init_point);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível criar o presente.");
      setBusy(false);
    }
  }

  return <section style={{ display: "grid", gap: 14, border: "1px solid var(--border,#dedfe5)", borderRadius: 16, padding: 18, background: "var(--card,#fff)" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}><Gift size={20}/><div><strong>Presentear com CONNECT</strong><p style={{ margin: "4px 0 0", color: "var(--muted,#777)", fontSize: 13 }}>Pagamento único. Seu amigo recebe o período completo, sem renovação automática.</p></div></div>
    {loading ? <div style={{ display: "flex", alignItems: "center", gap: 8 }}><LoaderCircle size={17}/> Carregando planos e amigos...</div> : <>
      {!plans.length ? <p style={{ margin: 0, color: "var(--muted,#777)" }}>Os presentes de assinatura estarão disponíveis assim que os preços dos pacotes forem ativados.</p> : <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10 }}>
          {plans.map(plan => <button key={plan.id} type="button" onClick={() => setPlanId(plan.id)} aria-pressed={planId === plan.id} style={{ textAlign: "left", padding: 13, borderRadius: 12, border: planId === plan.id ? "2px solid #7664e8" : "1px solid var(--border,#ddd)", background: "var(--card,#fff)", cursor: "pointer" }}>
            <strong>{plan.billing_interval === "month" ? "1 mês" : "1 ano"}</strong><div style={{ marginTop: 5, fontWeight: 800 }}>{money(Number(plan.price_brl))}</div><small style={{ color: "var(--muted,#777)" }}>Pagamento único</small>
          </button>)}
        </div>
        <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 700 }}>Escolha um amigo que segue você e que você também segue
          <span style={{ display: "flex", alignItems: "center", gap: 7, border: "1px solid var(--border,#ddd)", borderRadius: 10, padding: "0 10px" }}><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou @usuário" style={{ border: 0, outline: 0, flex: 1, padding: 11, background: "transparent", color: "inherit" }}/></span>
        </label>
        {filtered.length ? <div style={{ display: "grid", gap: 7, maxHeight: 220, overflowY: "auto" }}>{filtered.map(friend => <button key={friend.id} type="button" onClick={() => setRecipientId(friend.id)} aria-pressed={recipientId === friend.id} style={{ display: "flex", alignItems: "center", gap: 10, textAlign: "left", border: recipientId === friend.id ? "2px solid #7664e8" : "1px solid var(--border,#ddd)", borderRadius: 10, padding: 9, background: "var(--card,#fff)", color: "inherit", cursor: "pointer" }}>
          {friend.avatar_url ? <img src={friend.avatar_url} alt="" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover" }}/> : <span style={{ width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center", background: "var(--border,#ddd)" }}><Users size={16}/></span>}
          <span><strong>{friend.display_name}</strong><small style={{ display: "block", color: "var(--muted,#777)" }}>@{friend.username}</small></span>
          {recipientId === friend.id && <strong style={{ marginLeft: "auto" }}>✓</strong>}
        </button>)}</div> : <p style={{ color: "var(--muted,#777)", margin: 0, fontSize: 13 }}>{friends.length ? "Nenhum amigo encontrado." : "Você ainda não tem amigos com seguimento mútuo. Os dois precisam se seguir."}</p>}
        <button type="button" disabled={busy || !recipientId || !selectedPlan} onClick={() => void gift()} style={{ border: 0, borderRadius: 10, padding: 13, background: "#6c5ce7", color: "white", fontWeight: 800, cursor: "pointer", opacity: busy || !recipientId ? .55 : 1 }}>{busy ? "Abrindo pagamento..." : "Presentear com pagamento único"}</button>
      </>}
    </>}
    {message && <p role="status" style={{ margin: 0, color: "#a33" }}>{message}</p>}
  </section>;
}

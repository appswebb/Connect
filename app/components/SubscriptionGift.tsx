"use client";

import { useEffect, useState } from "react";
import { Gift, LoaderCircle, Search, Users, X } from "lucide-react";
import { supabase } from "../lib/supabase";

type Plan = {
  id: string;
  name: string;
  billing_interval: "month" | "year";
  price_brl: number;
};
type Friend = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

const money = (value: number) => new Intl.NumberFormat("pt-BR", {
  style: "currency", currency: "BRL",
}).format(value);

export default function SubscriptionGift({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [recipientId, setRecipientId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    async function loadFriends() {
      setLoading(true);
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        if (active) {
          setMessage("Entre na sua conta para presentear alguém.");
          setLoading(false);
        }
        return;
      }
      const [followingResult, followersResult] = await Promise.all([
        supabase.from("follows").select("followed_id").eq("follower_id", user.id),
        supabase.from("follows").select("follower_id").eq("followed_id", user.id),
      ]);
      if (!active) return;
      if (followingResult.error || followersResult.error) {
        setMessage("Não foi possível consultar quem segue você e quem você segue.");
        setLoading(false);
        return;
      }
      const followers = new Set((followersResult.data || []).map(row => row.follower_id));
      const mutualIds = [...new Set((followingResult.data || [])
        .map(row => row.followed_id)
        .filter((id: string) => followers.has(id)))];
      if (mutualIds.length) {
        const { data, error } = await supabase.from("profiles")
          .select("id,username,display_name,avatar_url")
          .in("id", mutualIds)
          .order("display_name");
        if (!active) return;
        if (error) setMessage("Não foi possível carregar seus amigos: " + error.message);
        else setFriends((data || []) as Friend[]);
      } else {
        setFriends([]);
      }
      if (active) setLoading(false);
    }
    void loadFriends();
    return () => { active = false; };
  }, []);

  const filtered = friends.filter(friend => {
    const q = search.trim().replace(/^@/, "").toLowerCase();
    return !q || (friend.username || "").toLowerCase().includes(q)
      || (friend.display_name || "").toLowerCase().includes(q);
  });
  const duration = plan.billing_interval === "month" ? "1 mês" : "1 ano";

  async function gift() {
    if (!recipientId) {
      setMessage("Escolha o amigo que vai receber o pacote.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const { data, error } = await supabase.functions.invoke("mercadopago-subscriptions", {
        body: { action: "gift_create", planId: plan.id, recipientId },
      });
      if (error) throw error;
      if (!data?.init_point) throw new Error(data?.error || "O Mercado Pago não retornou o checkout.");
      window.location.assign(data.init_point);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível criar o presente.");
      setBusy(false);
    }
  }

  return <section style={{ display: "grid", gap: 13, border: "1px solid var(--border,#dedfe5)", borderRadius: 14, padding: 16, background: "var(--card,#fff)" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <Gift size={20}/>
        <div>
          <strong>Presentear com {plan.name}</strong>
          <p style={{ margin: "4px 0 0", color: "var(--muted,#777)", fontSize: 13 }}>{duration} por {money(Number(plan.price_brl))}. Pagamento único, sem renovação para quem recebe.</p>
        </div>
      </div>
      <button type="button" onClick={onClose} aria-label="Fechar" style={{ border: "1px solid var(--border,#ddd)", borderRadius: 9, padding: 8, background: "transparent", cursor: "pointer" }}><X size={16}/></button>
    </div>
    <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 700 }}>
      Escolha um amigo que segue você e que você também segue
      <span style={{ display: "flex", alignItems: "center", gap: 7, border: "1px solid var(--border,#ddd)", borderRadius: 10, padding: "0 10px" }}>
        <Search size={16}/>
        <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por nome ou @usuário" style={{ border: 0, outline: 0, flex: 1, padding: 11, background: "transparent", color: "inherit" }}/>
      </span>
    </label>
    {loading ? <div style={{ display: "flex", alignItems: "center", gap: 8 }}><LoaderCircle size={17}/> Carregando amigos...</div> : filtered.length ? (
      <div style={{ display: "grid", gap: 7, maxHeight: 220, overflowY: "auto" }}>
        {filtered.map(friend => <button key={friend.id} type="button" onClick={() => setRecipientId(friend.id)} aria-pressed={recipientId === friend.id} style={{ display: "flex", alignItems: "center", gap: 10, textAlign: "left", border: recipientId === friend.id ? "2px solid #5b4bdb" : "1px solid var(--border,#ddd)", borderRadius: 10, padding: 9, background: "var(--card,#fff)", color: "inherit", cursor: "pointer" }}>
          {friend.avatar_url ? <img src={friend.avatar_url} alt="" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover" }}/> : <span style={{ width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center", background: "var(--border,#ddd)" }}><Users size={16}/></span>}
          <span><strong>{friend.display_name || friend.username || "Usuário"}</strong><small style={{ display: "block", color: "var(--muted,#777)" }}>{friend.username ? "@" + friend.username : ""}</small></span>
          {recipientId === friend.id && <strong style={{ marginLeft: "auto" }}>✓</strong>}
        </button>)}
      </div>
    ) : <p style={{ color: "var(--muted,#777)", margin: 0, fontSize: 13 }}>{friends.length ? "Nenhum amigo encontrado." : "Você ainda não tem amigos com seguimento mútuo. Os dois precisam se seguir."}</p>}
    <button type="button" disabled={busy || loading || !recipientId} onClick={() => void gift()} style={{ border: 0, borderRadius: 10, padding: 13, background: "#5b4bdb", color: "white", fontWeight: 800, cursor: "pointer", opacity: busy || loading || !recipientId ? .55 : 1 }}>
      {busy ? "Abrindo pagamento..." : "Comprar e enviar este pacote"}
    </button>
    {message && <p role="status" style={{ margin: 0, color: "#c65362" }}>{message}</p>}
  </section>;
}

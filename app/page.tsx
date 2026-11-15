"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";

type Profile = {
  id: string;
  display_name: string;
  username: string;
  gender: string;
  gender_description: string | null;
  looking_for: string[];
};
type Message = {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

const genderLabels: Record<string, string> = {
  woman: "Mulher",
  man: "Homem",
  non_binary: "Pessoa não binária",
  self_described: "Outro gênero",
  prefer_not_to_say: "Prefiro não informar",
};
const preferenceLabels: Record<string, string> = {
  woman: "Mulheres",
  man: "Homens",
  non_binary: "Pessoas não binárias",
  self_described: "Outros gêneros",
  prefer_not_to_say: "Pessoas que preferem não informar",
  any: "Qualquer gênero",
};

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [gender, setGender] = useState("woman");
  const [genderDescription, setGenderDescription] = useState("");
  const [lookingFor, setLookingFor] = useState<string[]>(["any"]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [queueStatus, setQueueStatus] = useState<"idle" | "waiting" | "matched">("idle");
  const [matchId, setMatchId] = useState<string | null>(null);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) setError(sessionError.message);
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setError("");
      setNotice("");
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      if (!session?.user) {
        setProfile(null);
        setQueueStatus("idle");
        setMatchId(null);
        return;
      }
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("id,display_name,username,gender,gender_description,looking_for")
        .eq("id", session.user.id)
        .maybeSingle();
      if (!active) return;
      if (profileError) {
        setError("Não foi possível carregar seu perfil. " + profileError.message);
        return;
      }
      setProfile(data as Profile | null);
      if (data) {
        const { data: queue, error: queueError } = await supabase
          .from("queue_entries")
          .select("status,match_id")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (!active) return;
        if (queueError) {
          setError("Não foi possível verificar sua fila. " + queueError.message);
          return;
        }
        if (queue?.status === "waiting") setQueueStatus("waiting");
        if (queue?.status === "matched" && queue.match_id) {
          setQueueStatus("matched");
          setMatchId(queue.match_id);
        }
      }
    }
    loadProfile();
    return () => { active = false; };
  }, [session]);

  useEffect(() => {
    if (!session?.user.id || !profile) return;
    const channel = supabase
      .channel("connect-queue-" + session.user.id)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "queue_entries",
        filter: "user_id=eq." + session.user.id,
      }, (payload) => {
        if (payload.eventType === "DELETE") {
          setQueueStatus("idle");
          setMatchId(null);
          return;
        }
        const row = payload.new as { status?: string; match_id?: string | null };
        if (row.status === "matched" && row.match_id) {
          setQueueStatus("matched");
          setMatchId(row.match_id);
        } else if (row.status === "waiting") {
          setQueueStatus("waiting");
        }
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [session, profile]);

  useEffect(() => {
    if (queueStatus !== "waiting") return;
    const heartbeat = window.setInterval(() => {
      void supabase.rpc("queue_heartbeat");
    }, 25000);
    return () => window.clearInterval(heartbeat);
  }, [queueStatus]);

  useEffect(() => {
    let active = true;
    async function loadMatch() {
      if (!matchId || !session?.user.id) {
        setPartner(null);
        setMessages([]);
        return;
      }
      const { data: match, error: matchError } = await supabase
        .from("matches")
        .select("id,user_one,user_two")
        .eq("id", matchId)
        .single();
      if (matchError) {
        setError("Não foi possível abrir a conversa. " + matchError.message);
        return;
      }
      const partnerId = match.user_one === session.user.id ? match.user_two : match.user_one;
      const [{ data: other }, { data: history, error: historyError }] = await Promise.all([
        supabase.from("profiles").select("id,display_name,username,gender,gender_description,looking_for").eq("id", partnerId).single(),
        supabase.from("messages").select("id,match_id,sender_id,body,created_at").eq("match_id", matchId).order("created_at", { ascending: true }),
      ]);
      if (!active) return;
      if (historyError) setError("Não foi possível carregar as mensagens. " + historyError.message);
      setPartner(other as Profile | null);
      setMessages((history || []) as Message[]);
    }
    loadMatch();
    if (!matchId) return () => { active = false; };
    const channel = supabase
      .channel("connect-chat-" + matchId)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: "match_id=eq." + matchId,
      }, (payload) => {
        const incoming = payload.new as Message;
        setMessages((current) => current.some((item) => item.id === incoming.id) ? current : [...current, incoming]);
      })
      .subscribe();
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [matchId, session]);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signInError) throw signInError;
      } else {
        if (displayName.trim().length < 2) throw new Error("Informe um nome com pelo menos 2 caracteres.");
        const cleanUsername = username.trim().replace(/^@/, "").toLowerCase();
        if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
          throw new Error("O @ deve ter de 3 a 20 caracteres: letras sem acento, números ou _.");
        }
        if (password.length < 8) throw new Error("Sua senha precisa ter pelo menos 8 caracteres.");
        if (lookingFor.length === 0) throw new Error("Escolha quem você quer encontrar.");
        if (gender === "self_described" && !genderDescription.trim()) {
          throw new Error("Descreva seu gênero para continuar.");
        }
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              display_name: displayName.trim(),
              username: cleanUsername,
              gender,
              gender_description: gender === "self_described" ? genderDescription.trim() : null,
              looking_for: lookingFor,
            },
          },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setNotice("Cadastro iniciado. Confira seu e-mail para confirmar a conta. Depois de confirmar, entre com seu e-mail e senha.");
        } else {
          setNotice("Conta criada. Seu perfil já está salvo.");
        }
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível concluir. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  function togglePreference(value: string) {
    setLookingFor((current) => {
      if (value === "any") return ["any"];
      const withoutAny = current.filter((item) => item !== "any");
      const next = withoutAny.includes(value) ? withoutAny.filter((item) => item !== value) : [...withoutAny, value];
      return next;
    });
  }

  async function enterQueue() {
    if (!profile) return;
    setError("");
    setNotice("");
    setBusy(true);
    const { data, error: queueError } = await supabase.rpc("enter_queue");
    setBusy(false);
    if (queueError) {
      setError("Não foi possível entrar na fila. " + queueError.message);
      return;
    }
    const result = Array.isArray(data) ? data[0] : data;
    if (result?.matched && result.match_id) {
      setQueueStatus("matched");
      setMatchId(result.match_id);
    } else {
      setQueueStatus("waiting");
      setNotice("Você entrou na fila real. Vamos conectar você quando alguém compatível estiver disponível.");
    }
  }

  async function leaveQueue() {
    setBusy(true);
    const { error: leaveError } = await supabase.rpc("leave_queue");
    setBusy(false);
    if (leaveError) {
      setError("Não foi possível sair da fila. " + leaveError.message);
      return;
    }
    setQueueStatus("idle");
    setNotice("Você saiu da fila.");
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!matchId || !session?.user.id || !draft.trim()) return;
    const body = draft.trim();
    setDraft("");
    const { data, error: sendError } = await supabase
      .from("messages")
      .insert({ match_id: matchId, sender_id: session.user.id, body })
      .select("id,match_id,sender_id,body,created_at")
      .single();
    if (sendError) {
      setDraft(body);
      setError("Não foi possível enviar a mensagem. " + sendError.message);
      return;
    }
    const sent = data as Message;
    setMessages((current) => current.some((item) => item.id === sent.id) ? current : [...current, sent]);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setQueueStatus("idle");
    setMatchId(null);
  }

  if (loading) {
    return <main className="connect-screen"><div className="connect-card"><span className="connect-logo">c</span><p>Conectando ao CONNECT...</p></div></main>;
  }

  if (!session) {
    return (
      <main className="connect-screen">
        <section className="connect-auth">
          <div className="connect-brand"><span className="connect-logo">c</span><span>connect<span className="connect-dot">.</span></span></div>
          <p className="connect-kicker">CONEXÕES DE VERDADE</p>
          <h1>{mode === "signup" ? "Encontre sua próxima conexão." : "Que bom ter você de volta."}</h1>
          <p className="connect-subtitle">Crie seu perfil, escolha quem deseja conhecer e converse com pessoas reais que estiverem online.</p>
          <div className="connect-switch">
            <button className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setError(""); }}>Criar conta</button>
            <button className={mode === "signin" ? "active" : ""} onClick={() => { setMode("signin"); setError(""); }}>Entrar</button>
          </div>
          <form onSubmit={submitAuth} className="connect-form">
            {mode === "signup" && <>
              <label>Como podemos chamar você?<input required minLength={2} maxLength={40} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Seu nome" /></label>
              <label>Escolha seu @ exclusivo<div className="connect-handle"><span>@</span><input required minLength={3} maxLength={20} value={username} onChange={(e) => setUsername(e.target.value.replace(/^@/, ""))} placeholder="seuusuario" /></div><small>De 3 a 20 caracteres. Não pode ser igual ao de outra pessoa.</small></label>
              <label>Como você se identifica?<select value={gender} onChange={(e) => setGender(e.target.value)}>{Object.entries(genderLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              {gender === "self_described" && <label>Como você descreve seu gênero?<input required maxLength={40} value={genderDescription} onChange={(e) => setGenderDescription(e.target.value)} placeholder="Escreva aqui" /></label>}
              <fieldset><legend>Quem você quer encontrar?</legend><div className="connect-options">{Object.entries(preferenceLabels).map(([value, label]) => <label key={value} className="connect-check"><input type="checkbox" checked={lookingFor.includes(value)} onChange={() => togglePreference(value)} />{label}</label>)}</div></fieldset>
            </>}
            <label>E-mail<input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" /></label>
            <label>Senha<input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={mode === "signup" ? 8 : 1} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "signup" ? "Mínimo de 8 caracteres" : "Sua senha"} /></label>
            {error && <p className="connect-error">{error}</p>}
            {notice && <p className="connect-notice">{notice}</p>}
            <button className="connect-submit" disabled={busy}>{busy ? "Aguarde..." : mode === "signup" ? "Criar minha conta" : "Entrar no CONNECT"} <span>↗</span></button>
          </form>
          <p className="connect-legal">Ao continuar, você concorda em usar o CONNECT com respeito e responsabilidade.</p>
          <p className="connect-foot">Login com Google será adicionado em uma próxima etapa.</p>
        </section>
        <aside className="connect-visual">
          <div className="connect-glow" />
          <div className="connect-visual-copy"><span>MENOS DISTÂNCIA. MAIS CONEXÃO.</span><h2>Uma conversa pode mudar seu dia.</h2><p>Conheça pessoas novas no seu tempo, do seu jeito.</p></div>
          <div className="connect-orbit orbit-one" /><div className="connect-orbit orbit-two" /><div className="connect-orbit orbit-three" />
        </aside>
      </main>
    );
  }

  if (!profile) {
    return <main className="connect-screen"><section className="connect-auth"><div className="connect-brand"><span className="connect-logo">c</span><span>connect<span className="connect-dot">.</span></span></div><h1>Preparando seu perfil.</h1><p className="connect-subtitle">Se você acabou de criar sua conta, confirme seu e-mail e entre novamente. Se o problema continuar, confira se o banco está acessível.</p>{error && <p className="connect-error">{error}</p>}<button className="connect-submit" onClick={signOut}>Sair da conta</button></section></main>;
  }

  return (
    <main className="connect-app">
      <header className="connect-header"><div className="connect-brand"><span className="connect-logo">c</span><span>connect<span className="connect-dot">.</span></span></div><div className="connect-account"><span>@{profile.username}</span><button onClick={signOut}>Sair</button></div></header>
      <section className="connect-dashboard">
        <div className="connect-welcome"><p className="connect-kicker">SEU ESPAÇO, SUAS CONEXÕES</p><h1>Olá, {profile.display_name}.</h1><p>Seu perfil está ativo. Quando você entrar na fila, vamos procurar alguém real que também esteja disponível.</p></div>
        {error && <p className="connect-error">{error}</p>}
        {notice && <p className="connect-notice">{notice}</p>}
        <div className="connect-profile-card"><div><span className="connect-kicker">SEU PERFIL</span><h2>{profile.display_name} <small>@{profile.username}</small></h2><p>Você se identifica como: {genderLabels[profile.gender]}{profile.gender_description ? " — " + profile.gender_description : ""}</p><p>Quer conhecer: {profile.looking_for.map((item) => preferenceLabels[item] || item).join(", ")}</p></div><span className="connect-live-dot">PERFIL SALVO</span></div>
        {matchId && partner ? (
          <section className="connect-chat">
            <div className="connect-chat-head"><div><span className="connect-kicker">VOCÊS FORAM CONECTADOS</span><h2>{partner.display_name} <small>@{partner.username}</small></h2></div><button onClick={() => { setMatchId(null); setPartner(null); setMessages([]); setQueueStatus("idle"); }}>Fechar conversa</button></div>
            <div className="connect-messages">{messages.map((message) => <div key={message.id} className={"connect-message " + (message.sender_id === session.user.id ? "mine" : "theirs")}><p>{message.body}</p><time>{new Date(message.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</time></div>)}{messages.length === 0 && <p className="connect-empty">Conversa iniciada. Dê oi!</p>}</div>
            <form className="connect-send" onSubmit={sendMessage}><input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Escreva sua mensagem..." maxLength={4000} /><button disabled={!draft.trim()}>Enviar ↗</button></form>
          </section>
        ) : queueStatus === "matched" ? (
          <section className="connect-queue-card"><h2>Conexão encontrada!</h2><p>Abrindo sua conversa...</p></section>
        ) : queueStatus === "waiting" ? (
          <section className="connect-queue-card"><span className="connect-spinner" /><span className="connect-kicker">FILA DE CONEXÃO ATIVA</span><h2>Procurando alguém para conversar.</h2><p>Você está na fila. A conexão acontece quando uma pessoa online com preferências compatíveis também estiver procurando.</p><button className="connect-secondary" disabled={busy} onClick={leaveQueue}>Sair da fila</button></section>
        ) : (
          <section className="connect-queue-card"><span className="connect-kicker">CONVERSA POR FILA</span><h2>Conheça alguém novo.</h2><p>Vamos procurar pessoas que estejam online agora e cujas preferências combinem com as suas. Nada de perfis ou conversas inventadas.</p><button className="connect-submit" disabled={busy} onClick={enterQueue}>{busy ? "Entrando..." : "Entrar na fila real"} <span>↗</span></button></section>
        )}
      </section>
    </main>
  );
}

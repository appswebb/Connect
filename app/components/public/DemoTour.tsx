"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, Bell, CheckCheck, Compass, Crown, FlaskConical, Gift, Globe2, Heart, MessageCircle,
  Mic, MicOff, Moon, Newspaper, Paperclip, PhoneOff, Radio, Reply, Search, Send, Sun, Trash2, Users, Video, VideoOff,
} from "lucide-react";
import {
  demoChats, demoLives, demoNotifications, demoPeople, demoPosts, demoRoomMessages, initialsOf, ufList,
  type DemoMessage, type DemoNotification, type DemoPost,
} from "./demoData";
import { formatBRL, usePublicPlans } from "./usePublic";

type TabId = "feed" | "people" | "chat" | "rooms" | "lives" | "notifications" | "plans";

type Props = {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onBack: () => void;
  onSignup: () => void;
  onSignin: () => void;
  onReadOnlyAccount: () => void;
};

const tabs: { id: TabId; label: string; icon: typeof Newspaper }[] = [
  { id: "feed", label: "Feed", icon: Newspaper },
  { id: "people", label: "Pessoas", icon: Compass },
  { id: "chat", label: "Conversas", icon: MessageCircle },
  { id: "rooms", label: "Salas", icon: Globe2 },
  { id: "lives", label: "Ao vivo", icon: Radio },
  { id: "notifications", label: "Avisos", icon: Bell },
  { id: "plans", label: "Assinatura", icon: Crown },
];

const personById = (id: string) => demoPeople.find(p => p.id === id) || demoPeople[0];

function Avatar({ name, hue, size }: { name: string; hue: number; size?: "sm" | "lg" }) {
  return (
    <span className={"mock-avatar" + (size ? " mock-avatar--" + size : "")} style={{ ["--h" as string]: hue }} aria-hidden="true">
      {initialsOf(name)}
    </span>
  );
}

export default function DemoTour({ theme, onToggleTheme, onBack, onSignup, onSignin, onReadOnlyAccount }: Props) {
  const [tab, setTab] = useState<TabId>("feed");
  const [toast, setToast] = useState("");
  const say = (text: string) => { setToast(text); window.setTimeout(() => setToast(current => (current === text ? "" : current)), 3200); };

  /* Estado local — nada disto sai do navegador */
  const [posts, setPosts] = useState<DemoPost[]>(demoPosts);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [openComments, setOpenComments] = useState<string>("");
  const [commentDraft, setCommentDraft] = useState("");
  const [postDraft, setPostDraft] = useState("");

  const [follow, setFollow] = useState<Record<string, boolean>>({});
  const [peopleQuery, setPeopleQuery] = useState("");

  const [chatId, setChatId] = useState(demoChats[0].id);
  const [thread, setThread] = useState<Record<string, DemoMessage[]>>(() => Object.fromEntries(demoChats.map(c => [c.id, c.messages])));
  const [chatDraft, setChatDraft] = useState("");
  const [chatReply, setChatReply] = useState<DemoMessage | null>(null);

  const [room, setRoom] = useState("BR");
  const [roomLocal, setRoomLocal] = useState<Record<string, { who: string; hue: number; body: string }[]>>({});
  const [roomDraft, setRoomDraft] = useState("");

  const [liveId, setLiveId] = useState("");
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [guestAsked, setGuestAsked] = useState(false);

  const [notifs, setNotifs] = useState<DemoNotification[]>(demoNotifications);
  const unread = notifs.filter(n => n.unread).length;

  const { plans, state: planState } = usePublicPlans();

  const filteredPeople = useMemo(() => {
    const q = peopleQuery.trim().toLowerCase();
    return !q ? demoPeople : demoPeople.filter(p => (p.name + " " + p.user + " " + p.city + " " + p.uf).toLowerCase().includes(q));
  }, [peopleQuery]);

  function publish(e: FormEvent) {
    e.preventDefault();
    const body = postDraft.trim();
    if (!body) return;
    setPosts(old => [{ id: "local-" + Date.now(), personId: "me", body, when: "agora", likes: 0, comments: [] }, ...old]);
    setPostDraft("");
    say("Publicação de exemplo: ela só existe nesta tela e não é salva.");
  }
  function comment(postId: string, e: FormEvent) {
    e.preventDefault();
    const body = commentDraft.trim();
    if (!body) return;
    setPosts(old => old.map(p => (p.id === postId ? { ...p, comments: [...p.comments, body] } : p)));
    setCommentDraft("");
  }
  function sendChat(e: FormEvent) {
    e.preventDefault();
    const body = chatDraft.trim();
    if (!body) return;
    setThread(old => ({ ...old, [chatId]: [...(old[chatId] || []), { id: "x" + Date.now(), mine: true, body, reply: chatReply?.body }] }));
    setChatDraft(""); setChatReply(null);
  }
  function sendRoom(e: FormEvent) {
    e.preventDefault();
    const body = roomDraft.trim();
    if (!body) return;
    setRoomLocal(old => ({ ...old, [room]: [...(old[room] || []), { who: "Você", hue: 250, body }] }));
    setRoomDraft("");
  }

  const chat = demoChats.find(c => c.id === chatId) || demoChats[0];
  const chatPerson = personById(chat.personId);
  const live = demoLives.find(l => l.id === liveId);
  const roomMessages = [...(demoRoomMessages[room] || demoRoomMessages.default), ...(roomLocal[room] || [])];

  return (
    <div className="tour" data-tab={tab}>
      <div className="tour-banner" role="note">
        <span className="tour-banner__tag"><FlaskConical size={14} /> Demonstração</span>
        <span className="tour-banner__text">Dados fictícios. Nada aqui é salvo e nenhuma pessoa real aparece.</span>
        <div className="tour-banner__actions">
          <button type="button" className="tour-btn tour-btn--solid" onClick={onSignup}>Criar minha conta</button>
          <button type="button" className="tour-btn" onClick={onBack}><ArrowLeft size={14} /> Sair</button>
        </div>
      </div>

      <div className="tour-shell">
        <aside className="tour-side" aria-label="Navegação da demonstração">
          <a className="tour-brand" onClick={onBack} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter") onBack(); }}>
            <img src="/Connect/connect-mark.svg" alt="" /> connect
          </a>
          <nav>
            {tabs.map(t => (
              <button type="button" key={t.id} className={tab === t.id ? "on" : ""} onClick={() => { setTab(t.id); setLiveId(""); }} aria-current={tab === t.id ? "page" : undefined}>
                <t.icon size={19} /><span>{t.label}</span>
                {t.id === "notifications" && unread > 0 && <b>{unread}</b>}
              </button>
            ))}
          </nav>
          <div className="tour-side__foot">
            <button type="button" className="tour-btn" onClick={onToggleTheme}>{theme === "dark" ? <Sun size={14} /> : <Moon size={14} />} {theme === "dark" ? "Tema claro" : "Tema escuro"}</button>
            <button type="button" className="tour-link" onClick={onReadOnlyAccount}>Tenho acesso de demonstração</button>
            <button type="button" className="tour-link" onClick={onSignin}>Já tenho conta</button>
          </div>
        </aside>

        <main className="tour-main">
          {/* ───── Feed ───── */}
          {tab === "feed" && (
            <section className="tour-panel">
              <header className="tour-head"><small>Seu feed</small><h1>O que está acontecendo</h1></header>
              <form className="tour-card tour-compose" onSubmit={publish}>
                <Avatar name="Você" hue={250} />
                <input value={postDraft} onChange={e => setPostDraft(e.target.value)} placeholder="Compartilhe algo com a comunidade…" maxLength={280} aria-label="Escrever publicação" />
                <button type="button" className="tour-icon" onClick={() => say("Na plataforma você anexa fotos e vídeos às publicações.")} aria-label="Anexar mídia"><Paperclip size={17} /></button>
                <button className="tour-btn tour-btn--solid" disabled={!postDraft.trim()}>Publicar</button>
              </form>
              {posts.map(p => {
                const person = p.personId === "me" ? { name: "Você (demonstração)", user: "voce", hue: 250 } : personById(p.personId);
                const likeCount = p.likes + (liked[p.id] ? 1 : 0);
                return (
                  <article className="tour-card" key={p.id}>
                    <div className="tour-post-head"><Avatar name={person.name} hue={person.hue} /><div><strong>{person.name}</strong><small>@{person.user} · {p.when}</small></div></div>
                    <p className="tour-post-body">{p.body}</p>
                    {p.art && <div className="mock-post__art" style={{ height: 190 }} aria-hidden="true" />}
                    <div className="tour-actions">
                      <button type="button" className={liked[p.id] ? "on" : ""} onClick={() => setLiked(o => ({ ...o, [p.id]: !o[p.id] }))} aria-pressed={!!liked[p.id]}><Heart size={16} fill={liked[p.id] ? "currentColor" : "none"} /> {likeCount}</button>
                      <button type="button" onClick={() => { setOpenComments(openComments === p.id ? "" : p.id); setCommentDraft(""); }} aria-expanded={openComments === p.id}><MessageCircle size={16} /> {p.comments.length}</button>
                    </div>
                    {openComments === p.id && (
                      <div className="tour-comments">
                        {p.comments.map((c, i) => <p key={i}><b>Alguém da comunidade</b>{c}</p>)}
                        {p.comments.length === 0 && <p className="tour-muted">Seja a primeira pessoa a comentar.</p>}
                        <form onSubmit={e => comment(p.id, e)}><input value={commentDraft} onChange={e => setCommentDraft(e.target.value)} placeholder="Escreva um comentário…" aria-label="Comentário" /><button className="tour-icon" aria-label="Enviar comentário"><Send size={16} /></button></form>
                      </div>
                    )}
                  </article>
                );
              })}
            </section>
          )}

          {/* ───── Pessoas ───── */}
          {tab === "people" && (
            <section className="tour-panel">
              <header className="tour-head"><small>Descoberta</small><h1>Encontre pessoas</h1></header>
              <label className="tour-search"><Search size={17} /><input value={peopleQuery} onChange={e => setPeopleQuery(e.target.value)} placeholder="Buscar por nome, @ ou cidade" aria-label="Buscar pessoas" /></label>
              <div className="tour-grid">
                {filteredPeople.map(p => (
                  <article className="tour-card tour-person" key={p.id}>
                    <Avatar name={p.name} hue={p.hue} size="lg" />
                    <strong>{p.name}</strong><small>@{p.user}</small>
                    <span className="mock-chip">{p.city} · {p.uf}</span>
                    <p>{p.bio}</p>
                    <div className="tour-row">
                      <button type="button" className={"tour-btn" + (follow[p.id] ? "" : " tour-btn--solid")} onClick={() => setFollow(o => ({ ...o, [p.id]: !o[p.id] }))}>{follow[p.id] ? "Seguindo" : "Seguir"}</button>
                      <button type="button" className="tour-btn" onClick={() => { const c = demoChats.find(x => x.personId === p.id); if (c) { setChatId(c.id); setTab("chat"); } else say("Na plataforma, você envia um pedido de mensagem para começar a conversar."); }}>Mensagem</button>
                    </div>
                  </article>
                ))}
                {filteredPeople.length === 0 && <p className="tour-empty">Ninguém encontrado para “{peopleQuery}”.</p>}
              </div>
            </section>
          )}

          {/* ───── Conversas ───── */}
          {tab === "chat" && (
            <section className="tour-panel tour-panel--wide">
              <header className="tour-head"><small>Mensagens</small><h1>Conversas</h1></header>
              <div className="tour-chat tour-card">
                <div className="tour-chat__list" role="tablist" aria-label="Conversas">
                  {demoChats.map(c => { const p = personById(c.personId); return (
                    <button type="button" role="tab" aria-selected={c.id === chatId} key={c.id} className={c.id === chatId ? "on" : ""} onClick={() => { setChatId(c.id); setChatReply(null); }}>
                      <Avatar name={p.name} hue={p.hue} size="sm" /><span><strong>{p.name}</strong><small>{c.last}</small></span>
                    </button>); })}
                </div>
                <div className="tour-chat__thread">
                  <header><Avatar name={chatPerson.name} hue={chatPerson.hue} size="sm" /><strong>{chatPerson.name}</strong><small>● online</small></header>
                  <div className="tour-chat__msgs">
                    {(thread[chatId] || []).map(m => (
                      <div className={"tour-msg" + (m.mine ? " mine" : "")} key={m.id}>
                        <div className="mock-bubble">{m.reply && <span className="mock-reply">{m.reply}</span>}{m.body}</div>
                        <span className="tour-msg__tools">
                          <button type="button" onClick={() => setChatReply(m)} aria-label="Responder"><Reply size={13} /></button>
                          {m.mine && <button type="button" onClick={() => setThread(o => ({ ...o, [chatId]: o[chatId].filter(x => x.id !== m.id) }))} aria-label="Excluir minha mensagem"><Trash2 size={13} /></button>}
                        </span>
                      </div>
                    ))}
                  </div>
                  {chatReply && <div className="tour-replying">Respondendo: “{chatReply.body}” <button type="button" onClick={() => setChatReply(null)} aria-label="Cancelar resposta">×</button></div>}
                  <form className="tour-composer" onSubmit={sendChat}>
                    <button type="button" className="tour-icon" onClick={() => say("Na plataforma você envia imagens, áudios e arquivos.")} aria-label="Anexar"><Paperclip size={17} /></button>
                    <input value={chatDraft} onChange={e => setChatDraft(e.target.value)} placeholder="Escreva uma mensagem…" aria-label="Mensagem" />
                    <button className="tour-icon tour-icon--solid" disabled={!chatDraft.trim()} aria-label="Enviar"><Send size={16} /></button>
                  </form>
                </div>
              </div>
            </section>
          )}

          {/* ───── Salas ───── */}
          {tab === "rooms" && (
            <section className="tour-panel tour-panel--wide">
              <header className="tour-head"><small>Comunidades</small><h1>Salas do Brasil e dos estados</h1></header>
              <div className="tour-chips" role="tablist" aria-label="Salas">
                {["BR", ...ufList].map(code => (
                  <button type="button" role="tab" aria-selected={room === code} key={code} className={room === code ? "on" : ""} onClick={() => setRoom(code)}>{code === "BR" ? "Brasil" : code}</button>
                ))}
              </div>
              <div className="tour-card tour-room">
                <header><Globe2 size={18} /><div><strong>{room === "BR" ? "Sala do Brasil" : "Sala · " + room}</strong><small>Você está nesta sala</small></div></header>
                <div className="tour-room__list">
                  {roomMessages.map((m, i) => (
                    <div className="mock-room-msg" key={i}><Avatar name={m.who} hue={m.hue} size="sm" /><p><b>{m.who}</b>{m.body}</p></div>
                  ))}
                </div>
                <form className="tour-composer" onSubmit={sendRoom}>
                  <input value={roomDraft} onChange={e => setRoomDraft(e.target.value)} placeholder={"Mensagem para a sala " + (room === "BR" ? "do Brasil" : room)} aria-label="Mensagem para a sala" />
                  <button className="tour-icon tour-icon--solid" disabled={!roomDraft.trim()} aria-label="Enviar"><Send size={16} /></button>
                </form>
              </div>
            </section>
          )}

          {/* ───── Ao vivo ───── */}
          {tab === "lives" && !live && (
            <section className="tour-panel">
              <header className="tour-head"><small>Transmissões</small><h1>Ao vivo agora</h1></header>
              <div className="tour-grid">
                {demoLives.map(l => { const h = personById(l.hostId); return (
                  <article className="tour-card tour-live-card" key={l.id}>
                    <div className="mock-live" aria-hidden="true"><span className="mock-live__badge"><i /> AO VIVO</span><Avatar name={h.name} hue={h.hue} size="lg" /></div>
                    <strong>{l.title}</strong><small>{h.name} · {l.viewers} assistindo · {l.tag}</small>
                    <button type="button" className="tour-btn tour-btn--solid" onClick={() => { setLiveId(l.id); setGuestAsked(false); }}>Assistir</button>
                  </article>); })}
              </div>
              <div className="tour-card tour-start"><Radio size={20} /><div><strong>Quer transmitir?</strong><small>Na plataforma você prepara a live, testa câmera e microfone e abre o palco.</small></div><button type="button" className="tour-btn" onClick={onSignup}>Criar conta</button></div>
            </section>
          )}
          {tab === "lives" && live && (
            <section className="tour-panel tour-panel--wide">
              <button type="button" className="tour-link" onClick={() => setLiveId("")}><ArrowLeft size={14} /> Voltar às transmissões</button>
              <div className="tour-stage">
                <span className="mock-live__badge"><i /> AO VIVO · {live.viewers}</span>
                <h2>{live.title}</h2>
                <div className="tour-stage__tiles">
                  <div className="tour-tile"><Avatar name={personById(live.hostId).name} hue={personById(live.hostId).hue} size="lg" /><small>{personById(live.hostId).name} (anfitrião)</small></div>
                  {guestAsked && <div className="tour-tile"><Avatar name="Você" hue={250} size="lg" /><small>Você (convidado de exemplo)</small></div>}
                </div>
                <div className="tour-stage__controls">
                  <button type="button" className={mic ? "" : "off"} onClick={() => setMic(!mic)} aria-pressed={mic} aria-label={mic ? "Desligar microfone" : "Ligar microfone"}>{mic ? <Mic size={18} /> : <MicOff size={18} />}</button>
                  <button type="button" className={cam ? "" : "off"} onClick={() => setCam(!cam)} aria-pressed={cam} aria-label={cam ? "Desligar câmera" : "Ligar câmera"}>{cam ? <Video size={18} /> : <VideoOff size={18} />}</button>
                  <button type="button" className="ask" onClick={() => setGuestAsked(!guestAsked)}>{guestAsked ? "Sair do palco" : "Pedir para entrar"}</button>
                  <button type="button" className="end" onClick={() => setLiveId("")} aria-label="Sair da transmissão"><PhoneOff size={18} /></button>
                </div>
                <p className="tour-muted">Nesta demonstração, câmera e microfone não são acessados.</p>
              </div>
            </section>
          )}

          {/* ───── Notificações ───── */}
          {tab === "notifications" && (
            <section className="tour-panel">
              <header className="tour-head tour-head--row"><div><small>Central</small><h1>Notificações</h1></div>
                <button type="button" className="tour-btn" disabled={unread === 0} onClick={() => setNotifs(o => o.map(n => ({ ...n, unread: false })))}><CheckCheck size={15} /> Marcar todas como lidas</button></header>
              <div className="tour-card tour-notifs">
                {notifs.map(n => (
                  <button type="button" key={n.id} className={n.unread ? "unread" : ""} onClick={() => { setNotifs(o => o.map(x => (x.id === n.id ? { ...x, unread: false } : x))); setTab(n.kind === "message" || n.kind === "match" ? "chat" : n.kind === "live" ? "lives" : n.kind === "follower" ? "people" : "feed"); }}>
                    <span className="tour-notif-ico" data-kind={n.kind}>{n.kind === "message" ? <MessageCircle size={16} /> : n.kind === "live" ? <Radio size={16} /> : n.kind === "post" ? <Newspaper size={16} /> : <Users size={16} />}</span>
                    <span><strong>{n.title}</strong><small>{n.body}</small></span><time>{n.when}</time>{n.unread && <i aria-label="não lida" />}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ───── Planos ───── */}
          {tab === "plans" && (
            <section className="tour-panel">
              <header className="tour-head"><small>Assinatura</small><h1>Pacote CONNECT</h1></header>
              <div className="tour-grid">
                {planState === "loading" && <article className="tour-card"><p className="tour-muted">Carregando planos reais…</p></article>}
                {planState === "ready" && plans.map(p => (
                  <article className="tour-card tour-plan" key={p.id}>
                    <strong>{p.name}</strong>
                    <div className="tour-plan__price">{formatBRL(Number(p.price_brl))}<small> / {p.billing_interval === "year" ? "ano" : "mês"}</small></div>
                    <p>{p.description}</p>
                    <ul><li><Crown size={15} /> Buscas ilimitadas</li><li><Gift size={15} /> Pode ser dado de presente</li></ul>
                    <button type="button" className="tour-btn tour-btn--solid" onClick={onSignup}>Criar conta para assinar <ArrowRight size={14} /></button>
                  </article>
                ))}
                {(planState === "error" || (planState === "ready" && plans.length === 0)) && (
                  <article className="tour-card tour-plan"><strong>Pacote CONNECT</strong><p>Buscas ilimitadas com renovação automática. Os valores aparecem na aba Assinatura da sua conta.</p><button type="button" className="tour-btn tour-btn--solid" onClick={onSignup}>Criar minha conta <ArrowRight size={14} /></button></article>
                )}
              </div>
              <p className="tour-muted">Os valores acima são os reais. O pagamento só acontece dentro da sua conta, pelo Mercado Pago.</p>
            </section>
          )}
        </main>
      </div>

      <nav className="tour-tabbar" aria-label="Navegação da demonstração">
        {tabs.map(t => (
          <button type="button" key={t.id} className={tab === t.id ? "on" : ""} onClick={() => { setTab(t.id); setLiveId(""); }} aria-label={t.label} aria-current={tab === t.id ? "page" : undefined}>
            <t.icon size={20} />{t.id === "notifications" && unread > 0 && <b>{unread}</b>}<span>{t.label}</span>
          </button>
        ))}
      </nav>

      {toast && <div className="tour-toast" role="status">{toast}</div>}
    </div>
  );
}

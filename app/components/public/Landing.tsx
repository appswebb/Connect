"use client";

import { useRef } from "react";
import {
  ArrowRight, Ban, Bell, Check, Crown, Download, Eye, Flag, Globe2, Heart, Lock,
  MapPin, MessageCircle, Mic, Moon, PhoneOff, Radio, ShieldCheck, Sparkles, Sun, Users, Video,
} from "lucide-react";
import { formatBRL, useReveal, useScrolled, usePublicPlans } from "./usePublic";

type Props = {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onSignup: () => void;
  onSignin: () => void;
  onTour: () => void;
};

const Avatar = ({ name, hue, size }: { name: string; hue: number; size?: "sm" | "lg" }) => (
  <span className={"mock-avatar" + (size ? " mock-avatar--" + size : "")} style={{ ["--h" as string]: hue }} aria-hidden="true">
    {name.split(" ").slice(0, 2).map(x => x[0]).join("")}
  </span>
);

export default function Landing({ theme, onToggleTheme, onSignup, onSignin, onTour }: Props) {
  const root = useRef<HTMLElement>(null);
  const scrolled = useScrolled();
  const { plans, state } = usePublicPlans();
  useReveal(root);

  return (
    <main className="pub" ref={root} id="inicio">
      <header className="pub-header" data-scrolled={scrolled}>
        <a className="pub-brand" href="#inicio" aria-label="CONNECT — início">
          <img src="/Connect/connect-mark.svg" alt="" /> connect
        </a>
        <nav className="pub-nav" aria-label="Seções">
          <a href="#recursos">Recursos</a>
          <a href="#por-dentro">Por dentro</a>
          <a href="#como-funciona">Como funciona</a>
          <a href="#planos">Planos</a>
        </nav>
        <div className="pub-actions">
          <button type="button" className="pub-iconbtn" onClick={onToggleTheme} aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}>
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button type="button" className="pub-btn pub-btn--text" onClick={onSignin}>Entrar</button>
          <button type="button" className="pub-btn pub-btn--primary" onClick={onSignup}>Criar conta</button>
        </div>
      </header>

      {/* ───────────── Hero ───────────── */}
      <section className="pub-hero" aria-labelledby="hero-title">
        <div className="pub-hero__bg" aria-hidden="true">
          <span className="pub-orb pub-orb--1" /><span className="pub-orb pub-orb--2" /><span className="pub-orb pub-orb--3" />
          <span className="pub-grid-lines" />
        </div>
        <div className="pub-hero__grid">
          <div>
            <span className="pub-kicker"><i /> Pessoas · conversas · comunidades</span>
            <h1 className="pub-h1" id="hero-title">Conexões reais,<br /><em>conversas leves.</em></h1>
            <p className="pub-lead">
              O CONNECT reúne feed, chat privado, salas do Brasil e dos estados, transmissões ao vivo e
              notificações em um só lugar — para você conhecer gente nova no seu ritmo.
            </p>
            <div className="pub-cta-row">
              <button type="button" className="pub-btn pub-btn--primary pub-btn--lg" onClick={onSignup}>Criar minha conta <ArrowRight size={18} /></button>
              <button type="button" className="pub-btn pub-btn--ghost pub-btn--lg" onClick={onTour}><Eye size={18} /> Ver por dentro</button>
            </div>
            <div className="pub-trust">
              <span><ShieldCheck size={15} /> Bloqueio e denúncia em qualquer perfil</span>
              <span><Lock size={15} /> Você escolhe o que mostrar</span>
              <span><Check size={15} /> Sem precisar de cartão para começar</span>
            </div>
          </div>

          <div className="pub-stage" aria-hidden="true">
            <span className="pub-stage__ring" />
            <div className="pub-phone">
              <div className="pub-phone__screen">
                <div className="pub-phone__top">
                  <Avatar name="Marina Alves" hue={285} />
                  <div><strong>Marina Alves</strong><small>● online agora</small></div>
                </div>
                <div className="pub-phone__body">
                  <div className="mock-bubble">Oi! Vi que você também curte trilha 😊</div>
                  <div className="mock-bubble mock-bubble--me">Curto muito! Qual foi a melhor?</div>
                  <div className="mock-bubble"><span className="mock-reply">Qual foi a melhor?</span>Serra do Cipó. Vamos marcar uma?</div>
                  <div className="mock-bubble mock-bubble--me">Combinado, sábado então!</div>
                </div>
                <div className="pub-phone__input">Escreva uma mensagem…</div>
              </div>
            </div>
            <div className="pub-float pub-float--a"><span className="pub-float__ico"><Bell size={17} /></span><div><strong>Novo seguidor</strong><small>Rafael começou a seguir você</small></div></div>
            <div className="pub-float pub-float--b"><span className="pub-float__ico pub-float__ico--live"><Radio size={17} /></span><div><strong>Live começando</strong><small>118 pessoas assistindo</small></div></div>
            <div className="pub-float pub-float--c"><span className="pub-float__ico pub-float__ico--lime"><MapPin size={17} /></span><div><strong>Sala · São Paulo</strong><small>23 pessoas conversando</small></div></div>
          </div>
        </div>
      </section>

      {/* ───────────── Recursos ───────────── */}
      <section className="pub-section" id="recursos">
        <div className="pub-head" data-reveal>
          <span className="pub-eyebrow">Uma experiência completa</span>
          <h2 className="pub-h2">Tudo o que aproxima, em um só lugar.</h2>
          <p className="pub-sub">Do primeiro oi à próxima amizade: ferramentas pensadas para funcionar juntas.</p>
        </div>
        <div className="pub-features">
          {[
            { i: <Users size={22} />, k: "01 · Pessoas", t: "Encontre sua turma", p: "Descubra perfis, filtre por estado e cidade, siga pessoas e envie pedidos de conversa." },
            { i: <MessageCircle size={22} />, k: "02 · Conversas", t: "Fique por perto", p: "Converse em privado, responda mensagens específicas, envie imagens, áudios e arquivos." },
            { i: <Globe2 size={22} />, k: "03 · Comunidades", t: "Faça parte", p: "Entre na sala do Brasil ou na do seu estado e participe de conversas em tempo real." },
            { i: <Radio size={22} />, k: "04 · Ao vivo", t: "Viva o agora", p: "Assista transmissões, peça para entrar no palco e participe com câmera e microfone." },
          ].map((f, n) => (
            <article className="pub-feature" key={f.k} data-reveal style={{ ["--d" as string]: n * 0.08 + "s" }}>
              <span className="pub-feature__ico">{f.i}</span><small>{f.k}</small><h3>{f.t}</h3><p>{f.p}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ───────────── Por dentro ───────────── */}
      <section className="pub-section pub-section--tint" id="por-dentro">
        <div className="pub-inner" style={{ padding: "clamp(56px,8vw,112px) clamp(16px,4vw,56px)" }}>
          <div className="pub-head" data-reveal>
            <span className="pub-eyebrow">Por dentro do CONNECT</span>
            <h2 className="pub-h2">Veja como cada parte funciona.</h2>
            <p className="pub-sub">As telas abaixo são ilustrativas, com nomes e conteúdos fictícios.</p>
          </div>

          <div className="pub-row" data-reveal>
            <div className="pub-row__copy">
              <span className="pub-eyebrow">Feed e perfis</span>
              <h3>Compartilhe momentos com quem importa.</h3>
              <p>Publique textos, fotos e vídeos, curta e comente. Seu perfil reúne foto, banner, bio, publicações e quem segue você.</p>
              <ul className="pub-ticks">
                <li><Check size={16} /> Curtidas, comentários e respostas</li>
                <li><Check size={16} /> Edição de foto e banner com recorte</li>
                <li><Check size={16} /> Seguidores e quem você segue</li>
              </ul>
            </div>
            <div className="pub-row__visual" aria-hidden="true">
              <div className="mock-window"><div className="mock-window__bar"><i /><i /><i /><span>Feed</span></div>
                <div className="mock-window__body">
                  <div className="mock-post">
                    <div className="mock-post__head"><Avatar name="Marina Alves" hue={285} /><div><strong>Marina Alves</strong><small>@marina.alves · 12 min</small></div></div>
                    <p style={{ fontSize: 13 }}>Primeira trilha do ano na Serra do Cipó. Quem anima a próxima?</p>
                    <div className="mock-post__art" />
                    <div className="mock-post__actions"><span><Heart size={15} /> 24</span><span><MessageCircle size={15} /> 2</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pub-row pub-row--flip" data-reveal>
            <div className="pub-row__copy">
              <span className="pub-eyebrow">Pessoas e conexões</span>
              <h3>Descubra gente nova sem pressa.</h3>
              <p>Explore o diretório de pessoas, filtre por localização e siga perfis. Quando quiser, entre na fila de conexão para conversar com alguém.</p>
              <ul className="pub-ticks">
                <li><Check size={16} /> Busca e filtros por estado e cidade</li>
                <li><Check size={16} /> Você controla a visibilidade da sua localização</li>
                <li><Check size={16} /> Bloqueio em ambos os sentidos</li>
              </ul>
            </div>
            <div className="pub-row__visual" aria-hidden="true">
              <div className="mock-window"><div className="mock-window__bar"><i /><i /><i /><span>Pessoas</span></div>
                <div className="mock-window__body"><div className="mock-people">
                  {[["Júlia Campos", 340, "Curitiba · PR"], ["Caio Ferraz", 25, "Porto Alegre · RS"], ["Beatriz Lima", 160, "Salvador · BA"]].map(([n, h, c]) => (
                    <div className="mock-person" key={n as string}><Avatar name={n as string} hue={h as number} size="lg" /><strong>{n}</strong><small>{c}</small><span className="mock-chip"><Users size={11} /> Seguir</span></div>
                  ))}
                </div></div>
              </div>
            </div>
          </div>

          <div className="pub-row" data-reveal>
            <div className="pub-row__copy">
              <span className="pub-eyebrow">Chat e mensagens</span>
              <h3>Conversas que fluem.</h3>
              <p>Lista de conversas, respostas a mensagens específicas, exclusão das suas próprias mensagens e anexos de imagem, áudio e arquivo.</p>
              <ul className="pub-ticks">
                <li><Check size={16} /> Responder a uma mensagem</li>
                <li><Check size={16} /> Imagens, áudios e arquivos</li>
                <li><Check size={16} /> Pedidos de mensagem antes de conversar</li>
              </ul>
            </div>
            <div className="pub-row__visual" aria-hidden="true">
              <div className="mock-window"><div className="mock-window__bar"><i /><i /><i /><span>Conversas</span></div>
                <div className="mock-chat">
                  <div className="mock-chat__list">
                    {[["Marina Alves", 285, "Combinado, sábado!", true], ["Caio Ferraz", 25, "Manda o link da live", false], ["Beatriz Lima", 160, "Adorei o seu perfil", false]].map(([n, h, l, on]) => (
                      <div className={"mock-chat__item" + (on ? " on" : "")} key={n as string}><Avatar name={n as string} hue={h as number} size="sm" /><div><strong>{(n as string).split(" ")[0]}</strong><small>{l}</small></div></div>
                    ))}
                  </div>
                  <div className="mock-chat__thread">
                    <div className="mock-bubble">Vamos marcar uma trilha?</div>
                    <div className="mock-bubble mock-bubble--me">Bora! Que tal sábado?</div>
                    <div className="mock-bubble"><span className="mock-reply">Que tal sábado?</span>Combinado, sábado então!</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pub-row pub-row--flip" data-reveal>
            <div className="pub-row__copy">
              <span className="pub-eyebrow">Salas do Brasil e dos estados</span>
              <h3>Uma conversa para cada canto do país.</h3>
              <p>Entre na sala do Brasil ou escolha o seu estado. Veja a sala atual com clareza, responda mensagens e participe em tempo real.</p>
              <ul className="pub-ticks">
                <li><Check size={16} /> Sala nacional e uma sala por estado</li>
                <li><Check size={16} /> Respostas e mensagens em tempo real</li>
              </ul>
            </div>
            <div className="pub-row__visual" aria-hidden="true">
              <div className="mock-window"><div className="mock-window__bar"><i /><i /><i /><span>Salas</span></div>
                <div className="mock-window__body mock-rooms">
                  <div className="mock-states">{["Brasil", "SP", "RJ", "MG", "BA", "RS", "PE", "PR"].map((s, n) => <span key={s} className={n === 3 ? "on" : ""}>{s}</span>)}</div>
                  <div className="mock-room-msg"><Avatar name="Marina Alves" hue={285} size="sm" /><p><b>Marina</b>Alguém de BH para um café no sábado?</p></div>
                  <div className="mock-room-msg"><Avatar name="Tiago Moreira" hue={250} size="sm" /><p><b>Tiago</b>Eu! Conheço um lugar ótimo na Savassi.</p></div>
                </div>
              </div>
            </div>
          </div>

          <div className="pub-row" data-reveal>
            <div className="pub-row__copy">
              <span className="pub-eyebrow">Transmissões ao vivo</span>
              <h3>Um palco para o agora.</h3>
              <p>Prepare a live, verifique câmera e microfone, receba pedidos de convidados e acompanhe quem está assistindo.</p>
              <ul className="pub-ticks">
                <li><Check size={16} /> Controles de câmera, microfone e saída</li>
                <li><Check size={16} /> Convidados no palco e lista de transmissões</li>
              </ul>
            </div>
            <div className="pub-row__visual" aria-hidden="true">
              <div className="mock-window"><div className="mock-window__bar"><i /><i /><i /><span>Ao vivo</span></div>
                <div className="mock-window__body">
                  <div className="mock-live">
                    <span className="mock-live__badge"><i /> AO VIVO</span>
                    <Avatar name="Tiago Moreira" hue={250} size="lg" />
                    <span className="mock-live__tile"><Avatar name="Caio Ferraz" hue={25} size="sm" /></span>
                    <div className="mock-live__controls"><span><Mic size={16} /></span><span><Video size={16} /></span><span className="end"><PhoneOff size={16} /></span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pub-row pub-row--flip" data-reveal>
            <div className="pub-row__copy">
              <span className="pub-eyebrow">Notificações</span>
              <h3>Você sabe de tudo que importa.</h3>
              <p>A central avisa sobre mensagens, pedidos, novos seguidores, conexões, lives e publicações — com leitura individual ou em lote.</p>
              <ul className="pub-ticks">
                <li><Check size={16} /> Marcar como lida e abrir o conteúdo</li>
                <li><Check size={16} /> Avisos do navegador, se você permitir</li>
              </ul>
            </div>
            <div className="pub-row__visual" aria-hidden="true">
              <div className="mock-window"><div className="mock-window__bar"><i /><i /><i /><span>Notificações</span></div>
                <div className="mock-window__body mock-notif">
                  <div className="mock-notif__item unread"><span className="mock-notif__ico" style={{ background: "var(--brand)" }}><MessageCircle size={16} /></span><div><strong>Nova mensagem</strong><small>Marina Alves · agora</small></div></div>
                  <div className="mock-notif__item"><span className="mock-notif__ico" style={{ background: "#e5484d" }}><Radio size={16} /></span><div><strong>Live começando</strong><small>Tiago Moreira · 25 min</small></div></div>
                  <div className="mock-notif__item"><span className="mock-notif__ico" style={{ background: "#3f8a5f" }}><Users size={16} /></span><div><strong>Novo seguidor</strong><small>Rafael Nogueira · 1 h</small></div></div>
                </div>
              </div>
            </div>
          </div>

          <div className="pub-cta-row" style={{ justifyContent: "center", marginTop: 56 }} data-reveal>
            <button type="button" className="pub-btn pub-btn--primary pub-btn--lg" onClick={onTour}><Eye size={18} /> Explorar a demonstração navegável</button>
          </div>
        </div>
      </section>

      {/* ───────────── Como funciona ───────────── */}
      <section className="pub-section" id="como-funciona">
        <div className="pub-head" data-reveal>
          <span className="pub-eyebrow">Como funciona</span>
          <h2 className="pub-h2">Três passos para começar.</h2>
        </div>
        <div className="pub-steps">
          {[
            ["Crie sua conta", "Escolha seu nome e seu @, diga como se identifica e quem gostaria de conhecer."],
            ["Monte seu perfil", "Adicione foto, banner e bio e defina o que quer mostrar sobre você."],
            ["Comece a conectar", "Explore o feed, entre nas salas, siga pessoas e converse quando quiser."],
          ].map(([t, p], n) => (
            <article className="pub-step" key={t} data-reveal style={{ ["--d" as string]: n * 0.1 + "s" }}><h3>{t}</h3><p>{p}</p></article>
          ))}
        </div>
      </section>

      {/* ───────────── Planos ───────────── */}
      <section className="pub-section pub-section--tint" id="planos">
        <div className="pub-inner" style={{ padding: "clamp(56px,8vw,112px) clamp(16px,4vw,56px)" }}>
          <div className="pub-head" data-reveal>
            <span className="pub-eyebrow">Assinatura</span>
            <h2 className="pub-h2">Mais buscas, mais conexões.</h2>
            <p className="pub-sub">O pacote CONNECT libera buscas ilimitadas.</p>
          </div>
          <div className="pub-plans" data-reveal>
            {state === "loading" && [0, 1].map(n => (
              <article className="pub-plan" key={n}><h3>Pacote CONNECT</h3><div className="pub-plan__skeleton" /><p>Carregando valores…</p></article>
            ))}
            {state === "ready" && plans.map((p, n) => (
              <article className={"pub-plan" + (p.billing_interval === "year" ? " pub-plan--hot" : "")} key={p.id}>
                {p.billing_interval === "year" && <span className="pub-plan__flag">Melhor custo</span>}
                <h3>{p.name}</h3>
                <div className="pub-plan__price">{formatBRL(Number(p.price_brl))} <small>/ {p.billing_interval === "year" ? "ano" : "mês"}</small></div>
                <p>{p.description}</p>
                <ul className="pub-ticks">
                  <li><Crown size={16} /> Buscas ilimitadas</li>
                  <li><Sparkles size={16} /> Renovação automática</li>
                </ul>
                <button type="button" className={"pub-btn " + (n === plans.length - 1 ? "pub-btn--primary" : "pub-btn--ghost")} onClick={onSignup}>Criar conta e assinar <ArrowRight size={16} /></button>
              </article>
            ))}
            {(state === "error" || (state === "ready" && plans.length === 0)) && (
              <article className="pub-plan">
                <h3>Pacote CONNECT</h3>
                <p>Buscas ilimitadas com renovação automática, mensal ou anual. Os valores aparecem dentro da sua conta, na aba Assinatura.</p>
                <button type="button" className="pub-btn pub-btn--primary" onClick={onSignup}>Criar minha conta <ArrowRight size={16} /></button>
              </article>
            )}
          </div>
          <p className="pub-plans-note">Pagamento processado pelo Mercado Pago, com cartão ou Pix.</p>
        </div>
      </section>

      {/* ───────────── Privacidade ───────────── */}
      <section className="pub-section">
        <div className="pub-head" data-reveal>
          <span className="pub-eyebrow">Seu espaço, suas escolhas</span>
          <h2 className="pub-h2">Segurança e respeito no centro.</h2>
        </div>
        <div className="pub-safe" data-reveal>
          <div><Ban size={22} /><strong>Bloqueio</strong><span>Bloqueie perfis e deixe de ver e ser visto por eles.</span></div>
          <div><Flag size={22} /><strong>Denúncia</strong><span>Denuncie perfis, publicações e outros conteúdos.</span></div>
          <div><MapPin size={22} /><strong>Localização</strong><span>Você decide se sua localização aparece no perfil.</span></div>
          <div><Lock size={22} /><strong>Sua conta</strong><span>Peça a exclusão da conta quando quiser.</span></div>
        </div>
      </section>

      {/* ───────────── Chamada final ───────────── */}
      <section className="pub-final" data-reveal aria-labelledby="final-title">
        <h2 id="final-title">Pronto para se conectar?</h2>
        <p>Crie sua conta em poucos minutos ou dê uma olhada por dentro antes.</p>
        <div className="pub-cta-row">
          <button type="button" className="pub-btn pub-btn--primary pub-btn--lg" onClick={onSignup}>Criar minha conta <ArrowRight size={18} /></button>
          <button type="button" className="pub-btn pub-btn--ghost pub-btn--lg" onClick={onTour}><Eye size={18} /> Ver por dentro</button>
        </div>
      </section>

      <footer className="pub-footer">
        <a className="pub-brand" href="#inicio" style={{ fontSize: 18 }}><img src="/Connect/connect-mark.svg" alt="" style={{ width: 28, height: 28 }} /> connect</a>
        <nav aria-label="Rodapé">
          <a href="/Connect/download/"><Download size={13} style={{ verticalAlign: -2 }} /> Baixar o app</a>
          <button type="button" className="pub-btn pub-btn--text" style={{ minHeight: 0, padding: 0, fontSize: 12 }} onClick={onSignin}>Entrar</button>
        </nav>
        <span>© CONNECT 2026 · Feito para conectar pessoas.</span>
      </footer>
    </main>
  );
}

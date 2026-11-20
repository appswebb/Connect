"use client";

import { useState } from "react";
import { Activity, ArrowRight, Compass, Globe2, Heart, LockKeyhole, MessageCircle, MessageSquare, ShieldCheck, UserPlus, UserSearch, X } from "lucide-react";
import { brazilStates } from "../lib/brazil";
import { stateFlags } from "../lib/connect-data";

type Props = {
  onBack: () => void;
  onSignUp: () => void;
  onSignIn: () => void;
  onDemo: () => void;
};

export default function ConnectGuestExplorer({ onBack, onSignUp, onSignIn, onDemo }: Props) {
  const [guestTab, setGuestTab] = useState<"feed" | "rooms" | "queue">("feed");
  const [roomCode, setRoomCode] = useState("BR");
  const [promptAction, setPromptAction] = useState("");

  const roomLabel = roomCode === "BR" ? "Brasil inteiro" : brazilStates[roomCode] || roomCode;

  return (
    <main className="connect-app guest-mode-shell" data-screen="guest-workspace">
      <aside className="connect-rail" aria-label="Navegação de visitante">
        <a className="brand" href="#inicio" onClick={(e) => { e.preventDefault(); onBack(); }}>
          <span className="brand-icon">
            <img className="connect-brand-symbol" src="/connect-mark.svg" alt="" />
          </span>
          <span>CONNECT</span>
        </a>
        <nav aria-label="Explorar CONNECT">
          <button type="button" className={guestTab === "feed" ? "selected" : ""} onClick={() => setGuestTab("feed")}>
            <Compass size={17} />
            <span>Início</span>
          </button>
          <button type="button" className={guestTab === "rooms" ? "selected" : ""} onClick={() => setGuestTab("rooms")}>
            <Globe2 size={17} />
            <span>Salas do Brasil</span>
          </button>
          <button type="button" className={guestTab === "queue" ? "selected" : ""} onClick={() => setGuestTab("queue")}>
            <UserSearch size={17} />
            <span>Conectar</span>
          </button>
        </nav>
        <span className="sidebar-spacer" />
        <span className="sidebar-caption"><i /> MODO VISITANTE · PRÉVIA PÚBLICA</span>
      </aside>

      <section className="connect-main">
        <header className="topbar">
          <div className="mobile-brand">
            <img src="/connect-mark.svg" alt="" />
            CONNECT
          </div>
          <small>
            <i /> VISITANTE · CONHEÇA O CONNECT
          </small>
          <div className="topbar-actions">
            <button type="button" className="secondary" onClick={onBack}>
              Voltar
            </button>
            <button type="button" className="secondary" onClick={onSignIn}>
              Entrar
            </button>
            <button type="button" className="primary" onClick={onSignUp}>
              Criar conta <ArrowRight size={15} />
            </button>
          </div>
        </header>

        <div className="guest-banner" role="status">
          <ShieldCheck size={16} />
          <span>Você está explorando como visitante. Crie uma conta gratuita para publicar, curtir, seguir e conversar.</span>
        </div>

        {guestTab === "feed" && (
          <>
            <div className="heading">
              <div>
                <small>PRÉVIA DO FEED</small>
                <h1>
                  Descubra o que <em>aproxima.</em>
                </h1>
                <p>No CONNECT, você compartilha momentos, comenta e conhece novas pessoas no seu ritmo.</p>
              </div>
            </div>
            <section className="guest-preview-card">
              <div className="guest-preview-copy">
                <MessageSquare size={22} />
                <div>
                  <strong>Feed protegido pela comunidade</strong>
                  <p>As publicações dos membros ficam protegidas para quem faz parte da comunidade. Entre ou crie sua conta para ler e participar.</p>
                </div>
              </div>
              <div className="guest-preview-actions">
                <button type="button" className="secondary" onClick={() => setPromptAction("curtir ou comentar no feed")}>
                  <Heart size={15} /> Curtir / Comentar
                </button>
                <button type="button" className="secondary" onClick={() => setPromptAction("enviar mensagens")}>
                  <MessageCircle size={15} /> Enviar mensagem
                </button>
                <button type="button" className="primary" onClick={onSignUp}>
                  <UserPlus size={15} /> Criar conta grátis
                </button>
              </div>
            </section>
          </>
        )}

        {guestTab === "rooms" && (
          <section className="people-state-rooms">
            <div className="people-state-rooms-heading">
              <div>
                <small>COMUNIDADE POR REGIÃO</small>
                <h2>Salas do Brasil</h2>
                <p>28 espaços organizados por todo o Brasil e cada um dos 27 estados.</p>
              </div>
              <span>
                <Globe2 size={16} /> 28 salas
              </span>
            </div>
            <section className="rooms-panel">
              <div className="room-select">
                <button type="button" className={roomCode === "BR" ? "active" : ""} onClick={() => setRoomCode("BR")}>
                  <img src={stateFlags.BR} alt="Bandeira do Brasil" /> Brasil inteiro
                </button>
                <span>Escolha uma sala estadual</span>
              </div>
              <div className="state-room-grid">
                {Object.entries(brazilStates).map(([code, label]) => (
                  <button type="button" key={code} className={roomCode === code ? "active" : ""} onClick={() => setRoomCode(code)} aria-label={label}>
                    <img src={stateFlags[code]} alt={"Bandeira de " + label} />
                    <span>{code}</span>
                  </button>
                ))}
              </div>
              <div className="room-title">
                <img className="room-title-flag" src={stateFlags[roomCode] || stateFlags.BR} alt={roomLabel} />
                <div>
                  <strong>{roomCode === "BR" ? "Chat Global do Brasil" : "Chat de " + roomLabel + " · " + roomCode}</strong>
                  <small>Entre na sua conta para participar desta sala em tempo real.</small>
                </div>
              </div>
              <div className="guest-preview-actions">
                <button type="button" className="primary" onClick={() => setPromptAction("conversar na sala " + roomLabel)}>
                  Participar da sala <ArrowRight size={15} />
                </button>
              </div>
            </section>
          </section>
        )}

        {guestTab === "queue" && (
          <>
            <div className="heading">
              <div>
                <small>CONEXÃO EM TEMPO REAL</small>
                <h1>
                  Encontre alguém <em>agora.</em>
                </h1>
                <p>Matching por preferências e cidade com janela de confirmação de 5 minutos.</p>
              </div>
            </div>
            <section className="queue-card">
              <div className="connection-art">
                <div className="connection-stage" aria-hidden="true">
                  <div className="ring r1" />
                  <div className="ring r2" />
                  <div className="ring r3" />
                  <div className="core">
                    <Activity size={30} />
                  </div>
                </div>
                <span className="connection-art-caption">CONEXÃO POR PREFERÊNCIAS</span>
              </div>
              <div>
                <small className="queue-kicker">COMO FUNCIONA</small>
                <h2>Converse antes de decidir.</h2>
                <p>Quando duas pessoas compatíveis se encontram na fila, vocês ganham uma sala temporária para conversar e confirmar o match.</p>
                <button type="button" className="primary" onClick={() => setPromptAction("entrar na fila de conexões")}>
                  Entrar na fila <ArrowRight size={15} />
                </button>
              </div>
            </section>
          </>
        )}
      </section>

      {promptAction && (
        <div className="crop-backdrop" role="dialog" aria-modal="true" aria-label="Entre no CONNECT para continuar" onClick={() => setPromptAction("")}>
          <section className="report-dialog guest-auth-prompt" onClick={(e) => e.stopPropagation()}>
            <header>
              <div>
                <small>CONTA CONNECT</small>
                <h2>Entre para {promptAction}</h2>
              </div>
              <button type="button" aria-label="Fechar convite" onClick={() => setPromptAction("")}>
                <X />
              </button>
            </header>
            <p>
              <LockKeyhole size={15} /> Para manter a comunidade segura e evitar spam, interações e perfis completos exigem uma conta CONNECT.
            </p>
            <footer>
              <button type="button" className="secondary" onClick={onDemo}>
                Acesso demo
              </button>
              <button type="button" className="secondary" onClick={onSignIn}>
                Entrar
              </button>
              <button type="button" className="primary" onClick={onSignUp}>
                Criar conta <ArrowRight size={15} />
              </button>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}

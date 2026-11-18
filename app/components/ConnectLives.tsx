"use client";

import type { FormEvent } from "react";
import { ArrowRight, Camera, Flag, Radio, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";

const LiveRoom = dynamic(() => import("./LiveRoom"), {
  ssr: false,
  loading: () => <div className="live-module-loading" role="status">Preparando transmissão...</div>,
});
import type { LiveSessionRow } from "../types/connect";

type ConnectLivesProps = {
  lives: LiveSessionRow[];
  activeLive: LiveSessionRow | null;
  currentUserId: string;
  leaveLive: () => void;
  isDemo: boolean;
  liveTitle: string;
  setLiveTitle: (value: string) => void;
  createLive: (event: FormEvent) => void;
  busy: boolean;
  loadLives: () => void;
  endLiveSession: (liveId: string) => void;
  joinLive: (live: LiveSessionRow) => void;
  openReport: (userId: string, targetType?: string, targetId?: string) => void;
};

export default function ConnectLives(props: ConnectLivesProps) {
  const { lives, activeLive, currentUserId, leaveLive, isDemo, liveTitle, setLiveTitle, createLive, busy, loadLives, endLiveSession, joinLive, openReport } = props;
  return (
    <>
      {
        <section className="people-live-section">
          <div className="people-live-section-heading">
            <div>
              <small>CONNECT LIVE</small>
              <h2>Ao vivo na comunidade</h2>
              <p>Assista às transmissões ou comece a sua.</p>
            </div>
            <span>
              <i className="people-live-dot" /> {lives.length} {lives.length === 1 ? "transmissão ativa" : "transmissões ativas"}
            </span>
          </div>
          <div className="people-live-intro">
            <Radio size={17} />
            <span>
              <strong>Sua próxima transmissão começa aqui</strong>
              <small>Defina um título, confira câmera e microfone e entre ao vivo quando estiver pronto.</small>
            </span>
          </div>
          {activeLive ? (
            <LiveRoom liveId={activeLive.id} isHost={activeLive.host_user_id === currentUserId} onLeave={() => void leaveLive()} />
          ) : (
            <>
              {!isDemo && (
                <form className="live-create live-create-enhanced" onSubmit={createLive}>
                  <div className="live-create-copy">
                    <span className="live-create-icon">
                      <Camera size={22} />
                    </span>
                    <div>
                      <strong>Prepare sua live</strong>
                      <small>Escolha um título que convide as pessoas para participar.</small>
                    </div>
                  </div>
                  <label>
                    Nome da transmissão
                    <input
                      value={liveTitle}
                      onChange={(e) => setLiveTitle(e.target.value)}
                      minLength={3}
                      maxLength={90}
                      required
                      placeholder="Ex.: Conversando com a galera"
                    />
                  </label>
                  <button className="primary" disabled={busy || liveTitle.trim().length < 3}>
                    <Radio size={16} />
                    {busy ? "Preparando..." : "Iniciar uma live"}
                  </button>
                </form>
              )}
              {isDemo && (
                <div className="demo-readonly-note">
                  No modo de demonstração, você pode assistir às lives, mas não iniciar nem encerrar transmissões.
                </div>
              )}
              <div className="live-list-heading">
                <strong>Transmissões ao vivo</strong>
                <button className="secondary" onClick={() => void loadLives()}>
                  Atualizar
                </button>
              </div>
              <div className="live-list">
                {lives.map((live) => (
                  <article key={live.id}>
                    <div className="live-list-icon">
                      <Radio />
                    </div>
                    <div>
                      <strong>{live.title}</strong>
                      <span>
                        {live.host?.display_name || "Pessoa da comunidade"} · @{live.host?.username || "connect"}
                      </span>
                      <small>
                        AO VIVO · {new Date(live.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </small>
                    </div>
                    {live.host_user_id === currentUserId ? (
                      <button type="button" className="live-end-list" disabled={busy} onClick={() => void endLiveSession(live.id)}>
                        <Trash2 size={14} /> Encerrar live
                      </button>
                    ) : (
                      <div className="live-card-actions">
                        <button
                          type="button"
                          className="content-report-action"
                          onClick={() => openReport(live.host_user_id, "live", live.id)}
                        >
                          <Flag size={12} /> Denunciar
                        </button>
                        <button className="primary" onClick={() => void joinLive(live)}>
                          Assistir <ArrowRight size={14} />
                        </button>
                      </div>
                    )}
                  </article>
                ))}
                {!lives.length && (
                  <div className="empty empty-live">
                    <img src="/Connect/images/live-creator.webp" alt="" loading="lazy" width={1024} height={1024} />
                    <h3>Ninguém está ao vivo agora.</h3>
                    <p>Seja a primeira pessoa a iniciar uma transmissão.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      }
    </>
  );
}

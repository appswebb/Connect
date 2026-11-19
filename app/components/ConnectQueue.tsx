"use client";

import type { Dispatch, FormEvent, RefObject, SetStateAction } from "react";
import { Activity, ArrowRight, Ban, Check, Download, FileText, Flag, Heart, Mic, Minus, Paperclip, Radio, Send, Square, Users, X } from "lucide-react";
import Avatar from "./ConnectAvatar";
import ImageCropper from "./ImageCropper";
import type { Message, Profile } from "../types/connect";

type Props = {
  tab: string;
  profile: Profile;
  currentUserId: string;
  pendingMatchId: string | null;
  pendingPartner: Profile | null;
  showMatchIntro: boolean;
  setShowMatchIntro: Dispatch<SetStateAction<boolean>>;
  pendingSeconds: number;
  pendingChatMinimized: boolean;
  setPendingChatMinimized: Dispatch<SetStateAction<boolean>>;
  respondToMatch: (accepted: boolean) => void | Promise<void>;
  openProfile: (id: string) => void | Promise<void>;
  openReport: (userId: string, targetType?: string, targetId?: string) => void;
  blockUser: (id: string) => void | Promise<void>;
  messages: Message[];
  cropFile: File | null;
  cropTarget: "post" | "avatar" | "banner" | "chat" | null;
  setCropFile: Dispatch<SetStateAction<File | null>>;
  setCropTarget: Dispatch<SetStateAction<"post" | "avatar" | "banner" | "chat" | null>>;
  applyCroppedImage: (file: File) => void | Promise<void>;
  send: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  chatFileRef: RefObject<HTMLInputElement | null>;
  recording: boolean;
  toggleRecording: () => void | Promise<void>;
  busy: boolean;
  draft: string;
  setDraft: Dispatch<SetStateAction<string>>;
  openImageCrop: (file: File, target: "post" | "avatar" | "banner" | "chat") => void;
  sendAttachment: (file: File, kind: "image" | "audio" | "file", duration?: number) => void | Promise<void>;
  pendingAccepted: boolean;
  pendingOtherAccepted: boolean;
  queue: string;
  queueCityFilter: string;
  queueStateFilter: string;
  queueQuota: { unlimited: boolean; remaining: number; used: number };
  matchId: string | null;
  setTab: Dispatch<SetStateAction<string>>;
  isDemo: boolean;
  enterQueue: () => void | Promise<void>;
  leaveQueue: () => void | Promise<void>;
};

export default function ConnectQueue(props: Props) {
  const {
    tab, profile, currentUserId, pendingMatchId, pendingPartner, showMatchIntro,
    setShowMatchIntro, pendingSeconds, pendingChatMinimized, setPendingChatMinimized,
    respondToMatch, openProfile, openReport, blockUser, messages, cropFile, cropTarget,
    setCropFile, setCropTarget, applyCroppedImage, send, chatFileRef, recording,
    toggleRecording, busy, draft, setDraft, openImageCrop, sendAttachment,
    pendingAccepted, pendingOtherAccepted, queue, queueCityFilter, queueStateFilter,
    queueQuota, matchId, setTab, isDemo, enterQueue, leaveQueue,
  } = props;

  return (
          <>
            {pendingMatchId && pendingPartner && showMatchIntro && (
              <div className="match-found-backdrop" role="dialog" aria-modal="true" aria-label="Vocês se encontraram">
                <section className="match-found-card">
                  <div className="match-found-kicker">
                    <i /> CONEXÃO ENCONTRADA
                  </div>
                  <div className="match-found-avatars">
                    <div className="match-found-avatar first">
                      <Avatar p={profile} size="large" />
                    </div>
                    <div className="match-found-heart">
                      <Heart size={23} fill="currentColor" />
                    </div>
                    <div className="match-found-avatar second">
                      <Avatar p={pendingPartner} size="large" />
                    </div>
                  </div>
                  <div className="match-found-names">
                    <strong>{profile?.display_name || "Você"}</strong>
                    <span>+</span>
                    <strong>{pendingPartner.display_name}</strong>
                  </div>
                  <h2>Vocês se encontraram!</h2>
                  <p>Uma nova conexão acabou de acontecer. Vocês têm 3 minutos para conversar e decidir se querem dar match.</p>
                  <div className="match-found-countdown">
                    {Math.floor(pendingSeconds / 60)}:{String(pendingSeconds % 60).padStart(2, "0")} <small>restantes</small>
                  </div>
                  <button className="primary" onClick={() => setShowMatchIntro(false)}>
                    Começar conversa <ArrowRight />
                  </button>
                </section>
              </div>
            )}
            {pendingMatchId &&
              pendingPartner &&
              !showMatchIntro &&
              (pendingChatMinimized ? (
                <section className="chat-minimized queue-match-minimized">
                  <div>
                    <Avatar p={pendingPartner} size="small" />
                    <span>
                      <strong>{pendingPartner.display_name}</strong>
                      <small>
                        Encontro temporário · {Math.floor(pendingSeconds / 60)}:{String(pendingSeconds % 60).padStart(2, "0")} restantes
                      </small>
                    </span>
                  </div>
                  <button className="secondary" type="button" onClick={() => setPendingChatMinimized(false)}>
                    Reabrir conversa
                  </button>
                  <button className="chat-close-mini" type="button" onClick={() => void respondToMatch(false)} title="Encerrar encontro">
                    <X />
                  </button>
                </section>
              ) : (
                <section className="chat queue-match-chat">
                  <header>
                    <button type="button" className="profile-open-avatar" onClick={() => void openProfile(pendingPartner.id)}>
                      <Avatar p={pendingPartner} />
                    </button>
                    <div className="chat-person-info">
                      <strong>{pendingPartner.display_name}</strong>
                      <span>@{pendingPartner.username} · encontro temporário</span>
                    </div>
                    <strong className="match-live-timer">
                      {Math.floor(pendingSeconds / 60)}:{String(pendingSeconds % 60).padStart(2, "0")}
                    </strong>
                    <button type="button" title="Denunciar pessoa" onClick={() => openReport(pendingPartner.id)}>
                      <Flag />
                    </button>
                    <button type="button" title="Bloquear pessoa" onClick={() => void blockUser(pendingPartner.id)}>
                      <Ban />
                    </button>
                    <button type="button" title="Minimizar conversa" onClick={() => setPendingChatMinimized(true)}>
                      <Minus />
                    </button>
                  </header>
                  <div className="match-live-progress">
                    <i style={{ width: (pendingSeconds / 180) * 100 + "%" }} />
                  </div>
                  <div className="queue-match-status">
                    {pendingAccepted
                      ? "Você aceitou o match. Aguardando a outra pessoa."
                      : pendingOtherAccepted
                        ? "A outra pessoa aceitou. Se você também aceitar, o match será confirmado."
                        : "Conversem por até 3 minutos. O match só acontece se os dois aceitarem."}
                  </div>
                  <div className="messages">
                    {messages.map((m) => (
                      <div key={m.id} className={"bubble " + (m.sender_id === currentUserId ? "mine" : "")}>
                        {m.attachment_path && m.attachment_url ? (
                          <div className="chat-attachment">
                            {m.attachment_mime?.startsWith("image/") ? (
                              <a href={m.attachment_url} target="_blank" rel="noreferrer">
                                <img src={m.attachment_url} alt={m.attachment_name || "Imagem enviada"} />
                              </a>
                            ) : m.message_type === "audio" || m.attachment_mime?.startsWith("audio/") ? (
                              <audio src={m.attachment_url} controls preload="metadata" />
                            ) : m.attachment_mime?.startsWith("video/") ? (
                              <video src={m.attachment_url} controls />
                            ) : (
                              <a className="chat-file" href={m.attachment_url} download={m.attachment_name || "arquivo"}>
                                <FileText />
                                <span>
                                  {m.attachment_name || "Arquivo"}
                                  <small>{m.attachment_size ? Math.max(1, Math.round(m.attachment_size / 1024)) + " KB" : "Anexo"}</small>
                                </span>
                                <Download />
                              </a>
                            )}
                            {m.body && <p>{m.body}</p>}
                          </div>
                        ) : (
                          m.body
                        )}
                        {!isDemo && m.sender_id !== currentUserId && (
                          <button
                            type="button"
                            className="content-report-action"
                            onClick={() => openReport(m.sender_id, "chat_message", m.id)}
                          >
                            <Flag size={12} /> Denunciar mensagem
                          </button>
                        )}
                        <small>{new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</small>
                      </div>
                    ))}
                    {!messages.length && <p className="chat-empty">A conversa começou! Diga oi.</p>}
                  </div>
                  <form className="chat-compose" onSubmit={send}>
                    <div className="chat-tools">
                      <button
                        type="button"
                        onClick={() => chatFileRef.current?.click()}
                        title="Enviar foto, vídeo ou arquivo"
                        disabled={busy}
                      >
                        <Paperclip />
                      </button>
                      <input
                        ref={chatFileRef}
                        type="file"
                        hidden
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            if (f.type.startsWith("image/")) openImageCrop(f, "chat");
                            else void sendAttachment(f, f.type.startsWith("audio/") ? "audio" : "file");
                          }
                          e.currentTarget.value = "";
                        }}
                      />
                      <button
                        type="button"
                        className={recording ? "recording" : ""}
                        onClick={() => void toggleRecording()}
                        title={recording ? "Parar gravação" : "Gravar áudio"}
                        disabled={busy}
                      >
                        {recording ? <Square /> : <Mic />}
                      </button>
                    </div>
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={recording ? "Gravando áudio..." : "Converse antes de decidir..."}
                      maxLength={4000}
                    />
                    <button disabled={!draft.trim() || busy}>
                      <Send />
                    </button>
                  </form>
                  <small className="chat-upload-hint">
                    {recording ? "Toque no quadrado para finalizar o áudio." : "Fotos, vídeos, áudio e arquivos · até 50 MB"}
                  </small>
                  {cropFile && cropTarget === "chat" && (
                    <ImageCropper
                      file={cropFile}
                      aspectRatio={1.25}
                      title="Imagem do chat"
                      onCancel={() => {
                        setCropFile(null);
                        setCropTarget(null);
                      }}
                      onApply={(f) => void applyCroppedImage(f)}
                    />
                  )}
                  <div className="match-live-actions">
                    <button className="secondary" disabled={busy} onClick={() => void respondToMatch(false)}>
                      Encerrar encontro
                    </button>
                    <button className="primary" disabled={busy || pendingAccepted} onClick={() => void respondToMatch(true)}>
                      {pendingAccepted ? "Aguardando aceite" : "Aceitar match"} <Check />
                    </button>
                  </div>
                </section>
              ))}
            {tab === "queue" && (
          <>
            <div className="heading">
              <div>
                <small>CONEXÃO EM TEMPO REAL</small>
                <h1>
                  Uma conversa pode <em>começar agora.</em>
                </h1>
                <p>Encontre alguém online com preferências compatíveis.</p>
              </div>
            </div>
            <section className="queue-card">
              <div className={"connection-art " + (queue === "waiting" ? "is-searching" : pendingMatchId ? "is-found" : "")}>
                <div className="ring r1" />
                <div className="ring r2" />
                <div className="ring r3" />
                <div className="core">
                  <Activity size={30} />
                </div>
                <span className="connection-art-caption">
                  {queue === "waiting" ? "BUSCANDO PESSOAS..." : pendingMatchId ? "PESSOA ENCONTRADA" : "PRONTO PARA CONECTAR"}
                </span>
                <span className="search-orbit-dot" />
                <Users className="people-icon" />
              </div>
              <div>
                <small>MATCHING POR PREFERÊNCIAS</small>
                <div className={"queue-state " + (queue === "waiting" ? "is-active" : "")}>
                  <i />
                  {queue === "waiting" ? "PROCURANDO AGORA" : "PRONTO PARA CONECTAR"}
                </div>
                <h2>
                  {queue === "waiting"
                    ? "Estamos procurando sua conexão."
                    : pendingMatchId && pendingPartner
                      ? "Encontramos alguém para você."
                      : "Conheça alguém novo, sem complicação."}
                </h2>
                <p>
                  {queue === "waiting"
                    ? "Você está na fila. Quando alguém compatível aparecer, o chat abre automaticamente. Cada pessoa tem até 3 minutos para aceitar uma única vez."
                    : "O CONNECT procura pessoas online que também escolheram conhecer alguém com seu perfil."}
                </p>
                <div className="queue-filters">
                  <strong className="queue-location-label">Região de busca</strong>
                  <span>{queueCityFilter && queueStateFilter ? queueCityFilter + " · " + queueStateFilter : "Todo o Brasil"}</span>
                  <small>
                    Para buscar pessoas em outra cidade ou voltar à sua localização atual, use o ícone de localização no topo da tela.
                  </small>
                </div>
                <div className="queue-quota">
                  {queueQuota.unlimited ? (
                    <>
                      <strong>BUSCAS ILIMITADAS</strong>
                      <span>Seu pacote está ativo.</span>
                    </>
                  ) : (
                    <>
                      <strong>{queueQuota.remaining} de 20 buscas restantes hoje</strong>
                      <span>{queueQuota.used} buscas utilizadas · renovação à meia-noite (horário de Brasília)</span>
                    </>
                  )}
                </div>
                <ul>
                  <li>
                    <Check /> Pessoas reais
                  </li>
                  <li>
                    <Check /> Preferências respeitadas
                  </li>
                  <li>
                    <Check /> Chat em tempo real
                  </li>
                </ul>
                {pendingMatchId ? (
                  <p className="queue-pending-note">A confirmação da conexão está aberta na tela.</p>
                ) : matchId ? (
                  <button className="secondary" onClick={() => setTab("chat")}>
                    Voltar para a conversa ativa
                  </button>
                ) : queue === "waiting" ? (
                  <button className="secondary" onClick={() => void leaveQueue()}>
                    Sair da fila
                  </button>
                ) : isDemo ? (
                  <p className="demo-readonly-note">A busca por pessoas fica desativada no acesso de demonstração.</p>
                ) : (
                  <button className="primary" disabled={busy} onClick={() => void enterQueue()}>
                    <Radio /> {busy ? "Conectando..." : "Entrar na fila"} <ArrowRight />
                  </button>
                )}
              </div>
            </section>
          </>
            )}
          </>
  );
}

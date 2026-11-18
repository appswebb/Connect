"use client";

import type { Dispatch, FormEvent, RefObject, SetStateAction } from "react";
import { Archive, ArrowRight, Ban, Download, FileText, Flag, Mail, MessageCircle, MessageSquare, Mic, Minus, Paperclip, Send, Square, Trash2, X } from "lucide-react";
import Avatar from "./ConnectAvatar";
import { ago } from "../lib/connect-utils";
import type { ChatHistoryItem, Message, MessageRequestItem, Profile } from "../types/connect";

type Props = {
  currentUserId: string;
  isDemo: boolean;
  chatView: "direct" | "rooms";
  setChatView: Dispatch<SetStateAction<"direct" | "rooms">>;
  chatInboxTab: "conversations" | "requests" | "archived";
  setChatInboxTab: Dispatch<SetStateAction<"conversations" | "requests" | "archived">>;
  messageRequests: MessageRequestItem[];
  loadChatHistory: (userId: string) => Promise<void>;
  respondMessageRequest: (id: string, accept: boolean) => Promise<void>;
  openReport: (userId: string, targetType?: string, targetId?: string) => void;
  matchId: string;
  partner: Profile | null;
  chatMinimized: boolean;
  setChatMinimized: Dispatch<SetStateAction<boolean>>;
  openProfile: (id: string) => void | Promise<void>;
  chatReadOnly: boolean;
  blockUser: (id: string) => void | Promise<void>;
  endChat: () => void | Promise<void>;
  messages: Message[];
  send: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  chatFileRef: RefObject<HTMLInputElement | null>;
  recording: boolean;
  toggleRecording: () => void | Promise<void>;
  busy: boolean;
  draft: string;
  setDraft: Dispatch<SetStateAction<string>>;
  openImageCrop: (file: File, target: "post" | "avatar" | "banner" | "chat") => void;
  sendAttachment: (file: File, kind: "image" | "audio" | "file", duration?: number) => void | Promise<void>;
  chatHistory: ChatHistoryItem[];
  setMatchId: Dispatch<SetStateAction<string>>;
  setChatReadOnly: Dispatch<SetStateAction<boolean>>;
  setChatHistoryStatus: (id: string, status: "archived" | "deleted" | "active") => void | Promise<void>;
  setTab: Dispatch<SetStateAction<string>>;
};

export default function ConnectChat(props: Props) {
  const {
    currentUserId, isDemo, chatView, setChatView, chatInboxTab, setChatInboxTab,
    messageRequests, loadChatHistory, respondMessageRequest, openReport, matchId,
    partner, chatMinimized, setChatMinimized, openProfile, chatReadOnly, blockUser,
    endChat, messages, send, chatFileRef, recording, toggleRecording, busy, draft,
    setDraft, openImageCrop, sendAttachment, chatHistory, setMatchId, setChatReadOnly,
    setChatHistoryStatus, setTab,
  } = props;

  return (
    <>
      <>
            <div className="heading">
              <div>
                <small>CONVERSAS</small>
                <h1>
                  Suas <em>conexões.</em>
                </h1>
                <p>Conversas privadas e salas públicas do Brasil.</p>
              </div>
              <div className="chat-mode-switch">
                <button
                  className={chatView === "direct" && chatInboxTab === "conversations" ? "active" : ""}
                  onClick={() => {
                    setChatView("direct");
                    setChatInboxTab("conversations");
                  }}
                >
                  <MessageCircle size={15} /> Conversas
                </button>
                <button
                  className={chatView === "direct" && chatInboxTab === "requests" ? "active" : ""}
                  onClick={() => {
                    setChatView("direct");
                    setChatInboxTab("requests");
                  }}
                >
                  <Mail size={15} /> Pedidos {messageRequests.length > 0 && <b>{messageRequests.length}</b>}
                </button>
                <button
                  className={chatView === "direct" && chatInboxTab === "archived" ? "active" : ""}
                  onClick={() => {
                    setChatView("direct");
                    setChatInboxTab("archived");
                    if (currentUserId) void loadChatHistory(currentUserId);
                  }}
                >
                  <Archive size={15} /> Arquivadas
                </button>
              </div>
            </div>
            {chatView === "direct" && (
              <>
                {chatInboxTab === "requests" ? (
                  <section className="message-requests">
                    {messageRequests.map((item) => (
                      <article key={item.id}>
                        <Avatar p={item.sender} size="small" />
                        <div className="message-request-copy">
                          <strong>{item.sender.display_name}</strong>
                          <small>
                            @{item.sender.username} · {ago(item.created_at)}
                          </small>
                          <p>{item.initial_message}</p>
                        </div>
                        <div className="message-request-actions">
                          <button className="primary" onClick={() => void respondMessageRequest(item.id, true)}>
                            Aceitar
                          </button>
                          <button className="secondary" onClick={() => void respondMessageRequest(item.id, false)}>
                            Recusar
                          </button>
                          {!isDemo && (
                            <button
                              type="button"
                              className="content-report-action"
                              onClick={() => openReport(item.sender_id, "chat_message", item.id)}
                            >
                              <Flag size={12} /> Denunciar mensagem
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                    {!messageRequests.length && (
                      <div className="empty">
                        <MessageCircle />
                        <h3>Nenhum pedido de mensagem.</h3>
                        <p>Quando alguém que não é seu amigo mandar mensagem, o pedido aparecerá aqui.</p>
                      </div>
                    )}
                  </section>
                ) : (
                  <>
                    {matchId && partner ? (
                      chatMinimized ? (
                        <section className="chat-minimized">
                          <div>
                            <Avatar p={partner} size="small" />
                            <span>
                              <strong>{partner.display_name}</strong>
                              <small>Conversa minimizada · mensagens continuam chegando</small>
                            </span>
                          </div>
                          <button className="secondary" onClick={() => setChatMinimized(false)}>
                            Reabrir conversa
                          </button>
                          <button className="chat-close-mini" onClick={() => void endChat()} title="Encerrar conversa">
                            <X />
                          </button>
                        </section>
                      ) : (
                        <section className="chat">
                          <header>
                            <button
                              type="button"
                              className="profile-open-avatar"
                              onClick={() => void openProfile(partner.id)}
                              aria-label={"Ver perfil de " + partner.display_name}
                            >
                              <Avatar p={partner} />
                            </button>
                            <div className="chat-person-info">
                              <button type="button" className="profile-open-name" onClick={() => void openProfile(partner.id)}>
                                {partner.display_name}
                              </button>
                              <span>
                                @{partner.username} · {chatReadOnly ? "histórico salvo" : "match confirmado"}
                              </span>
                            </div>
                            {!isDemo && (
                              <>
                                {!chatReadOnly && (
                                  <>
                                    <button title="Denunciar pessoa" onClick={() => openReport(partner.id)}>
                                      <Flag />
                                    </button>
                                    <button title="Bloquear pessoa" onClick={() => void blockUser(partner.id)}>
                                      <Ban />
                                    </button>
                                  </>
                                )}
                                {!chatReadOnly && (
                                  <button onClick={() => setChatMinimized(true)} title="Minimizar conversa">
                                    <Minus />
                                  </button>
                                )}
                                <button
                                  onClick={() => void endChat()}
                                  title={chatReadOnly ? "Voltar ao histórico" : "Fechar e salvar conversa"}
                                >
                                  <X />
                                </button>
                              </>
                            )}
                          </header>
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
                                          <small>
                                            {m.attachment_size ? Math.max(1, Math.round(m.attachment_size / 1024)) + " KB" : "Anexo"}
                                          </small>
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
                            {!messages.length && <p className="chat-empty">Vocês foram conectados! Que tal começar com um oi?</p>}
                          </div>
                          {!chatReadOnly && !isDemo ? (
                            <>
                              <form className="chat-compose" onSubmit={send}>
                                <div className="chat-tools">
                                  <button
                                    type="button"
                                    onClick={() => chatFileRef.current?.click()}
                                    title="Enviar foto ou arquivo"
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
                                  placeholder={recording ? "Gravando áudio..." : "Escreva uma mensagem..."}
                                  maxLength={4000}
                                />
                                <button disabled={!draft.trim() || busy}>
                                  <Send />
                                </button>
                              </form>
                              <small className="chat-upload-hint">
                                {recording ? "Toque no quadrado para finalizar o áudio." : "Fotos, vídeos, áudio e arquivos · até 50 MB"}
                              </small>
                            </>
                          ) : (
                            <div className="chat-archived-note">
                              {isDemo
                                ? "Modo de demonstração: mensagens e anexos estão desativados."
                                : "Esta conversa está salva no seu histórico. Ela não recebe novas mensagens."}
                            </div>
                          )}
                        </section>
                      )
                    ) : (
                      <>
                        {chatHistory.length > 0 ? (
                          <section className="chat-history">
                            <h2>{chatInboxTab === "archived" ? "Conversas arquivadas" : "Conversas"}</h2>
                            {chatHistory.map((item) => (
                              <article className="chat-history-item" key={item.id}>
                                <button
                                  className="chat-history-open"
                                  onClick={() => {
                                    setMatchId(item.id);
                                    setChatReadOnly(true);
                                    setChatMinimized(false);
                                  }}
                                >
                                  <Avatar p={item.partner} size="small" />
                                  <span>
                                    <strong>{item.partner.display_name}</strong>
                                    <small>
                                      @{item.partner.username} · {new Date(item.created_at).toLocaleDateString("pt-BR")}
                                    </small>
                                  </span>
                                  <MessageCircle />
                                </button>
                                <div className="chat-history-actions">
                                  {chatInboxTab === "archived" ? (
                                    <button
                                      type="button"
                                      title="Restaurar conversa"
                                      onClick={() => void setChatHistoryStatus(item.id, "active")}
                                    >
                                      <MessageSquare size={15} /> Restaurar
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      title="Arquivar conversa"
                                      onClick={() => void setChatHistoryStatus(item.id, "archived")}
                                    >
                                      <Minus size={15} /> Arquivar
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className="delete-chat-action"
                                    title="Apagar do meu histórico"
                                    onClick={() => void setChatHistoryStatus(item.id, "deleted")}
                                  >
                                    <Trash2 size={15} /> Apagar
                                  </button>
                                </div>
                              </article>
                            ))}
                          </section>
                        ) : (
                          <div className="empty">
                            <MessageCircle />
                            <h3>Nenhuma conversa ativa.</h3>
                            <p>Entre na fila para encontrar alguém que também esteja online.</p>
                            <button className="primary" onClick={() => setTab("queue")}>
                              Encontrar alguém <ArrowRight />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </>
    </>
  );
}

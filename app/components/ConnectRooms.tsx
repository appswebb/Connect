"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Compass, Flag, Globe2, MessageCircle, Send, Trash2, X } from "lucide-react";
import Avatar from "./ConnectAvatar";
import { ago } from "../lib/connect-utils";
import { stateFlags } from "../lib/connect-data";
import { brazilStates } from "../lib/brazil";
import type { RoomMessage } from "../types/connect";

type ConnectRoomsProps = {
  roomCode: string;
  setRoomCode: (value: string) => void;
  roomMessages: RoomMessage[];
  roomReply: RoomMessage | null;
  setRoomReply: (value: RoomMessage | null) => void;
  roomDraft: string;
  setRoomDraft: (value: string) => void;
  sendRoomMessage: (event: FormEvent) => void;
  deleteRoomMessage: (message: RoomMessage) => void;
  openProfile: (userId: string) => void;
  openReport: (userId: string, targetType?: string, targetId?: string) => void;
  currentUserId: string;
  isDemo: boolean;
};

function getRoomLabel(code: string) {
  if (!code || code === "BR") return "Brasil inteiro";
  return brazilStates[code.toUpperCase()] || code.toUpperCase() || "Sala Geral";
}

export default function ConnectRooms(props: ConnectRoomsProps) {
  const {
    roomCode, setRoomCode, roomMessages, roomReply, setRoomReply,
    roomDraft, setRoomDraft, sendRoomMessage, deleteRoomMessage,
    openProfile, openReport, currentUserId, isDemo,
  } = props;

  const [roomSearch, setRoomSearch] = useState("");
  const normalizedCode = (roomCode || "BR").toUpperCase();
  const activeRoomLabel = getRoomLabel(normalizedCode);

  const filteredStates = useMemo(() => {
    const term = roomSearch.trim().toLowerCase();
    const entries = Object.entries(brazilStates);
    if (!term) return entries;
    return entries.filter(
      ([code, label]) =>
        code.toLowerCase().includes(term) || label.toLowerCase().includes(term),
    );
  }, [roomSearch]);

  const totalRoomsCount = Object.keys(brazilStates).length + 1;

  return (
    <section className="people-state-rooms">
      <div className="people-state-rooms-heading">
        <div>
          <small>COMUNIDADE POR REGIÃO</small>
          <h2>Salas do Brasil</h2>
          <p>Converse com pessoas de todo o país ou escolha seu estado.</p>
        </div>
        <span>
          <Globe2 size={16} /> {totalRoomsCount} salas
        </span>
      </div>
      <section className="rooms-panel">
        <div className="room-select">
          <button
            type="button"
            className={normalizedCode === "BR" ? "active" : ""}
            onClick={() => setRoomCode("BR")}
          >
            <img src={stateFlags.BR} alt="Bandeira do Brasil" /> Brasil inteiro
          </button>
          <div className="room-search-box">
            <Compass size={15} />
            <input
              type="search"
              value={roomSearch}
              onChange={(event) => setRoomSearch(event.target.value)}
              placeholder="Buscar estado ou sigla (ex.: SP, Bahia)..."
              aria-label="Buscar sala estadual"
            />
            {roomSearch && (
              <button
                type="button"
                className="room-search-clear"
                aria-label="Limpar busca de salas"
                onClick={() => setRoomSearch("")}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="state-room-grid state-room-cards" role="group" aria-label="Salas estaduais">
          {filteredStates.map(([code, label]) => {
            const safeName = label || getRoomLabel(code);
            return (
              <button
                type="button"
                key={code}
                className={"state-room-chip" + (normalizedCode === code ? " active" : "")}
                onClick={() => setRoomCode(code)}
                aria-pressed={normalizedCode === code}
                aria-label={"Sala de " + safeName}
                title={safeName}
              >
                <img src={stateFlags[code] || stateFlags.BR} alt={"Bandeira de " + safeName} />
                <span className="state-room-code">{code}</span>
                <small className="state-room-name">{safeName}</small>
              </button>
            );
          })}
          {!filteredStates.length && (
            <p className="room-search-empty">Nenhum estado encontrado para &ldquo;{roomSearch}&rdquo;.</p>
          )}
        </div>

        <div className="room-title">
          <img
            className="room-title-flag"
            src={stateFlags[normalizedCode] || stateFlags.BR}
            alt={"Bandeira de " + activeRoomLabel}
          />
          <div>
            <strong>{normalizedCode === "BR" ? "Chat Global do Brasil" : "Chat de " + activeRoomLabel + " · " + normalizedCode}</strong>
            <small>{roomMessages.length} mensagens recentes carregadas · respeito em primeiro lugar</small>
          </div>
        </div>

        <div className="room-message-list">
          {roomMessages.map((m) => (
            <article key={m.id}>
              <Avatar p={m.author} size="small" />
              <div className="room-message-content">
                {m.reply_to_id && (
                  <div className="room-reply-quote">
                    ↳ Respondendo: {roomMessages.find((x) => x.id === m.reply_to_id)?.body || "mensagem anterior"}
                  </div>
                )}
                <strong>
                  <button type="button" className="profile-open-name" onClick={() => void openProfile(m.author.id)}>
                    {m.author.display_name}
                  </button>{" "}
                  <small>
                    @{m.author.username} · {ago(m.created_at)}
                  </small>
                </strong>
                <p>{m.body}</p>
                <div className="room-message-actions">
                  <button type="button" onClick={() => setRoomReply(m)} aria-label={"Responder " + m.author.display_name}>
                    <MessageCircle size={13} /> Responder
                  </button>
                  {m.user_id === currentUserId && !isDemo && (
                    <button type="button" onClick={() => void deleteRoomMessage(m)} aria-label="Apagar mensagem da sala">
                      <Trash2 size={13} /> Apagar
                    </button>
                  )}
                  {!isDemo && m.user_id !== currentUserId && (
                    <button type="button" onClick={() => openReport(m.user_id, "room_message", m.id)} aria-label="Denunciar mensagem da sala">
                      <Flag size={13} /> Denunciar
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
          {!roomMessages.length && (
            <div className="empty">
              <MessageCircle />
              <h3>Esta sala está começando.</h3>
              <p>Seja a primeira pessoa a mandar uma mensagem em {activeRoomLabel}.</p>
            </div>
          )}
        </div>
        {!isDemo && (
          <>
            {roomReply && (
              <div className="room-replying">
                <span>
                  Respondendo a {roomReply.author.display_name}: {roomReply.body}
                </span>
                <button type="button" onClick={() => setRoomReply(null)} aria-label="Cancelar resposta">
                  <X size={15} />
                </button>
              </div>
            )}
            <form className="room-compose" onSubmit={sendRoomMessage}>
              <input
                value={roomDraft}
                onChange={(e) => setRoomDraft(e.target.value)}
                maxLength={2000}
                placeholder={"Mensagem para " + activeRoomLabel + "..."}
              />
              <button type="submit" className="primary" disabled={!roomDraft.trim()}>
                Enviar <Send size={15} />
              </button>
            </form>
          </>
        )}
        {isDemo && <p className="demo-readonly-note">Mensagens nas salas ficam desativadas no acesso de demonstração.</p>}
      </section>
    </section>
  );
}

import type { FormEvent } from "react";
import { Flag, Globe2, MessageCircle, Send, Trash2, X } from "lucide-react";
import Avatar from "./ConnectAvatar";
import { ago } from "../lib/connect-utils";
import { stateFlags } from "../lib/connect-data";
import { brazilStates } from "../lib/brazil";
import type { Profile, RoomMessage } from "../types/connect";

type ConnectRoomsProps = {
  roomCode: string;
  setRoomCode: (value: string) => void;
  roomMessages: RoomMessage[];
  roomReply: RoomMessage | null;
  setRoomReply: (value: RoomMessage | null) => void;
  roomDraft: string;
  setRoomDraft: (value: string) => void;
  sendRoomMessage: (event: FormEvent<HTMLFormElement>) => void;
  deleteRoomMessage: (message: RoomMessage) => void;
  openProfile: (userId: string) => void;
  openReport: (userId: string, targetType?: string, targetId?: string) => void;
  currentUserId: string;
  isDemo: boolean;
};

export default function ConnectRooms(props: ConnectRoomsProps) {
  const { roomCode, setRoomCode, roomMessages, roomReply, setRoomReply, roomDraft, setRoomDraft, sendRoomMessage, deleteRoomMessage, openProfile, openReport, currentUserId, isDemo } = props;
  return (
    <>
      {
        <section className="people-state-rooms">
          <div className="people-state-rooms-heading">
            <div>
              <small>COMUNIDADE POR REGIÃO</small>
              <h2>Salas do Brasil</h2>
              <p>Converse com pessoas de todo o país ou escolha seu estado.</p>
            </div>
            <span>
              <Globe2 size={16} /> 27 salas
            </span>
          </div>
          <section className="rooms-panel">
            <div className="room-select">
              <button className={roomCode === "BR" ? "active" : ""} onClick={() => setRoomCode("BR")}>
                <img src={stateFlags.BR} alt="Bandeira do Brasil" /> Brasil inteiro
              </button>
              <span>Salas estaduais</span>
            </div>
            <div className="state-room-grid">
              {Object.entries(brazilStates).map(([code, label]) => (
                <button key={code} className={roomCode === code ? "active" : ""} onClick={() => setRoomCode(code)}>
                  <img src={stateFlags[code]} alt={"Bandeira de " + label} />
                  <span>{code}</span>
                </button>
              ))}
            </div>
            <div className="room-title">
              <img
                className="room-title-flag"
                src={stateFlags[roomCode] || stateFlags.BR}
                alt={roomCode === "BR" ? "Bandeira do Brasil" : "Bandeira de " + brazilStates[roomCode]}
              />
              <div>
                <strong>{roomCode === "BR" ? "Chat Global do Brasil" : "Chat de " + brazilStates[roomCode] + " · " + roomCode}</strong>
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
                      <button type="button" onClick={() => setRoomReply(m)}>
                        <MessageCircle size={13} /> Responder
                      </button>
                      {m.user_id === currentUserId && !isDemo && (
                        <button type="button" onClick={() => void deleteRoomMessage(m)}>
                          <Trash2 size={13} /> Apagar
                        </button>
                      )}
                      {!isDemo && m.user_id !== currentUserId && (
                        <button type="button" onClick={() => openReport(m.user_id, "room_message", m.id)}>
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
                  <p>Seja a primeira pessoa a mandar uma mensagem.</p>
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
                    placeholder={"Mensagem para " + (roomCode === "BR" ? "todo o Brasil" : brazilStates[roomCode]) + "..."}
                  />
                  <button className="primary" disabled={!roomDraft.trim()}>
                    Enviar <Send size={15} />
                  </button>
                </form>
              </>
            )}
            {isDemo && <p className="demo-readonly-note">Mensagens nas salas ficam desativadas no acesso de demonstração.</p>}
          </section>
        </section>
      }
    </>
  );
}

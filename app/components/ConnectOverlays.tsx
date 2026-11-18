"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import { ArrowRight, Ban, Flag, MessageCircle, Users, X } from "lucide-react";
import Avatar from "./ConnectAvatar";
import ImageCropper from "./ImageCropper";
import { genders, preferences } from "../lib/connect-data";
import type { Profile } from "../types/connect";

type OwnSocialList = { kind: "followers" | "following"; people: Profile[] } | null;
type Relationship = {
  following: boolean;
  mutual: boolean;
  followers: number;
  following_count: number;
};

type Props = {
  profile: Profile;
  isDemo: boolean;
  ownSocialList: OwnSocialList;
  setOwnSocialList: Dispatch<SetStateAction<OwnSocialList>>;
  openProfile: (id: string) => void | Promise<void>;
  showVisitorPreview: boolean;
  setShowVisitorPreview: Dispatch<SetStateAction<boolean>>;
  ownSocialCounts: { followers: number; following: number };
  viewingProfile: Profile | null;
  setViewingProfile: Dispatch<SetStateAction<Profile | null>>;
  relationship: Relationship;
  toggleFollow: () => void | Promise<void>;
  startMessage: () => void | Promise<void>;
  openReport: (uid: string, targetType?: string, targetId?: string) => void;
  blockUser: (uid: string) => void | Promise<void>;
  reportTarget: string;
  setReportTarget: Dispatch<SetStateAction<string>>;
  reportTargetType: string;
  reportCategory: string;
  setReportCategory: Dispatch<SetStateAction<string>>;
  reportDetails: string;
  setReportDetails: Dispatch<SetStateAction<string>>;
  submitReport: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  cropFile: File | null;
  cropTarget: "post" | "avatar" | "banner" | "chat" | null;
  setCropFile: Dispatch<SetStateAction<File | null>>;
  setCropTarget: Dispatch<SetStateAction<"post" | "avatar" | "banner" | "chat" | null>>;
  applyCroppedImage: (file: File) => void | Promise<void>;
};

export default function ConnectOverlays(props: Props) {
  const {
    profile, isDemo, ownSocialList, setOwnSocialList, openProfile,
    showVisitorPreview, setShowVisitorPreview, ownSocialCounts,
    viewingProfile, setViewingProfile, relationship, toggleFollow,
    startMessage, openReport, blockUser, reportTarget, setReportTarget,
    reportTargetType, reportCategory, setReportCategory, reportDetails,
    setReportDetails, submitReport, cropFile, cropTarget, setCropFile,
    setCropTarget, applyCroppedImage,
  } = props;

  return (
    <>
        {ownSocialList && (
          <div
            className="profile-view-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label={ownSocialList.kind === "followers" ? "Seus seguidores" : "Pessoas que você segue"}
            onClick={() => setOwnSocialList(null)}
          >
            <section className="profile-view-card own-social-list" onClick={(e) => e.stopPropagation()}>
              <header>
                <strong>{ownSocialList.kind === "followers" ? "SEUS SEGUIDORES" : "VOCÊ ESTÁ SEGUINDO"}</strong>
                <button type="button" onClick={() => setOwnSocialList(null)} aria-label="Fechar lista">
                  <X />
                </button>
              </header>
              <div className="own-social-people">
                {ownSocialList.people.map((person) => (
                  <article key={person.id}>
                    <Avatar p={person} size="small" />
                    <div>
                      <strong>{person.display_name}</strong>
                      <small>@{person.username}</small>
                    </div>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => {
                        setOwnSocialList(null);
                        void openProfile(person.id);
                      }}
                    >
                      Ver perfil <ArrowRight size={14} />
                    </button>
                  </article>
                ))}
                {!ownSocialList.people.length && (
                  <div className="empty">
                    <Users />
                    <h3>{ownSocialList.kind === "followers" ? "Você ainda não tem seguidores." : "Você ainda não segue ninguém."}</h3>
                    <p>Quando essa lista tiver pessoas, elas aparecerão aqui.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
        {showVisitorPreview && (
          <div
            className="profile-view-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label="Prévia do seu perfil como visitante"
            onClick={() => setShowVisitorPreview(false)}
          >
            <section className="profile-view-card visitor-preview-card" onClick={(e) => e.stopPropagation()}>
              <header>
                <strong>ASSIM SEU PERFIL APARECE PARA VISITANTES</strong>
                <button type="button" onClick={() => setShowVisitorPreview(false)} aria-label="Fechar prévia">
                  <X />
                </button>
              </header>
              <div
                className="profile-view-banner"
                style={profile.banner_url ? { backgroundImage: "url(" + profile.banner_url + ")" } : {}}
              />
              <div className="profile-view-body">
                <div className="profile-view-identity">
                  <Avatar p={profile} size="large" />
                  <div>
                    <h2>{profile.display_name}</h2>
                    <span>@{profile.username}</span>
                  </div>
                </div>
                <p className="profile-view-bio">{profile.bio || "Esta pessoa ainda não adicionou uma descrição."}</p>
                <div className="profile-view-facts">
                  <div>
                    <small>GÊNERO</small>
                    <strong>
                      {genders[profile.gender] || profile.gender}
                      {profile.gender_description ? " · " + profile.gender_description : ""}
                    </strong>
                  </div>
                  <div>
                    <small>QUER CONHECER</small>
                    <strong>{(profile.looking_for || []).map((x) => preferences[x] || x).join(", ") || "Não informado"}</strong>
                  </div>
                  <div>
                    <small>LOCALIZAÇÃO</small>
                    <strong>
                      {profile.location_visible && profile.city && profile.state_code
                        ? profile.city + " · " + profile.state_code
                        : "Não exibida"}
                    </strong>
                  </div>
                </div>
                <div className="social-profile-stats">
                  <span>
                    <strong>{ownSocialCounts.followers}</strong> seguidores
                  </span>
                  <span>
                    <strong>{ownSocialCounts.following}</strong> seguindo
                  </span>
                </div>
                <p className="visitor-preview-note">
                  Prévia de visitante: botões de interação ficam disponíveis apenas para outras pessoas.
                </p>
              </div>
            </section>
          </div>
        )}
        {viewingProfile && (
          <div
            className="profile-view-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label={"Perfil de " + viewingProfile.display_name}
            onClick={() => setViewingProfile(null)}
          >
            <section className="profile-view-card" onClick={(e) => e.stopPropagation()}>
              <header>
                <strong>PERFIL CONNECT</strong>
                <button type="button" onClick={() => setViewingProfile(null)} aria-label="Fechar perfil">
                  <X />
                </button>
              </header>
              <div
                className="profile-view-banner"
                style={viewingProfile.banner_url ? { backgroundImage: "url(" + viewingProfile.banner_url + ")" } : {}}
              />
              <div className="profile-view-body">
                <div className="profile-view-identity">
                  <Avatar p={viewingProfile} size="large" />
                  <div>
                    <h2>{viewingProfile.display_name}</h2>
                    <span>@{viewingProfile.username}</span>
                  </div>
                </div>
                <p className="profile-view-bio">{viewingProfile.bio || "Esta pessoa ainda não adicionou uma descrição."}</p>
                <div className="profile-view-facts">
                  <div>
                    <small>GÊNERO</small>
                    <strong>
                      {genders[viewingProfile.gender] || viewingProfile.gender}
                      {viewingProfile.gender_description ? " · " + viewingProfile.gender_description : ""}
                    </strong>
                  </div>
                  <div>
                    <small>QUER CONHECER</small>
                    <strong>{(viewingProfile.looking_for || []).map((x) => preferences[x] || x).join(", ") || "Não informado"}</strong>
                  </div>
                  <div>
                    <small>LOCALIZAÇÃO</small>
                    <strong>
                      {viewingProfile.location_visible && viewingProfile.city && viewingProfile.state_code
                        ? viewingProfile.city + " · " + viewingProfile.state_code
                        : "Não exibida"}
                    </strong>
                  </div>
                </div>
                {!isDemo && (
                  <>
                    <div className="social-profile-stats">
                      <span>
                        <strong>{relationship.followers}</strong> seguidores
                      </span>
                      <span>
                        <strong>{relationship.following_count}</strong> seguindo
                      </span>
                      {relationship.mutual && <b>AMIGOS</b>}
                    </div>
                    <footer>
                      <button type="button" className="secondary" onClick={() => void toggleFollow()}>
                        {relationship.following ? "Deixar de seguir" : "Seguir"} <Users size={15} />
                      </button>
                      <button type="button" className="primary" onClick={startMessage}>
                        <MessageCircle size={15} /> Mensagem
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => {
                          openReport(viewingProfile.id);
                          setViewingProfile(null);
                        }}
                      >
                        <Flag size={15} /> Denunciar
                      </button>
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => {
                          const id = viewingProfile.id;
                          setViewingProfile(null);
                          void blockUser(id);
                        }}
                      >
                        <Ban size={15} /> Bloquear
                      </button>
                    </footer>
                  </>
                )}
              </div>
            </section>
          </div>
        )}
        {!isDemo && reportTarget && (
          <div className="crop-backdrop" role="dialog" aria-modal="true" aria-label="Denunciar conteúdo">
            <form className="report-dialog" onSubmit={submitReport}>
              <header>
                <div>
                  <small>SEGURANÇA DA COMUNIDADE</small>
                  <h2>
                    {reportTargetType === "profile"
                      ? "Denunciar perfil"
                      : reportTargetType === "post"
                        ? "Denunciar publicação"
                        : reportTargetType === "comment"
                          ? "Denunciar comentário"
                          : reportTargetType === "room_message"
                            ? "Denunciar mensagem da sala"
                            : reportTargetType === "chat_message"
                              ? "Denunciar mensagem privada"
                              : reportTargetType === "live"
                                ? "Denunciar transmissão"
                                : "Denunciar conteúdo"}
                  </h2>
                </div>
                <button type="button" onClick={() => setReportTarget("")}>
                  <X />
                </button>
              </header>
              <label>
                Motivo
                <select value={reportCategory} onChange={(e) => setReportCategory(e.target.value)}>
                  <option value="spam">Spam ou golpe</option>
                  <option value="harassment">Assédio ou intimidação</option>
                  <option value="hate">Discurso de ódio</option>
                  <option value="nudity">Nudez ou conteúdo sexual</option>
                  <option value="impersonation">Falsidade ideológica</option>
                  <option value="underage">Possível menor de idade</option>
                  <option value="other">Outro</option>
                </select>
              </label>
              <label>
                Detalhes (opcional)
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  maxLength={2000}
                  placeholder="Conte o que aconteceu."
                />
              </label>
              <footer>
                <button type="button" className="secondary" onClick={() => setReportTarget("")}>
                  Cancelar
                </button>
                <button className="primary">
                  Enviar denúncia <Flag size={15} />
                </button>
              </footer>
            </form>
          </div>
        )}
        {cropFile && cropTarget && cropTarget !== "chat" && (
          <ImageCropper
            file={cropFile}
            aspectRatio={cropTarget === "avatar" ? 1 : cropTarget === "banner" ? 16 / 5 : 1.25}
            title={cropTarget === "avatar" ? "Foto de perfil" : cropTarget === "banner" ? "Banner do perfil" : "Imagem da publicação"}
            onCancel={() => {
              setCropFile(null);
              setCropTarget(null);
            }}
            onApply={(f) => void applyCroppedImage(f)}
          />
        )}

    </>
  );
}

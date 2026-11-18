"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import { Camera, Check, Eye, MessageSquare, ShieldCheck, Trash2, UserRound, Users } from "lucide-react";
import Avatar from "./ConnectAvatar";
import { ago } from "../lib/connect-utils";
import { genders, preferences } from "../lib/connect-data";
import type { Post, Profile } from "../types/connect";

type Props = {
  profile: Profile;
  isDemo: boolean;
  openImageCrop: (file: File, target: "post" | "avatar" | "banner" | "chat") => void;
  setShowVisitorPreview: Dispatch<SetStateAction<boolean>>;
  bio: string;
  setBio: Dispatch<SetStateAction<string>>;
  saveBio: (event: FormEvent<HTMLFormElement>) => void;
  ownSocialCounts: { followers: number; following: number };
  openOwnSocialList: (kind: "followers" | "following") => void | Promise<void>;
  ownPosts: Post[];
  removePost: (postId: string) => void | Promise<void>;
};

export default function ConnectProfile(props: Props) {
  const {
    profile, isDemo, openImageCrop, setShowVisitorPreview, bio, setBio,
    saveBio, ownSocialCounts, openOwnSocialList, ownPosts, removePost,
  } = props;

  return (
    <>
      <div className="heading">
        <div>
          <small>SEU PERFIL</small>
          <h1>Seu espaço, <em>sua história.</em></h1>
          <p>Veja suas informações e publicações em um só lugar.</p>
        </div>
      </div>

      <section className="profile-card">
        <div className="banner">
          {profile.banner_url && <img className="profile-banner-image" src={profile.banner_url} alt="" />}
          {!isDemo && (
            <label>
              <Camera size={15} /> Alterar banner
              <input type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) openImageCrop(file, "banner");
                event.currentTarget.value = "";
              }} />
            </label>
          )}
        </div>

        <div className="profile-ident">
          <div className="profile-avatar">
            <Avatar p={profile} size="large" />
            {!isDemo && (
              <label>
                <Camera size={14} />
                <input type="file" hidden accept="image/*" onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) openImageCrop(file, "avatar");
                  event.currentTarget.value = "";
                }} />
              </label>
            )}
          </div>
          <div>
            <h2>{profile.display_name}</h2>
            <span>@{profile.username}</span>
          </div>
          <span className="profile-active"><ShieldCheck size={14} /> PERFIL ATIVO</span>
          <button type="button" className="secondary visitor-preview-trigger" onClick={() => setShowVisitorPreview(true)}>
            <Eye size={15} /> Ver como visitante
          </button>
        </div>

        {!isDemo && (
          <form className="bio-form" onSubmit={saveBio}>
            <label htmlFor="profile-bio">Sobre você</label>
            <textarea id="profile-bio" value={bio} onChange={(event) => setBio(event.target.value)} maxLength={300} placeholder="Conte um pouco sobre você..." />
            <button type="submit" className="primary">Salvar alterações <Check size={15} /></button>
          </form>
        )}
        {isDemo && <p className="demo-readonly-note">Perfil em modo somente leitura.</p>}

        <div className="own-social-stats">
          <button type="button" onClick={() => void openOwnSocialList("followers")}>
            <Users size={17} /><strong>{ownSocialCounts.followers}</strong><span>Seguidores</span>
          </button>
          <button type="button" onClick={() => void openOwnSocialList("following")}>
            <UserRound size={17} /><strong>{ownSocialCounts.following}</strong><span>Seguindo</span>
          </button>
        </div>

        <div className="profile-facts">
          <div><small>IDENTIFICADOR</small><strong>@{profile.username}</strong></div>
          <div><small>GÊNERO</small><strong>{genders[profile.gender] || profile.gender}{profile.gender_description ? " · " + profile.gender_description : ""}</strong></div>
          <div><small>QUER CONHECER</small><strong>{profile.looking_for.map((value) => preferences[value] || value).join(", ")}</strong></div>
          <div><small>LOCALIZAÇÃO</small><strong>{profile.location_visible && profile.city && profile.state_code ? profile.city + " · " + profile.state_code : "Não exibida"}</strong></div>
          <div><small>PUBLICAÇÕES</small><strong>{ownPosts.length}</strong></div>
        </div>
      </section>

      <section className="profile-posts-section">
        <div className="section-heading">
          <div><strong>Minhas publicações</strong><span>Suas postagens ficam guardadas aqui, mesmo quando saem do feed recente.</span></div>
          <small>{ownPosts.length} PUBLICAÇÕES</small>
        </div>
        {ownPosts.map((post) => (
          <article className="post own-post" key={post.id}>
            <header>
              <Avatar p={profile} />
              <div><strong>{profile.display_name}</strong><span>@{profile.username} · {ago(post.created_at)}</span></div>
              {!isDemo && <button type="button" className="delete" title="Apagar publicação" onClick={() => void removePost(post.id)}><Trash2 size={16} /></button>}
            </header>
            {post.body && <p className="post-body">{post.body}</p>}
            {post.media_url && (
              <div className="post-media">
                {post.media_type === "video" ? <video src={post.media_url} controls /> : <img src={post.media_url} alt="Imagem da sua publicação" loading="lazy" />}
              </div>
            )}
            <div className="post-stats"><span>{post.likes} curtidas</span><span>{post.comments} comentários</span></div>
          </article>
        ))}
        {!ownPosts.length && (
          <div className="empty">
            <MessageSquare />
            <h3>Você ainda não publicou.</h3>
            <p>Quando fizer uma publicação, ela aparecerá aqui para você consultar e apagar quando quiser.</p>
          </div>
        )}
      </section>
    </>
  );
}

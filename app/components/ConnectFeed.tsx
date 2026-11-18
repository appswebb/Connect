"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import { ArrowRight, Ban, Flag, Heart, ImagePlus, MessageSquare, Send, Trash2, UserRound, X } from "lucide-react";
import Avatar from "./ConnectAvatar";
import { ago } from "../lib/connect-utils";
import type { Comment, Post, Profile } from "../types/connect";

type Props = {
  profile: Profile;
  currentUserId: string;
  isDemo: boolean;
  body: string;
  setBody: Dispatch<SetStateAction<string>>;
  file: File | null;
  setFile: Dispatch<SetStateAction<File | null>>;
  busy: boolean;
  publish: (event: FormEvent<HTMLFormElement>) => void;
  openImageCrop: (file: File, target: "post" | "avatar" | "banner" | "chat") => void;
  posts: Post[];
  openProfile: (id: string) => void | Promise<void>;
  removePost: (id: string) => void | Promise<void>;
  openReport: (userId: string, targetType?: string, targetId?: string) => void;
  blockUser: (id: string) => void | Promise<void>;
  like: (post: Post) => void | Promise<void>;
  openComments: (id: string) => void | Promise<void>;
  commentPost: string;
  comments: Comment[];
  commentText: string;
  setCommentText: Dispatch<SetStateAction<string>>;
  comment: (event: FormEvent<HTMLFormElement>, postId: string) => void | Promise<void>;
};

export default function ConnectFeed(props: Props) {
  const {
    profile, currentUserId, isDemo, body, setBody, file, setFile, busy, publish,
    openImageCrop, posts, openProfile, removePost, openReport, blockUser, like,
    openComments, commentPost, comments, commentText, setCommentText, comment,
  } = props;

  return (
    <>
      <div className="heading">
        <div>
          <small>SUA REDE, SEU MOMENTO</small>
          <h1>O que está <em>acontecendo.</em></h1>
          <p>Ideias, momentos e pessoas que fazem a diferença.</p>
        </div>
      </div>

      {!isDemo && (
        <form className="composer" id="composer" onSubmit={publish}>
          <div className="compose-row">
            <Avatar p={profile} />
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={"Compartilhe algo com a comunidade, " + profile.display_name.split(" ")[0] + "..."}
              maxLength={5000}
            />
          </div>
          {file && (
            <div className="file-name">
              {file.name}
              <button type="button" aria-label="Remover arquivo selecionado" onClick={() => setFile(null)}>
                <X size={14} />
              </button>
            </div>
          )}
          <div className="compose-footer">
            <label className="upload-label">
              <ImagePlus size={17} /> Foto ou vídeo
              <input
                type="file"
                hidden
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
                onChange={(event) => {
                  const selected = event.target.files?.[0];
                  if (selected?.type.startsWith("image/")) openImageCrop(selected, "post");
                  else setFile(selected || null);
                  event.currentTarget.value = "";
                }}
              />
            </label>
            <button className="primary" disabled={busy || (!body.trim() && !file)}>
              {busy ? "Publicando..." : "Publicar"} <ArrowRight size={15} />
            </button>
          </div>
        </form>
      )}

      {isDemo && (
        <div className="demo-readonly-note">
          Você está visualizando o feed. Publicações, curtidas e comentários ficam desativados no acesso de teste.
        </div>
      )}

      <div className="section-heading">
        <div>
          <strong>Feed da comunidade</strong>
          <span>Publicações reais de pessoas do CONNECT</span>
        </div>
        <small>MAIS RECENTES</small>
      </div>

      <div className="feed">
        {posts.map((post) => (
          <article className="post" key={post.id}>
            <header>
              <button type="button" className="profile-open-avatar" onClick={() => void openProfile(post.author.id)} aria-label={"Ver perfil de " + post.author.display_name}>
                <Avatar p={post.author} />
              </button>
              <div>
                <button type="button" className="profile-open-name" onClick={() => void openProfile(post.author.id)}>{post.author.display_name}</button>
                <span>
                  @{post.author.username}
                  {post.author.location_visible && post.author.city && post.author.state_code ? " · " + post.author.city + " / " + post.author.state_code : ""} · {ago(post.created_at)}
                </span>
              </div>
              {!isDemo && (post.user_id === profile.id ? (
                <button type="button" className="delete" title="Apagar publicação" onClick={() => void removePost(post.id)}><Trash2 size={16} /></button>
              ) : (
                <div className="post-safety-actions">
                  <button type="button" title="Denunciar publicação" onClick={() => openReport(post.user_id, "post", post.id)}><Flag size={14} /></button>
                  <button type="button" title="Denunciar perfil" onClick={() => openReport(post.user_id)}><UserRound size={14} /></button>
                  <button type="button" title="Bloquear pessoa" onClick={() => void blockUser(post.user_id)}><Ban size={14} /></button>
                </div>
              ))}
            </header>
            {post.body && <p className="post-body">{post.body}</p>}
            {post.media_url && (
              <div className="post-media">
                {post.media_type === "video" ? <video src={post.media_url} controls /> : <img src={post.media_url} alt="Imagem da publicação" loading="lazy" />}
              </div>
            )}
            <div className="post-stats"><span>{post.likes} curtidas</span><span>{post.comments} comentários</span></div>
            {!isDemo && (
              <>
                <div className="post-actions">
                  <button type="button" className={post.liked ? "liked" : ""} onClick={() => void like(post)}>
                    <Heart size={18} fill={post.liked ? "currentColor" : "none"} /> Curtir
                  </button>
                  <button type="button" onClick={() => void openComments(post.id)}><MessageSquare size={18} /> Comentar</button>
                </div>
                {commentPost === post.id && (
                  <div className="comments">
                    {comments.map((item) => (
                      <div className="comment" key={item.id}>
                        <button type="button" className="profile-open-avatar" onClick={() => void openProfile(item.author.id)} aria-label={"Ver perfil de " + item.author.display_name}>
                          <Avatar p={item.author} size="small" />
                        </button>
                        <div>
                          <strong><button type="button" className="profile-open-name" onClick={() => void openProfile(item.author.id)}>{item.author.display_name}</button></strong>
                          <p>{item.body}</p>
                          <small>{ago(item.created_at)}</small>
                          {item.user_id !== currentUserId && (
                            <button type="button" className="content-report-action" onClick={() => openReport(item.user_id, "comment", item.id)}>
                              <Flag size={12} /> Denunciar comentário
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {!comments.length && <p className="no-comments">Ainda não há comentários. Comece a conversa.</p>}
                    <form onSubmit={(event) => void comment(event, post.id)}>
                      <Avatar p={profile} size="small" />
                      <input value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Escreva um comentário..." maxLength={1500} />
                      <button type="submit" disabled={!commentText.trim()} aria-label="Enviar comentário"><Send size={16} /></button>
                    </form>
                  </div>
                )}
              </>
            )}
          </article>
        ))}
        {!posts.length && (
          <div className="empty">
            <MessageSquare />
            <h3>Seu feed começa aqui.</h3>
            <p>Quando você e outras pessoas publicarem, as novidades aparecerão neste espaço.</p>
          </div>
        )}
      </div>
    </>
  );
}

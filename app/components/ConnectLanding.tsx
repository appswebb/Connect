"use client";

import { ArrowRight, Eye, ShieldCheck, Users, MessageCircle, Globe2, UserSearch } from "lucide-react";

type ConnectLandingProps = {
  onSignIn: () => void;
  onSignUp: () => void;
  onDemo: () => void;
};

export default function ConnectLanding({ onSignIn, onSignUp, onDemo }: ConnectLandingProps) {
  return (
    <main className="connect-home" data-screen="marketing">
            <header className="landing-header">
              <a className="landing-brand" href="#inicio">
                <img src="/Connect/connect-mark.svg" alt="" />
                <span>CONNECT</span>
              </a>
              <nav aria-label="Seções da página">
                <a href="#experiencia">Experiência</a>
                <a href="#como">Como funciona</a>
                <a href="#possibilidades">Histórias</a>
              </nav>
              <div className="landing-actions">
                <button
                  type="button"
                  className="landing-login"
                  onClick={() => {
                    onSignIn();
                  }}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  className="landing-cta"
                  onClick={() => {
                    onSignUp();
                  }}
                >
                  Criar conta <ArrowRight size={16} />
                </button>
              </div>
            </header>
            <section className="landing-hero" id="inicio">
              <div className="landing-copy">
                <span className="landing-kicker">
                  <i /> CONEXÕES QUE ACONTECEM DE VERDADE
                </span>
                <h1>
                  Seu próximo
                  <br />
                  <span>encontro começa</span>
                  <br />
                  com uma conexão.
                </h1>
                <p>Um espaço para conhecer pessoas, conversar sem pressa e compartilhar os momentos que merecem ser vividos juntos.</p>
                <div className="landing-buttons">
                  <button
                    type="button"
                    className="landing-cta landing-cta-big"
                    onClick={() => {
                      onSignUp();
                    }}
                  >
                    Faça parte do CONNECT <ArrowRight size={18} />
                  </button>
                  <button type="button" className="landing-demo" onClick={() => onDemo()}>
                    <Eye size={16} /> Conhecer por dentro
                  </button>
                </div>
                <div className="landing-note">
                  <span className="landing-note-icon">
                    <ShieldCheck size={17} />
                  </span>
                  <span>
                    <strong>Seu espaço, suas escolhas.</strong>
                    <small>Privacidade e preferências respeitadas.</small>
                  </span>
                </div>
              </div>
              <div className="landing-art">
                <img className="landing-photo" src="/Connect/images/hero-friends.webp" alt="Amigos rindo juntos com seus celulares ao pôr do sol" width={1024} height={1280} fetchPriority="high" />
                <div className="landing-art-caption">
                  <span className="landing-art-dot" />
                  <div>
                    <strong>Um lugar para todo mundo.</strong>
                    <small>Pessoas · conversas · comunidades</small>
                  </div>
                  <span className="landing-art-arrow">
                    <ArrowRight size={18} />
                  </span>
                </div>
              </div>
            </section>
            <section className="landing-experience" id="experiencia">
              <div className="landing-section-heading">
                <span className="landing-kicker">UMA EXPERIÊNCIA COMPLETA</span>
                <h2>
                  Tudo o que aproxima.
                  <br />
                  <span>Em um só lugar.</span>
                </h2>
                <p>Do primeiro oi à próxima amizade, o CONNECT reúne ferramentas para você se sentir parte.</p>
              </div>
              <div className="landing-feature-grid">
                <article>
                  <span className="landing-feature-icon violet">
                    <Users />
                  </span>
                  <small>01 / PESSOAS</small>
                  <h3>Encontre sua turma</h3>
                  <p>Descubra perfis, siga pessoas e conheça quem combina com você.</p>
                </article>
                <article>
                  <span className="landing-feature-icon lime">
                    <MessageCircle />
                  </span>
                  <small>02 / CONVERSAS</small>
                  <h3>Fique por perto</h3>
                  <p>Converse em privado, responda mensagens e compartilhe arquivos.</p>
                </article>
                <article>
                  <span className="landing-feature-icon peach">
                    <Globe2 />
                  </span>
                  <small>03 / COMUNIDADES</small>
                  <h3>Faça parte</h3>
                  <p>Entre nas salas do Brasil e dos estados para trocar ideias.</p>
                </article>
                <article>
                  <span className="landing-feature-icon blue">
                    <UserSearch />
                  </span>
                  <small>04 / CONECTAR</small>
                  <h3>Viva o agora</h3>
                  <p>Entre na fila e converse na hora com alguém que também está online.</p>
                </article>
              </div>
            </section>
            <section className="landing-steps" id="como">
              <div className="landing-section-heading">
                <span className="landing-kicker">COMO FUNCIONA</span>
                <h2>
                  Três passos.
                  <br />
                  <span>E você já está dentro.</span>
                </h2>
              </div>
              <ol className="landing-step-list">
                <li>
                  <span>01</span>
                  <h3>Crie seu espaço</h3>
                  <p>Abra sua conta, escolha como quer aparecer e defina suas preferências.</p>
                </li>
                <li>
                  <span>02</span>
                  <h3>Encontre gente</h3>
                  <p>Descubra pessoas, salas do Brasil e conexões em tempo real no mesmo lugar.</p>
                </li>
                <li>
                  <span>03</span>
                  <h3>Continue a conversa</h3>
                  <p>Fale no privado, publique no feed e acompanhe o que importa para você.</p>
                </li>
              </ol>
            </section>
            <section className="landing-more" id="possibilidades">
              <div className="landing-more-visual">
                <img className="landing-more-photo" src="/Connect/images/community.webp" alt="Amigos reunidos ao pôr do sol" loading="lazy" width={1600} height={1000} />
              </div>
              <div className="landing-more-copy">
                <span className="landing-kicker">MAIS DO QUE UMA REDE SOCIAL</span>
                <h2>
                  Compartilhe momentos.
                  <br />
                  <span>Crie novas histórias.</span>
                </h2>
                <p>Perfil, feed, notificações, conexões e assinatura continuam juntos — agora com uma casa mais clara.</p>
                <button
                  className="landing-cta"
                  onClick={() => {
                    onSignUp();
                  }}
                >
                  Começar agora <ArrowRight size={16} />
                </button>
              </div>
            </section>
            <footer className="landing-footer">
              <a className="landing-brand" href="#inicio">
                <img src="/Connect/connect-mark.svg" alt="" />
                <span>CONNECT</span>
              </a>
              <nav>
                <a href="#experiencia">Experiência</a>
                <a href="#como">Como funciona</a>
                <a href="/Connect/download/">Baixar o app</a>
              </nav>
              <span>© CONNECT 2026 · FEITO PARA CONECTAR PESSOAS</span>
            </footer>
          </main>
  );
}

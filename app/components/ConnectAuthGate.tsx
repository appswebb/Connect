"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import { ArrowRight, Eye, Users } from "lucide-react";
import { genders, preferences } from "../lib/connect-data";

type ConnectAuthGateProps = {
  demoMode: boolean;
  onBack: () => void;
  mode: "signup" | "signin";
  setMode: Dispatch<SetStateAction<"signup" | "signin">>;
  demoUsername: string;
  setDemoUsername: Dispatch<SetStateAction<string>>;
  demoPassword: string;
  setDemoPassword: Dispatch<SetStateAction<string>>;
  demoLogin: (event: FormEvent) => void;
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  username: string;
  setUsername: Dispatch<SetStateAction<string>>;
  gender: string;
  setGender: Dispatch<SetStateAction<string>>;
  looking: string;
  setLooking: Dispatch<SetStateAction<string>>;
  description: string;
  setDescription: Dispatch<SetStateAction<string>>;
  email: string;
  setEmail: Dispatch<SetStateAction<string>>;
  password: string;
  setPassword: Dispatch<SetStateAction<string>>;
  auth: (event: FormEvent) => void;
  busy: boolean;
  error: string;
  notice: string;
};

export default function ConnectAuthGate(props: ConnectAuthGateProps) {
  const { demoMode, onBack, mode, setMode, demoUsername, setDemoUsername, demoPassword, setDemoPassword, demoLogin, name, setName, username, setUsername, gender, setGender, looking, setLooking, description, setDescription, email, setEmail, password, setPassword, auth, busy, error, notice } = props;
  if (demoMode) {
    return (
      <main className="connect-auth" data-screen="authentication">
              <section className="entry-story">
                <div className="entry-brand">
                  <img src="/connect-mark.svg" alt="" />
                  CONNECT
                </div>
                <div className="entry-story-copy">
                  <span>CONNECT / DEMONSTRAÇÃO</span>
                  <h1>
                    Entre e descubra
                    <br />
                    um novo jeito de
                    <br />
                    <em>se conectar.</em>
                  </h1>
                  <p>Explore a experiência com uma conta de demonstração. O acesso é somente para visualizar e não altera dados de usuários.</p>
                  <img className="entry-photo" src="/images/auth-night.webp" alt="" loading="lazy" width={896} height={1280} />
                </div>
                <footer>CONNECT © 2026 · PRIVACIDADE · RESPEITO</footer>
              </section>
              <section className="entry-form-wrap">
                <div className="entry-form">
                  <button type="button" className="entry-back" onClick={() => onBack()}>
                    ← Voltar para o início
                  </button>
                  <div className="entry-mark">
                    <Eye />
                  </div>
                  <span className="entry-overline">ACESSO DE TESTE</span>
                  <h2>Conheça por dentro.</h2>
                  <p>Use as credenciais de demonstração.</p>
                  <form onSubmit={demoLogin}>
                    <label>
                      Usuário
                      <input
                        required
                        autoComplete="username"
                        value={demoUsername}
                        onChange={(e) => setDemoUsername(e.target.value)}
                        placeholder="Usuário"
                      />
                    </label>
                    <label>
                      Senha
                      <input
                        required
                        type="password"
                        autoComplete="current-password"
                        value={demoPassword}
                        onChange={(e) => setDemoPassword(e.target.value)}
                        placeholder="Senha"
                      />
                    </label>
                    {error && <p className="error" role="alert">{error}</p>}
                    {notice && <p className="success" role="status">{notice}</p>}
                    <button className="entry-submit" disabled={busy}>
                      {busy ? "Entrando..." : "Entrar na demonstração"} <ArrowRight size={17} />
                    </button>
                  </form>
                  <small className="entry-terms">
                    Acesso somente para visualizar. Cadastro e recursos de escrita não são liberados nesta conta.
                  </small>
                </div>
              </section>
            </main>
    );
  }
  return (
    <main className="entry-layout">
            <section className="entry-story">
              <div className="entry-brand">
                <img src="/connect-mark.svg" alt="" />
                CONNECT
              </div>
              <div className="entry-story-copy">
                <span>SEU ESPAÇO COMEÇA AQUI</span>
                <h1>
                  Conexões reais.
                  <br />
                  Conversas leves.
                  <br />
                  <em>Novas histórias.</em>
                </h1>
                <p>Conheça pessoas, encontre comunidades e compartilhe momentos em um espaço feito para aproximar.</p>
                <img className="entry-photo" src="/images/auth-night.webp" alt="" loading="lazy" width={896} height={1280} />
              </div>
              <footer>CONNECT © 2026 · PRIVACIDADE · RESPEITO</footer>
            </section>
            <section className="entry-form-wrap">
              <div className="entry-form">
                <button type="button" className="entry-back" onClick={() => onBack()}>
                  ← Voltar para o início
                </button>
                <div className="entry-mark">
                  <Users />
                </div>
                <span className="entry-overline">{mode === "signup" ? "BEM-VINDO À COMUNIDADE" : "BOM TER VOCÊ DE VOLTA"}</span>
                <h2>{mode === "signup" ? "Crie seu espaço." : "Entre no CONNECT."}</h2>
                <p>{mode === "signup" ? "Seu próximo capítulo pode começar com uma nova conexão." : "Continue de onde suas conexões estão."}</p>
                <div className="entry-tabs">
                  <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>
                    Criar conta
                  </button>
                  <button type="button" className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>
                    Entrar
                  </button>
                </div>
                <form onSubmit={auth}>
                  {mode === "signup" && (
                    <>
                      <label>
                        Seu nome
                        <input
                          required
                          minLength={2}
                          maxLength={40}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Como quer ser chamado(a)"
                        />
                      </label>
                      <label>
                        Seu @ exclusivo
                        <input
                          required
                          minLength={1}
                          maxLength={20}
                          value={username}
                          onChange={(e) => setUsername(e.target.value.replace(/^@/, ""))}
                          placeholder="seuusuario"
                        />
                      </label>
                      <div className="form-grid">
                        <label>
                          Como se identifica?
                          <select value={gender} onChange={(e) => setGender(e.target.value)}>
                            {Object.entries(genders).map(([v, l]) => (
                              <option key={v} value={v}>
                                {l}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Quer conhecer?
                          <select value={looking} onChange={(e) => setLooking(e.target.value)}>
                            {Object.entries(preferences).map(([v, l]) => (
                              <option key={v} value={v}>
                                {l}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      {gender === "self_described" && (
                        <label>
                          Descreva seu gênero
                          <input required value={description} onChange={(e) => setDescription(e.target.value)} />
                        </label>
                      )}
                    </>
                  )}
                  <label>
                    E-mail
                    <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
                  </label>
                  <label>
                    Senha
                    <input
                      required
                      type="password"
                      minLength={mode === "signup" ? 8 : 1}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Sua senha"
                    />
                  </label>
                  {error && <p className="error">{error}</p>}
                  {notice && <p className="success">{notice}</p>}
                  <button className="entry-submit" disabled={busy}>
                    {busy ? "Aguarde..." : mode === "signup" ? "Criar minha conta" : "Entrar"} <ArrowRight size={17} />
                  </button>
                </form>
                <p className="entry-terms">Ao continuar, você concorda em usar o CONNECT com respeito e responsabilidade.</p>
              </div>
            </section>
          </main>
  );
}

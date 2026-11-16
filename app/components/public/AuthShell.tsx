"use client";

import { ReactNode, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Heart, MessageCircle, Moon, Radio, ShieldCheck, Sun } from "lucide-react";

type ShellProps = {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onBack: () => void;
  icon: ReactNode;
  overline: string;
  title: string;
  subtitle: string;
  storyKicker: string;
  storyTitle: ReactNode;
  storyText: string;
  footnote: ReactNode;
  children: ReactNode;
};

/** Moldura visual compartilhada por login, cadastro e acesso de demonstração. */
export function AuthShell({ theme, onToggleTheme, onBack, icon, overline, title, subtitle, storyKicker, storyTitle, storyText, footnote, children }: ShellProps) {
  return (
    <main className="auth">
      <section className="auth-story" aria-hidden="false">
        <span className="auth-orb auth-orb--1" aria-hidden="true" />
        <span className="auth-orb auth-orb--2" aria-hidden="true" />
        <a className="auth-brand" role="button" tabIndex={0} onClick={onBack} onKeyDown={e => { if (e.key === "Enter") onBack(); }}>
          <img src="/Connect/connect-mark.svg" alt="" /> connect
        </a>
        <div className="auth-story__copy">
          <span className="auth-story__kicker">{storyKicker}</span>
          <h1>{storyTitle}</h1>
          <p>{storyText}</p>
        </div>
        <div className="auth-preview" aria-hidden="true">
          <div className="auth-preview__card auth-preview__card--a"><span className="auth-preview__ico"><MessageCircle size={16} /></span><div><strong>Nova mensagem</strong><small>Marina Alves · agora</small></div></div>
          <div className="auth-preview__card auth-preview__card--b"><span className="auth-preview__ico auth-preview__ico--live"><Radio size={16} /></span><div><strong>Live começando</strong><small>118 pessoas assistindo</small></div></div>
          <div className="auth-preview__card auth-preview__card--c"><span className="auth-preview__ico auth-preview__ico--heart"><Heart size={16} /></span><div><strong>24 curtidas</strong><small>na sua publicação</small></div></div>
        </div>
        <footer className="auth-story__foot"><ShieldCheck size={14} /> Privacidade e respeito em primeiro lugar</footer>
      </section>

      <section className="auth-panel">
        <div className="auth-panel__top">
          <button type="button" className="auth-back" onClick={onBack}><ArrowLeft size={16} /> Voltar para o início</button>
          <button type="button" className="auth-theme" onClick={onToggleTheme} aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}>
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
        <div className="auth-card">
          <div className="auth-card__mark">{icon}</div>
          <span className="auth-card__overline">{overline}</span>
          <h2>{title}</h2>
          <p className="auth-card__sub">{subtitle}</p>
          {children}
          <p className="auth-foot">{footnote}</p>
        </div>
      </section>
    </main>
  );
}

/** Campo de senha com botão para mostrar/ocultar. */
export function PasswordField(props: {
  label: string; value: string; onChange: (value: string) => void;
  minLength?: number; autoComplete: string; placeholder?: string; meter?: boolean;
}) {
  const [shown, setShown] = useState(false);
  const length = props.value.length;
  const level = length === 0 ? 0 : length < 8 ? 1 : length < 12 ? 2 : 3;
  return (
    <label className="auth-field">
      <span>{props.label}</span>
      <span className="auth-input auth-input--pw">
        <input required type={shown ? "text" : "password"} minLength={props.minLength} autoComplete={props.autoComplete}
          value={props.value} onChange={e => props.onChange(e.target.value)} placeholder={props.placeholder} />
        <button type="button" onClick={() => setShown(s => !s)} aria-label={shown ? "Ocultar senha" : "Mostrar senha"} aria-pressed={shown}>
          {shown ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </span>
      {props.meter && (
        <span className="auth-meter" data-level={level} aria-live="polite">
          <i /><i /><i />
          <small>{level === 0 ? "Use pelo menos 8 caracteres" : level === 1 ? "Muito curta — mínimo de 8 caracteres" : level === 2 ? "Boa senha" : "Senha forte"}</small>
        </span>
      )}
    </label>
  );
}

export function AuthMessage({ error, notice }: { error?: string; notice?: string }) {
  if (!error && !notice) return null;
  return <p className={"auth-msg " + (error ? "auth-msg--error" : "auth-msg--ok")} role={error ? "alert" : "status"}>{error || notice}</p>;
}

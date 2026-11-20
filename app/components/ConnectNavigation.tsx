"use client";

import { useEffect, useRef } from "react";
import { connectNavigationItems } from "../lib/connect-navigation";

type Props = {
  tab: string;
  setTab: (tab: string) => void;
  queue: string;
};

export default function ConnectNavigation({ tab, setTab, queue }: Props) {
  const bottomNavRef = useRef<HTMLElement | null>(null);

  // Keep the active item visible in the swipeable mobile bar.
  useEffect(() => {
    const bar = bottomNavRef.current;
    const active = bar?.querySelector<HTMLElement>("button.active");
    if (!bar || !active) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const left = active.offsetLeft - (bar.clientWidth - active.offsetWidth) / 2;
    bar.scrollTo({ left: Math.max(0, left), behavior: reduce ? "auto" : "smooth" });
  }, [tab]);

  return (
    <>
      <aside className="connect-rail" aria-label="Navegação do CONNECT">
        <a className="brand" href="#inicio" aria-label="CONNECT — início" onClick={(event) => { event.preventDefault(); setTab("feed"); }}>
          <span className="brand-icon">
            <img className="connect-brand-symbol" src="/connect-mark.svg" alt="" />
          </span>
          <span>CONNECT</span>
        </a>
        <nav aria-label="Navegação principal">
          {connectNavigationItems.map(([id, label, Icon]) => (
            <button
              type="button"
              key={id}
              aria-current={tab === id ? "page" : undefined}
              className={tab === id ? "selected" : ""}
              onClick={() => setTab(id)}
            >
              <Icon size={17} />
              <span>{label}</span>
              {id === "queue" && queue === "waiting" && <i aria-label="Busca em andamento" />}
            </button>
          ))}
        </nav>
        <span className="sidebar-spacer" />
        <span className="sidebar-caption"><i /> SUA COMUNIDADE, SEU ESPAÇO</span>
      </aside>

      <nav className="connect-bottom-nav" aria-label="Navegação principal" ref={bottomNavRef}>
        {connectNavigationItems.map(([id, label, Icon]) => (
          <button
            type="button"
            key={id}
            title={label}
            aria-label={label}
            aria-current={tab === id ? "page" : undefined}
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            <Icon />
            <span>{label}</span>
            {id === "queue" && queue === "waiting" && <i aria-label="Busca em andamento" />}
          </button>
        ))}
      </nav>
    </>
  );
}

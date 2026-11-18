"use client";

import type { Dispatch, SetStateAction } from "react";
import { Menu } from "lucide-react";
import { connectNavigationItems } from "../lib/connect-navigation";

type Props = {
  tab: string;
  setTab: Dispatch<SetStateAction<string>>;
  queue: string;
  mobileMoreOpen: boolean;
  setMobileMoreOpen: Dispatch<SetStateAction<boolean>>;
};

export default function ConnectNavigation({ tab, setTab, queue, mobileMoreOpen, setMobileMoreOpen }: Props) {
  const mainItems = connectNavigationItems.filter(([id]) => ["feed", "queue", "chat", "people"].includes(id));
  const secondaryItems = connectNavigationItems.filter(([id]) => ["rooms", "lives"].includes(id));

  return (
    <>
      <aside className="connect-rail" aria-label="Navegação do CONNECT">
        <a className="brand" href="#inicio" aria-label="CONNECT — início" onClick={(event) => { event.preventDefault(); setTab("feed"); }}>
          <span className="brand-icon">
            <img className="connect-brand-symbol" src="/Connect/connect-mark.svg" alt="" />
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

      <nav className="connect-bottom-nav" aria-label="Navegação principal">
        {mainItems.map(([id, label, Icon]) => (
          <button
            type="button"
            key={id}
            title={label}
            aria-label={label}
            aria-current={tab === id ? "page" : undefined}
            className={tab === id ? "active" : ""}
            onClick={() => { setTab(id); setMobileMoreOpen(false); }}
          >
            <Icon />
            <span>{label}</span>
            {id === "queue" && queue === "waiting" && <i aria-label="Busca em andamento" />}
          </button>
        ))}
        <button
          type="button"
          title="Mais opções"
          aria-label="Mais opções"
          aria-expanded={mobileMoreOpen}
          aria-haspopup="menu"
          className={mobileMoreOpen || ["rooms", "lives"].includes(tab) ? "active" : ""}
          onClick={() => setMobileMoreOpen((value) => !value)}
        >
          <Menu />
          <span>Mais</span>
        </button>
        {mobileMoreOpen && (
          <div className="mobile-more-menu" role="menu" aria-label="Mais áreas do CONNECT">
            {secondaryItems.map(([id, label, Icon]) => (
              <button type="button" role="menuitem" key={id} className={tab === id ? "active" : ""} onClick={() => { setTab(id); setMobileMoreOpen(false); }}>
                <Icon size={18} /><span>{label}</span>
              </button>
            ))}

          </div>
        )}
      </nav>
    </>
  );
}

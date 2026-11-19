"use client";

import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { Activity, ArrowRight, Compass, Heart, Loader2, MapPin, MessageCircle, ShieldCheck, Users, X } from "lucide-react";
import Avatar from "./ConnectAvatar";
import type { Profile } from "../types/connect";

type Props = {
  communityProfiles: Profile[];
  peopleTotal: number;
  peopleNewThisWeek: number;
  peopleHasMore: boolean;
  peopleLoading: boolean;
  loadMorePeople: () => void | Promise<void>;
  profile: Profile;
  onlinePeople: string[];
  peopleSearch: string;
  setPeopleSearch: Dispatch<SetStateAction<string>>;
  peopleFilter: string;
  setPeopleFilter: Dispatch<SetStateAction<string>>;
  openProfile: (id: string) => void | Promise<void>;
};

export default function ConnectPeopleDirectory({
  communityProfiles, peopleTotal, peopleNewThisWeek, peopleHasMore, peopleLoading, loadMorePeople,
  profile, onlinePeople, peopleSearch, setPeopleSearch,
  peopleFilter, setPeopleFilter, openProfile,
}: Props) {
  // A filtragem, a busca e a ordenação acontecem no banco (paginação por cursor).
  // Aqui só evitamos duplicatas visuais e carregamos a próxima página ao chegar no fim da lista.
  const people = Array.from(new Map(communityProfiles.map((person) => [person.id, person])).values());
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef(loadMorePeople);
  loadMoreRef.current = loadMorePeople;
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !peopleHasMore || peopleLoading || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void loadMoreRef.current();
    }, { rootMargin: "320px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [peopleHasMore, peopleLoading, people.length]);

  return (
    <>
      <section className="people-page-hero">
        <div className="people-hero-copy">
          <small><Users size={14} /> CONNECT · COMUNIDADE EM TEMPO REAL</small>
          <h1>Conexões que <em>acontecem aqui.</em></h1>
          <p>Descubra pessoas, participe das conversas e encontre novas histórias pelo Brasil.</p>
          <div className="people-hero-stats">
            <span><strong>{Math.max(peopleTotal, people.length) + 1}</strong><small>MEMBROS</small><em>Na comunidade</em></span>
            <span><strong>{onlinePeople.length}</strong><small>ONLINE AGORA</small><em>Conectados neste momento</em></span>
            <span><strong>{peopleNewThisWeek + (profile.created_at && Date.now() - new Date(profile.created_at).getTime() < 7 * 86400000 ? 1 : 0)}</strong><small>NOVOS ESTA SEMANA</small><em>Chegaram recentemente</em></span>
          </div>
        </div>
        <div className="people-hero-art" aria-hidden="true">
          <div className="people-hero-avatar p1"><Users /></div>
          <div className="people-hero-avatar p2"><Heart /></div>
          <div className="people-hero-avatar p3"><MessageCircle /></div>
          <div className="people-hero-core"><Activity size={27} /></div>
        </div>
      </section>

      <div className="people-directory-search" role="search">
        <label htmlFor="people-search-input"><Compass size={18} /><span className="sr-only">Buscar pessoas</span></label>
        <input
          id="people-search-input"
          type="search"
          value={peopleSearch}
          onChange={(event) => setPeopleSearch(event.target.value)}
          placeholder="Busque por nome, @, cidade ou interesse..."
        />
        {peopleSearch && (
          <button type="button" onClick={() => setPeopleSearch("")} aria-label="Limpar busca">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="people-filter-row" role="group" aria-label="Filtrar pessoas">
        {[
          { id: "all", label: "Todos" },
          { id: "online", label: "Online agora" },
          { id: "new", label: "Novos membros" },
          { id: "near", label: "Da minha cidade" },
        ].map((filter) => (
          <button type="button" key={filter.id} aria-pressed={peopleFilter === filter.id} className={peopleFilter === filter.id ? "active" : ""} onClick={() => setPeopleFilter(filter.id)}>
            {filter.id === "online" && <i className="people-live-dot" />} {filter.label}
          </button>
        ))}
      </div>

      <div className="people-directory-results" aria-live="polite">
        <span>{people.length}{peopleHasMore ? "+" : ""} {people.length === 1 ? "pessoa encontrada" : "pessoas encontradas"}</span>
        <span>Comunidade CONNECT</span>
      </div>

      <div className="people-directory-grid">
        {people.map((person) => {
          const isNew = Boolean(person.created_at && Date.now() - new Date(person.created_at).getTime() < 7 * 86400000);
          const online = onlinePeople.includes(person.id);
          return (
            <button type="button" className="people-directory-card" key={person.id} onClick={() => void openProfile(person.id)}>
              <div className="people-card-cover">
                {person.banner_url && <img className="people-card-cover-image" src={person.banner_url} alt="" loading="lazy" />}
                <span><ShieldCheck size={12} /> CONNECT</span>
              </div>
              <div className="people-card-content">
                <Avatar p={person} size="large" />
                <div className="people-card-identity">
                  <div className="people-card-badges">
                    {isNew && <b>NOVO</b>}
                    <i className={online ? "people-status-online" : "people-status-offline"}>{online ? "ONLINE" : "MEMBRO"}</i>
                  </div>
                  <strong>{person.display_name}</strong>
                  <small>@{person.username}</small>
                </div>
                <p>{person.bio || "Ainda não adicionou uma apresentação."}</p>
                <div className="people-card-meta">
                  {person.location_visible && person.city && person.state_code ? (
                    <span><MapPin size={12} /> {person.city} · {person.state_code}</span>
                  ) : (
                    <span><Users size={12} /> Comunidade CONNECT</span>
                  )}
                  <i><span>Ver perfil</span><ArrowRight size={15} /></i>
                </div>
              </div>
            </button>
          );
        })}
        {people.length === 0 && !peopleLoading && (
          <div className="empty people-directory-empty">
            <Compass />
            <h3>{peopleFilter === "near" ? "Não encontramos membros da sua cidade." : "Nenhuma pessoa encontrada."}</h3>
            <p>{peopleFilter === "online" ? "Quando alguém estiver online, vai aparecer aqui em tempo real." : "Tente mudar os filtros ou buscar por outro termo."}</p>
            <button type="button" className="secondary" onClick={() => { setPeopleFilter("all"); setPeopleSearch(""); }}>
              Mostrar todo mundo
            </button>
          </div>
        )}
      </div>

      {peopleLoading && people.length === 0 && (
        <p className="people-loading" role="status"><Loader2 size={16} className="spin" /> Carregando pessoas...</p>
      )}
      {people.length > 0 && (
        <div className="people-load-more" ref={sentinelRef}>
          {peopleHasMore ? (
            <button type="button" className="secondary" disabled={peopleLoading} onClick={() => void loadMorePeople()}>
              {peopleLoading ? "Carregando..." : "Carregar mais pessoas"}
            </button>
          ) : (
            <small>Você viu todas as pessoas desta busca.</small>
          )}
        </div>
      )}
    </>
  );
}

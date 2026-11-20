"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AlertTriangle, BellRing, Check, LoaderCircle, Megaphone, RefreshCw, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabase";
import { ago } from "../lib/connect-utils";
import type { AdminOverview, AdminReportItem, ConnectAnnouncement } from "../types/connect";

const OVERVIEW_LABELS: Record<string, string> = {
  users_total: "Usuários cadastrados",
  total_users: "Usuários cadastrados",
  profiles_total: "Perfis ativos",
  active_subscriptions: "Assinaturas ativas",
  open_reports: "Denúncias abertas",
  pending_reports: "Denúncias pendentes",
  reports_open: "Denúncias abertas",
  posts_total: "Publicações",
  matches_total: "Conexões confirmadas",
  active_announcements: "Avisos ativos",
};

const REPORT_STATUS_OPTIONS = [
  { value: "pending", label: "Pendente" },
  { value: "reviewing", label: "Em análise" },
  { value: "resolved", label: "Resolvida" },
  { value: "dismissed", label: "Arquivada" },
];

type Props = {
  onAnnouncementsUpdated: () => void | Promise<void>;
  onOpenProfile: (userId: string) => void | Promise<void>;
};

export default function ConnectAdminPanel({ onAnnouncementsUpdated, onOpenProfile }: Props) {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [reports, setReports] = useState<AdminReportItem[]>([]);
  const [announcements, setAnnouncements] = useState<ConnectAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreReports, setHasMoreReports] = useState(false);
  const [savingReportId, setSavingReportId] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementBody, setAnnouncementBody] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [overviewRes, reportsRes, announcementsRes] = await Promise.all([
        supabase.rpc("admin_overview"),
        supabase.rpc("admin_list_reports", { p_limit: 20, p_before: null }),
        supabase
          .from("connect_announcements")
          .select("id,title,body,active,created_at")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      if (overviewRes.error) throw overviewRes.error;
      const ov = Array.isArray(overviewRes.data) ? overviewRes.data[0] : overviewRes.data;
      setOverview((ov || {}) as AdminOverview);

      if (reportsRes.error) throw reportsRes.error;
      const list = Array.isArray(reportsRes.data) ? (reportsRes.data as AdminReportItem[]) : [];
      setReports(list);
      setHasMoreReports(list.length >= 20);

      if (!announcementsRes.error) {
        setAnnouncements((announcementsRes.data || []) as ConnectAnnouncement[]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar o painel administrativo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function loadMoreReports() {
    if (loadingMore || !reports.length) return;
    const last = reports[reports.length - 1];
    setLoadingMore(true);
    setError("");
    try {
      const res = await supabase.rpc("admin_list_reports", { p_limit: 20, p_before: last.created_at });
      if (res.error) throw res.error;
      const next = Array.isArray(res.data) ? (res.data as AdminReportItem[]) : [];
      setReports((old) => [...old, ...next.filter((item) => !old.some((existing) => existing.id === item.id))]);
      setHasMoreReports(next.length >= 20);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar mais denúncias.");
    } finally {
      setLoadingMore(false);
    }
  }

  async function updateReportStatus(reportId: string, status: string) {
    setSavingReportId(reportId);
    setError("");
    setFeedback("");
    try {
      const res = await supabase.rpc("admin_set_report_status", { p_report: reportId, p_status: status });
      if (res.error) throw res.error;
      setReports((old) => old.map((item) => (item.id === reportId ? { ...item, status } : item)));
      setFeedback("Status da denúncia atualizado para \"" + status + "\".");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar a denúncia.");
    } finally {
      setSavingReportId("");
    }
  }

  async function publishAnnouncement(event: FormEvent) {
    event.preventDefault();
    if (!announcementTitle.trim() || !announcementBody.trim() || publishing) return;
    setPublishing(true);
    setError("");
    setFeedback("");
    try {
      const res = await supabase.rpc("admin_publish_announcement", {
        p_title: announcementTitle.trim(),
        p_body: announcementBody.trim(),
      });
      if (res.error) throw res.error;
      setAnnouncementTitle("");
      setAnnouncementBody("");
      setFeedback("Aviso publicado para a comunidade.");
      await loadAll();
      await onAnnouncementsUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível publicar o aviso.");
    } finally {
      setPublishing(false);
    }
  }

  const overviewEntries = overview
    ? Object.entries(overview).filter(([, value]) => value !== null && value !== undefined && typeof value !== "object")
    : [];

  return (
    <section className="admin-workspace" aria-label="Painel administrativo do CONNECT">
      <div className="heading">
        <div>
          <small>ADMINISTRAÇÃO CONNECT</small>
          <h1>
            Painel <em>Admin.</em>
          </h1>
          <p>Acompanhe métricas gerais, gerencie denúncias e publique avisos oficiais.</p>
        </div>
        <button type="button" className="secondary" onClick={() => void loadAll()} disabled={loading}>
          <RefreshCw size={15} className={loading ? "spin" : ""} /> Atualizar
        </button>
      </div>

      {error && (
        <div className="flash error" role="alert">
          <span>{error}</span>
        </div>
      )}
      {feedback && (
        <div className="flash success" role="status">
          <span>{feedback}</span>
        </div>
      )}

      <section className="admin-card">
        <div className="section-heading">
          <div>
            <strong>Visão geral da plataforma</strong>
            <span>Indicadores retornados diretamente pelo servidor</span>
          </div>
          <ShieldCheck size={18} />
        </div>
        {loading ? (
          <div className="admin-loading">
            <LoaderCircle size={18} className="spin" /> Carregando indicadores...
          </div>
        ) : overviewEntries.length ? (
          <div className="admin-overview-grid">
            {overviewEntries.map(([key, value]) => (
              <article className="admin-stat-card" key={key}>
                <small>{OVERVIEW_LABELS[key] || key.replace(/_/g, " ")}</small>
                <strong>{String(value)}</strong>
              </article>
            ))}
          </div>
        ) : (
          <p className="admin-muted">Nenhum indicador disponível no momento.</p>
        )}
      </section>

      <div className="admin-columns">
        <section className="admin-card">
          <div className="section-heading">
            <div>
              <strong>Denúncias recentes</strong>
              <span>Paginação por data de criação · altere o status conforme a análise</span>
            </div>
            <AlertTriangle size={18} />
          </div>

          <div className="admin-report-list">
            {reports.map((report) => (
              <article className="admin-report-item" key={report.id}>
                <header>
                  <div>
                    <strong>{report.category || "Denúncia"}</strong>
                    <small>
                      {report.target_type || "conteúdo"} · {ago(report.created_at)}
                    </small>
                  </div>
                  <span className={"admin-status-badge status-" + report.status}>{report.status}</span>
                </header>
                {report.details && <p>{report.details}</p>}
                <div className="admin-report-meta">
                  {report.reported_user_id && (
                    <button type="button" className="secondary" onClick={() => void onOpenProfile(report.reported_user_id!)}>
                      Ver perfil denunciado
                    </button>
                  )}
                  <label className="admin-status-control">
                    <span>Alterar status:</span>
                    <select
                      aria-label={"Status da denúncia " + report.id}
                      value={report.status}
                      disabled={savingReportId === report.id}
                      onChange={(event) => void updateReportStatus(report.id, event.target.value)}
                    >
                      {!REPORT_STATUS_OPTIONS.some((opt) => opt.value === report.status) && (
                        <option value={report.status}>{report.status}</option>
                      )}
                      {REPORT_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label} ({opt.value})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </article>
            ))}
            {!loading && !reports.length && (
              <div className="empty">
                <ShieldCheck />
                <h3>Nenhuma denúncia registrada.</h3>
                <p>Quando usuários enviarem denúncias, elas aparecerão nesta fila.</p>
              </div>
            )}
          </div>

          {hasMoreReports && (
            <div className="admin-load-more">
              <button type="button" className="secondary" onClick={() => void loadMoreReports()} disabled={loadingMore}>
                {loadingMore ? "Carregando..." : "Carregar denúncias anteriores"}
              </button>
            </div>
          )}
        </section>

        <section className="admin-card">
          <div className="section-heading">
            <div>
              <strong>Publicar aviso oficial</strong>
              <span>Avisos ativos ficam visíveis para usuários autenticados no CONNECT</span>
            </div>
            <Megaphone size={18} />
          </div>

          <form className="admin-announcement-form" onSubmit={publishAnnouncement}>
            <label>
              Título do aviso
              <input
                required
                maxLength={120}
                value={announcementTitle}
                onChange={(event) => setAnnouncementTitle(event.target.value)}
                placeholder="Ex.: Novidade no CONNECT"
              />
            </label>
            <label>
              Mensagem
              <textarea
                required
                rows={4}
                maxLength={1000}
                value={announcementBody}
                onChange={(event) => setAnnouncementBody(event.target.value)}
                placeholder="Escreva o comunicado para a comunidade..."
              />
            </label>
            <button type="submit" className="primary" disabled={publishing || !announcementTitle.trim() || !announcementBody.trim()}>
              {publishing ? <LoaderCircle size={15} className="spin" /> : <Check size={15} />}
              {publishing ? "Publicando..." : "Publicar aviso"}
            </button>
          </form>

          <div className="admin-announcements-list">
            <strong>
              <BellRing size={14} /> Avisos recentes
            </strong>
            {announcements.map((item) => (
              <article key={item.id} className="admin-announcement-item">
                <header>
                  <strong>{item.title}</strong>
                  <small>{item.active ? "Ativo" : "Inativo"} · {ago(item.created_at)}</small>
                </header>
                <p>{item.body}</p>
              </article>
            ))}
            {!announcements.length && <p className="admin-muted">Nenhum aviso publicado ainda.</p>}
          </div>
        </section>
      </div>
    </section>
  );
}

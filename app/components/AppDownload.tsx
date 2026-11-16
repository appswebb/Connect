"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, RefreshCw, ShieldCheck } from "lucide-react";

type ReleaseAsset = { name: string; browser_download_url: string; download_count: number };
type Release = { tag_name: string; name: string; body: string; published_at: string; html_url: string; assets: ReleaseAsset[] };
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }> };
type SiteVersion = { version: string; commit: string; updatedAt: string; changes: string };

export default function AppDownload() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [siteVersion, setSiteVersion] = useState<SiteVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPrompt);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    fetch("/Connect/app-version.json", { cache: "no-store" }).then(response => response.ok ? response.json() as Promise<SiteVersion> : null).then(data => { if (data) setSiteVersion(data); }).catch(() => {});
    fetch("https://api.github.com/repos/appswebb/Connect/releases?per_page=8", { cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error("Não foi possível consultar as versões agora.");
        return response.json() as Promise<Release[]>;
      })
      .then(data => setReleases(Array.isArray(data) ? data : []))
      .catch(() => setError("Não foi possível carregar o histórico de versões. Tente novamente mais tarde."))
      .finally(() => setLoading(false));
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const latest = releases[0];
  const apk = latest?.assets?.find(asset => asset.name.toLowerCase().endsWith(".apk"));
  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return <div className="app-download">
    <section className="app-download-card">
      <span className="app-download-eyebrow">CONNECT · APLICATIVO OFICIAL</span>
      <h2>Leve suas conexões com você.</h2>
      <p>O aplicativo abre o CONNECT em uma experiência própria de celular. Seu perfil, conversas, salas, transmissões, notificações e demais recursos continuam ligados à mesma conta do site.</p>
      <div className="app-download-status"><i/> O site continua funcionando normalmente pelo navegador</div>
      {siteVersion && <div className="app-download-note"><strong>Última atualização do CONNECT: {new Date(siteVersion.updatedAt).toLocaleString("pt-BR",{dateStyle:"long",timeStyle:"short"})}</strong><br/>{siteVersion.changes} <small>· {siteVersion.version}</small></div>}
      {installed ? <p>O CONNECT já está instalado neste dispositivo.</p> : installPrompt ? <div><button className="primary" onClick={install}><Smartphone size={16}/> Instalar CONNECT neste celular</button></div> : <p>Para instalar agora pelo navegador, abra o menu do Chrome e escolha “Instalar aplicativo” ou “Adicionar à tela inicial”. No iPhone, use Compartilhar e depois “Adicionar à Tela de Início”.</p>}
    </section>
    <section className="app-download-card">
      <span className="app-download-eyebrow">ANDROID · APK</span>
      <h2>Baixar para Android</h2>
      {loading ? <p>Consultando a versão mais recente...</p> : apk ? <><p>Versão {latest.tag_name} · publicada em {new Date(latest.published_at).toLocaleDateString("pt-BR")}</p><a className="primary" href={apk.browser_download_url}><Download size={16}/> Baixar APK atualizado</a><p>Depois de baixar, abra o arquivo no celular e autorize a instalação quando o Android solicitar.</p></> : <><p>O instalador APK está sendo preparado. Enquanto ele não é publicado, você já pode instalar o CONNECT pelo próprio navegador usando a opção acima.</p><span className="app-download-status"><RefreshCw size={13}/> Aguardando a primeira versão Android assinada</span></>}
    </section>
    <section>
      <div className="section-heading"><div><strong>Histórico de atualizações</strong><span>Versões e novidades publicadas para o aplicativo CONNECT.</span></div></div>
      {siteVersion && <article className="app-release"><header><strong>Atualização do site · {siteVersion.version}</strong><time>{new Date(siteVersion.updatedAt).toLocaleString("pt-BR",{day:"2-digit",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"})}</time></header><p>{siteVersion.changes}</p><small>Esta versão do site já está disponível. O aplicativo abre a versão atual automaticamente.</small></article>}
      {error && <div className="app-download-note">{error}</div>}
      {!loading && !releases.length && !error && <div className="app-download-note"><ShieldCheck size={15}/> A primeira versão pública ainda está sendo preparada. Assim que uma versão for publicada, a data e as novidades aparecerão aqui.</div>}
      <div className="app-release-list">{releases.map(release => {
        const releaseApk = release.assets?.find(asset => asset.name.toLowerCase().endsWith(".apk"));
        return <article className="app-release" key={release.tag_name}>
          <header><strong>{release.name || release.tag_name}</strong><time>{new Date(release.published_at).toLocaleString("pt-BR",{day:"2-digit",month:"long",year:"numeric"})}</time></header>
          <p>{release.body || "Atualização do CONNECT."}</p>
          {releaseApk ? <a href={releaseApk.browser_download_url}><Download size={13}/> Baixar esta versão</a> : <small>Sem APK anexado a esta versão.</small>}
        </article>;
      })}</div>
      <div className="app-download-note">As atualizações do site aparecem automaticamente. Para atualizar o APK instalado, baixe a versão mais recente nesta área e instale por cima da anterior. Use sempre o APK publicado pelo CONNECT.</div>
    </section>
  </div>;
}

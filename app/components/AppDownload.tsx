"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, RefreshCw, ShieldCheck, Sparkles, Globe2, Clock3, CheckCircle2, ArrowDownToLine } from "lucide-react";

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
    const controller = new AbortController();
    const onPrompt = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPrompt); };
    const onInstalled = () => { setInstalled(true); setInstallPrompt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    fetch("/Connect/app-version.json", { cache: "no-store", signal: controller.signal }).then(r => r.ok ? r.json() as Promise<SiteVersion> : null).then(v => { if (v) setSiteVersion(v); }).catch(() => {});
    fetch("https://api.github.com/repos/appswebb/Connect/releases?per_page=8", { cache: "no-store", signal: controller.signal })
      .then(async r => { if (!r.ok) throw new Error("Não foi possível consultar as versões agora."); return r.json() as Promise<Release[]>; })
      .then(data => setReleases(Array.isArray(data) ? data : []))
      .catch(() => { if (!controller.signal.aborted) setError("Não foi possível carregar as versões agora. Você ainda pode instalar a versão web pelo navegador."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  const latest = releases[0];
  const apk = latest?.assets?.find(asset => asset.name.toLowerCase().endsWith(".apk"));
  const install = async () => {
    if (!installPrompt) return;
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setInstallPrompt(null);
    } catch {
      setError("Não foi possível iniciar a instalação agora. Use o menu do navegador para instalar o CONNECT.");
      setInstallPrompt(null);
    }
  };

  return <div className="app-download">
    <section className="app-download-hero">
      <div className="app-download-hero-copy">
        <span className="app-download-eyebrow"><i/> CONNECT PARA CELULAR</span>
        <h2>Seu mundo. Suas conexões. <em>Sempre com você.</em></h2>
        <p>Uma experiência feita para o celular, com as mesmas conversas, pessoas, salas, transmissões e notificações da sua conta CONNECT.</p>
        <div className="app-download-hero-actions">
          {installed ? <span className="app-installed-label" role="status"><CheckCircle2 size={17}/> CONNECT instalado neste aparelho</span> : installPrompt ? <button className="primary" onClick={install}><Smartphone size={17}/> Instalar aplicativo</button> : <span className="app-install-hint"><Smartphone size={16}/> No Chrome, use o menu ⋮ e escolha “Instalar aplicativo”.</span>}
          <a className="app-download-secondary" href="#android-download">Ver versão Android <ArrowDownToLine size={15}/></a>
        </div>
        <div className="app-download-benefits"><span><CheckCircle2/> Mesma conta</span><span><CheckCircle2/> Atualizações automáticas</span><span><CheckCircle2/> Sem Play Store</span></div>
      </div>
      <div className="app-download-art" aria-hidden="true">
        <div className="app-download-orbit app-download-orbit-one"/><div className="app-download-orbit app-download-orbit-two"/>
        <div className="app-download-device"><div className="app-download-device-camera"/><img src="/Connect/icons/connect.svg" alt="Ícone CONNECT"/><strong>CONNECT</strong><small>Conexões reais começam aqui.</small><div className="app-download-device-dots"><i/><i/><i/></div></div>
        <span className="app-download-float app-download-float-one"><Globe2/> Salas ao vivo</span><span className="app-download-float app-download-float-two"><Sparkles/> Novas conexões</span>
      </div>
    </section>

    <div className="app-download-platform-grid">
      <section className="app-download-platform-card app-download-web-card">
        <div className="app-download-platform-icon"><Smartphone/></div><span className="app-download-eyebrow">INSTALAÇÃO RÁPIDA</span>
        <h3>Instale pelo navegador</h3><p>Adicione o CONNECT à tela inicial e abra em uma janela própria, sem precisar procurar o site toda vez.</p>
        <ol><li>Abra esta página no Chrome.</li><li>Toque no menu ⋮ do navegador.</li><li>Escolha “Instalar aplicativo” ou “Adicionar à tela inicial”.</li></ol>
        {installed ? <span className="app-installed-label" role="status"><CheckCircle2 size={16}/> Já instalado neste dispositivo</span> : installPrompt ? <button className="primary" onClick={install}><Smartphone size={16}/> Instalar agora</button> : <span className="app-download-status" role="status"><i/> Disponível em navegadores compatíveis</span>}
      </section>
      <section className="app-download-platform-card app-download-android-card" id="android-download">
        <div className="app-download-platform-icon"><Download/></div><span className="app-download-eyebrow">ANDROID · APK OFICIAL</span>
        <h3>Baixe o aplicativo</h3>
        {loading ? <p role="status">Consultando a versão Android mais recente...</p> : apk ? <><p>Versão <strong>{latest.tag_name}</strong> · publicada em {new Date(latest.published_at).toLocaleDateString("pt-BR")}</p><a className="primary" href={apk.browser_download_url}><Download size={16}/> Baixar APK</a><small>Após baixar, abra o arquivo e confirme a instalação no Android.</small></> : <><p>A primeira versão Android assinada está sendo preparada. Assim que estiver publicada, o botão de download aparecerá aqui.</p><span className="app-download-status" role="status"><RefreshCw size={14}/> Aguardando a primeira versão APK</span></>}
      </section>
    </div>

    <section className="app-download-updates">
      <div className="section-heading"><div><h2>Atualizações do CONNECT</h2><span>Veja o que mudou e acompanhe as versões publicadas.</span></div><span className="app-live-update"><i/> ATUALIZAÇÕES DO SITE AUTOMÁTICAS</span></div>
      {siteVersion && <article className="app-release app-site-release"><header><strong><Sparkles size={15}/> Site atualizado · {siteVersion.version}</strong><time><Clock3 size={13}/> {new Date(siteVersion.updatedAt).toLocaleString("pt-BR",{day:"2-digit",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"})}</time></header><p>{siteVersion.changes}</p><small>Esta atualização já está disponível no site e também aparece no aplicativo instalado.</small></article>}
      {error && <div className="app-download-note" role="alert">{error}</div>}
      {!loading && !releases.length && !error && <div className="app-download-note" role="status"><ShieldCheck size={16}/> A primeira versão pública do APK ainda está sendo preparada.</div>}
      <div className="app-release-list">{releases.map(release => { const releaseApk = release.assets?.find(asset => asset.name.toLowerCase().endsWith(".apk")); return <article className="app-release" key={release.tag_name}><header><strong>{release.name || release.tag_name}</strong><time>{new Date(release.published_at).toLocaleDateString("pt-BR")}</time></header><p>{release.body || "Atualização do CONNECT."}</p>{releaseApk ? <a href={releaseApk.browser_download_url}><Download size={13}/> Baixar esta versão</a> : <small>Versão sem APK anexado.</small>}</article>; })}</div>
      <p className="app-download-footnote"><ShieldCheck size={15}/> O site continua funcionando normalmente pelo navegador. O aplicativo usa a mesma versão publicada do CONNECT; quando houver uma nova versão do APK, ela será disponibilizada nesta página.</p>
    </section>
  </div>;
}

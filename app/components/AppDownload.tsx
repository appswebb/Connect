"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, MoreVertical, Share, Smartphone, Monitor, Globe2, ShieldCheck } from "lucide-react";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }> };

/** Tutorial de instalação do CONNECT como app (PWA) pelo navegador. Não há APK: a instalação usa o menu do Chrome. */
export default function AppDownload() {
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPrompt); };
    const onInstalled = () => { setInstalled(true); setInstallPrompt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice.catch(() => null);
    setInstallPrompt(null);
  }

  return (
    <div className="app-download">
      <section className="install-guide-intro">
        <span className="app-download-eyebrow"><i /> CONNECT NO CELULAR</span>
        <h2>Instale o CONNECT em poucos toques.</h2>
        <p>Não precisa de loja nem de arquivo. O CONNECT abre em tela cheia, com ícone na tela inicial e atualiza sozinho.</p>
        {installed ? (
          <span className="app-installed-label" role="status"><CheckCircle2 size={16} /> Já instalado neste dispositivo</span>
        ) : installPrompt ? (
          <button type="button" className="primary" onClick={() => void install()}><Smartphone size={16} /> Instalar agora</button>
        ) : null}
      </section>

      <div className="install-guide-grid">
        <section className="install-guide-card">
          <h3><Smartphone size={18} /> Android (Chrome)</h3>
          <ol>
            <li>Abra <strong>appswebb.github.io/Connect</strong> no <strong>Google Chrome</strong>.</li>
            <li>Toque nos <strong>3 pontinhos</strong> <MoreVertical size={14} aria-label="menu" /> no canto superior direito.</li>
            <li>Toque em <strong>“Instalar app”</strong> ou <strong>“Adicionar à tela inicial”</strong>.</li>
            <li>Confirme em <strong>Instalar</strong>. O ícone do CONNECT aparece na sua tela inicial.</li>
          </ol>
        </section>

        <section className="install-guide-card">
          <h3><Share size={18} /> iPhone (Safari)</h3>
          <ol>
            <li>Abra o site no <strong>Safari</strong>.</li>
            <li>Toque em <strong>Compartilhar</strong> <Share size={14} aria-label="compartilhar" />, na barra de baixo.</li>
            <li>Escolha <strong>“Adicionar à Tela de Início”</strong>.</li>
            <li>Toque em <strong>Adicionar</strong>.</li>
          </ol>
        </section>

        <section className="install-guide-card">
          <h3><Monitor size={18} /> Computador (Chrome ou Edge)</h3>
          <ol>
            <li>Abra o site no navegador.</li>
            <li>Clique no ícone de <strong>instalar</strong> na barra de endereço, ou nos 3 pontinhos → <strong>“Instalar CONNECT”</strong>.</li>
            <li>Confirme em <strong>Instalar</strong>.</li>
          </ol>
        </section>
      </div>

      <p className="app-download-footnote"><Globe2 size={15} /> <ShieldCheck size={15} /> Não achou a opção? Atualize o Chrome e confira se está no site <strong>https://appswebb.github.io/Connect/</strong> (não dentro de outro app, como o navegador do Instagram ou do WhatsApp). O CONNECT continua funcionando normalmente pelo navegador.</p>
    </div>
  );
}

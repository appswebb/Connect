"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw, X } from "lucide-react";

export default function PWARegister() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  // Só recarrega quando a pessoa pediu a atualização: recarregar sozinho (ex.: no primeiro acesso, quando o
  // service worker assume o controle) perderia conversa, rascunho e estado da tela.
  const reloadRequested = useRef(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing || !reloadRequested.current) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    let activeVersion = "";
    const checkVersionJson = async () => {
      try {
        const res = await fetch("/Connect/app-version.json?t=" + Date.now(), { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { version?: string; commit?: string };
        const token = data.commit || data.version || "";
        if (!token) return;
        if (!activeVersion) activeVersion = token;
        else if (token !== activeVersion) setUpdateAvailable(true);
      } catch {
        // Ignore transient network errors when checking version.
      }
    };

    const watchRegistration = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setUpdateAvailable(true);
      }
      registration.addEventListener("updatefound", () => {
        const next = registration.installing;
        if (!next) return;
        next.addEventListener("statechange", () => {
          if (next.state === "installed" && navigator.serviceWorker.controller) {
            setWaitingWorker(next);
            setUpdateAvailable(true);
          }
        });
      });
    };

    const register = () => {
      void navigator.serviceWorker
        .register("/Connect/sw.js", { scope: "/Connect/", updateViaCache: "none" })
        .then((registration) => {
          watchRegistration(registration);
        })
        .catch((error) => {
          console.warn("CONNECT: não foi possível registrar o modo instalável.", error);
        });
      void checkVersionJson();
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    const interval = window.setInterval(() => {
      void checkVersionJson();
    }, 120_000);

    return () => {
      window.removeEventListener("load", register);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      window.clearInterval(interval);
    };
  }, []);

  if (!updateAvailable) return null;

  return (
    <div className="pwa-update-toast" role="status" aria-live="polite">
      <span>Nova versão do CONNECT disponível.</span>
      <button
        type="button"
        className="primary"
        onClick={() => {
          reloadRequested.current = true;
          if (waitingWorker) waitingWorker.postMessage({ type: "SKIP_WAITING" });
          else window.location.reload();
        }}
      >
        <RefreshCw size={14} /> Atualizar
      </button>
      <button type="button" className="pwa-update-dismiss" aria-label="Fechar aviso de atualização" onClick={() => setUpdateAvailable(false)}>
        <X size={14} />
      </button>
    </div>
  );
}

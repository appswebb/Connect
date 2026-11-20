"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

type SiteVersion = {
  version?: string;
  commit?: string;
};

function hasUnsavedWork() {
  const active = document.activeElement;
  if (
    active instanceof HTMLInputElement ||
    active instanceof HTMLTextAreaElement ||
    active instanceof HTMLSelectElement ||
    (active instanceof HTMLElement && active.isContentEditable)
  ) {
    return true;
  }

  const fields = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    "input, textarea, select"
  );
  for (const field of Array.from(fields)) {
    if (field instanceof HTMLInputElement && (field.type === "checkbox" || field.type === "radio")) {
      if (field.checked !== field.defaultChecked) return true;
    } else if (field instanceof HTMLSelectElement) {
      if (Array.from(field.options).some((option) => option.selected !== option.defaultSelected)) return true;
    } else if (field.value !== field.defaultValue) {
      return true;
    }
  }

  // Nunca recarrega no meio de uma live ou reprodução de mídia.
  return Array.from(document.querySelectorAll("video, audio")).some(
    (media) => media instanceof HTMLMediaElement && !media.paused && !media.ended
  );
}

export default function NativeUpdateChecker() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let currentVersion: string | null = null;
    let updatePending = false;
    let checking = false;

    const readVersion = async () => {
      if (checking || !navigator.onLine) return;
      checking = true;
      try {
        const response = await fetch(`/app-version.json?check=${Date.now()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        if (!response.ok) return;
        const data = (await response.json()) as SiteVersion;
        const nextVersion = data.commit || data.version;
        if (!nextVersion) return;

        if (currentVersion === null) {
          currentVersion = nextVersion;
          return;
        }
        if (nextVersion !== currentVersion) updatePending = true;
      } catch {
        // Falhas temporárias de rede não interrompem o uso do aplicativo.
      } finally {
        checking = false;
      }
    };

    const applyWhenSafe = () => {
      if (
        updatePending &&
        document.visibilityState === "visible" &&
        !hasUnsavedWork()
      ) {
        window.location.reload();
      }
    };

    void readVersion();
    const poll = window.setInterval(() => {
      void readVersion().then(applyWhenSafe);
    }, 30_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void readVersion().then(applyWhenSafe);
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}

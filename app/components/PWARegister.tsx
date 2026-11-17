"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const register = () => {
      void navigator.serviceWorker.register("/Connect/sw.js", {
        scope: "/Connect/",
        updateViaCache: "none",
      }).catch((error) => {
        console.warn("CONNECT: não foi possível registrar o modo instalável.", error);
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);
  return null;
}

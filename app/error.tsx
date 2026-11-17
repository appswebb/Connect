"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("CONNECT page error:", error);
  }, [error]);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#0f0c1a", color: "#f8fafc", fontFamily: "system-ui, sans-serif" }}>
      <section style={{ width: "100%", maxWidth: 440, textAlign: "center" }}>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em" }}>CONNECT<span style={{ color: "#ff4d5e" }}>.</span></div>
        <h1 style={{ fontSize: 22, margin: "28px 0 10px" }}>Não foi possível abrir esta página</h1>
        <p style={{ color: "#aab5c7", lineHeight: 1.6 }}>Ocorreu um erro ao carregar esta área. Você pode tentar novamente sem perder sua conta.</p>
        <button onClick={() => reset()} style={{ marginTop: 20, minHeight: 48, padding: "0 22px", border: 0, borderRadius: 12, background: "linear-gradient(135deg,#ff3d6e,#ffb547)", color: "#14101f", fontWeight: 700, cursor: "pointer" }}>Tentar novamente</button>
        <button onClick={() => window.location.reload()} style={{ display: "block", margin: "14px auto 0", padding: 8, border: 0, background: "transparent", color: "#cbd5e1", cursor: "pointer" }}>Recarregar o CONNECT</button>
      </section>
    </main>
  );
}

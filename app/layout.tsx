import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./styles/connect-redesign.css";
import NativeUpdateChecker from "./components/NativeUpdateChecker";

export const metadata: Metadata = {
  title: "CONNECT — Pessoas, conversas e comunidades",
  description: "Conheça pessoas, converse em tempo real e participe de comunidades.",
  manifest: "/Connect/manifest.webmanifest",
  applicationName: "CONNECT",
  appleWebApp: { capable: true, title: "CONNECT", statusBarStyle: "black-translucent" },
  icons: { icon: "/Connect/icons/connect.svg", apple: "/Connect/icons/connect-192.png" },
  openGraph: { title: "CONNECT — Pessoas, conversas e comunidades", description: "Conheça pessoas, converse em tempo real e participe de comunidades.", type: "website", locale: "pt_BR" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#c6f36b", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <NativeUpdateChecker />
        {children}
      </body>
    </html>
  );
}

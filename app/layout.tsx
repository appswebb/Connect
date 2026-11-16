import type { Metadata, Viewport } from "next";
import "./styles/tokens.css";
import "./globals.css";
import "./styles/public.css";
import "./styles/tour.css";
import "./styles/auth.css";
import NativeUpdateChecker from "./components/NativeUpdateChecker";

const fontsHref =
  "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#5b5cf0",
};

export const metadata: Metadata = {
  title: "CONNECT — Pessoas, conversas e comunidades",
  description: "Conheça pessoas, converse em tempo real e participe de comunidades.",
  manifest: "/Connect/manifest.webmanifest",
  applicationName: "CONNECT",
  appleWebApp: { capable: true, title: "CONNECT", statusBarStyle: "black-translucent" },
  icons: { icon: "/Connect/icons/connect.svg", apple: "/Connect/icons/connect.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={fontsHref} />
      </head>
      <body>
        <NativeUpdateChecker />
        {children}
      </body>
    </html>
  );
}

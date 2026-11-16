import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "CONNECT — Encontre sua conexão", description: "Conheça pessoas, compartilhe momentos e converse.", manifest: "/Connect/manifest.webmanifest", applicationName: "CONNECT", appleWebApp: { capable: true, title: "CONNECT", statusBarStyle: "black-translucent" }, icons: { icon: "/Connect/icons/connect.svg", apple: "/Connect/icons/connect.svg" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="pt-BR"><body>{children}</body></html>; }

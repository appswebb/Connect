import AppDownload from "../components/AppDownload";

export const metadata = {
  title: "Baixar CONNECT",
  description: "Veja como instalar o CONNECT no seu celular pelo navegador."
};

export default function DownloadPage() {
  return <main className="download-page">
    <header className="download-page-header">
      <a className="brand" href="/Connect/"><span className="brand-icon"><img src="/Connect/connect-mark.svg" alt="" /></span>CONNECT</a>
      <a className="secondary" href="/Connect/">Voltar ao site</a>
    </header>
    <section className="download-page-content">
      <div className="heading"><div><small>CONNECT NO SEU CELULAR</small><h1>Instale o <em>CONNECT.</em></h1><p>Instale pelo navegador, sem loja e sem arquivo.</p></div></div>
      <AppDownload/>
    </section>
  </main>;
}

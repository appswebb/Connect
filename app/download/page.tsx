import AppDownload from "../components/AppDownload";

export const metadata = {
  title: "Baixar CONNECT",
  description: "Instale o aplicativo CONNECT ou baixe a versão Android mais recente."
};

export default function DownloadPage() {
  return <main className="download-page">
    <header className="download-page-header">
      <a className="brand" href="/"><span className="brand-icon"><img src="/connect-mark.svg" alt="" /></span>CONNECT</a>
      <a className="secondary" href="/">Voltar ao site</a>
    </header>
    <section className="download-page-content">
      <div className="heading"><div><small>CONNECT NO SEU CELULAR</small><h1>Baixe o <em>CONNECT.</em></h1><p>Use pelo navegador ou instale no seu Android.</p></div></div>
      <AppDownload/>
    </section>
  </main>;
}

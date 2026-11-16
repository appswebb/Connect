import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.connect.social",
  appName: "CONNECT",
  webDir: "out",
  server: {
    // CONNECT é um invólucro Android fixo: identidade/ícone ficam no APK e o conteúdo vem do site publicado.
    url: "https://appswebb.github.io/Connect/",
    cleartext: false
  },
  android: {
    allowMixedContent: false
  }
};

export default config;

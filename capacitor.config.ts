import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.connect.social",
  appName: "CONNECT",
  webDir: "out",
  server: {
    // O app carrega a mesma versão publicada do site; novas funções chegam sem reinstalar o APK.
    url: "https://appswebb.github.io/Connect/",
    cleartext: false
  },
  android: {
    allowMixedContent: false
  }
};

export default config;

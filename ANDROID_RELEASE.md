# Publicação do aplicativo Android CONNECT

O site continua publicado normalmente no GitHub Pages. O APK Android é um aplicativo Capacitor que abre o CONNECT oficial e usa a mesma conta e os mesmos recursos do site.

## Assinatura única do APK

Para que o Android aceite instalar uma nova versão por cima da anterior, todas as versões precisam usar a mesma chave privada de assinatura. Não coloque essa chave no repositório.

Configure estes quatro **Repository secrets** em Settings → Secrets and variables → Actions:

- `CONNECT_ANDROID_KEYSTORE_BASE64`: arquivo keystore JKS convertido para Base64.
- `CONNECT_ANDROID_KEY_ALIAS`: alias da chave.
- `CONNECT_ANDROID_KEYSTORE_PASSWORD`: senha do keystore.
- `CONNECT_ANDROID_KEY_PASSWORD`: senha da chave.

Depois que os quatro segredos estiverem configurados, cada publicação bem-sucedida do site dispara a compilação e publicação do APK em uma nova versão do GitHub Releases. A área “Aplicativo” do site consulta essas versões e mostra o APK mais recente e o histórico.

**Importante:** mantenha uma cópia segura do keystore e das senhas. Se perder a chave, o Android não permitirá atualizar instalações existentes com uma chave diferente.

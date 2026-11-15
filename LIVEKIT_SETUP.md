# LiveKit no CONNECT

O CONNECT usa LiveKit Cloud para áudio, vídeo e compartilhamento de tela. O frontend é publicado no GitHub Pages; a emissão de tokens acontece na Edge Function protegida do Supabase.

## Configuração necessária para ativar transmissões reais

1. Criar um projeto no [LiveKit Cloud](https://cloud.livekit.io/).
2. Copiar a URL do servidor (começa com `wss://`), a API Key e a API Secret.
3. No painel do Supabase, abrir **Project Settings → Edge Functions → Secrets** e cadastrar:
   - `LIVEKIT_URL`
   - `LIVEKIT_API_KEY`
   - `LIVEKIT_API_SECRET`
4. Não colocar a API Secret em variáveis `NEXT_PUBLIC_*`, no frontend, no GitHub ou em mensagens.
5. A função `livekit-token` valida a sessão do Supabase e só emite token para uma transmissão existente e ativa. O host pode publicar; espectadores recebem permissão apenas para assistir.

## Recursos preparados

- Salas de transmissão ao vivo.
- Publicação de câmera e microfone pelo host.
- Compartilhamento de tela pelo host quando o navegador e o dispositivo oferecem essa API.
- Espectadores recebem áudio/vídeo em tempo real.
- Tokens com validade limitada e identidade opaca do usuário.
- Encerramento de transmissão no banco de dados.

## Limitações de plataforma

Compartilhamento de tela depende do suporte do navegador. Chrome/Edge desktop e navegadores Android compatíveis costumam oferecer `getDisplayMedia`; alguns navegadores móveis, especialmente iOS/Safari, podem não permitir compartilhar a tela. Câmera e microfone exigem HTTPS e permissão explícita.

## Estado atual

O banco, a interface e a função de token estão implantados. A transmissão só poderá conectar depois de cadastrar as três credenciais LiveKit acima. Nenhuma credencial foi criada ou presumida nesta configuração.

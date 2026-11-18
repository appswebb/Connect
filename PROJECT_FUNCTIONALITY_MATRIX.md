# CONNECT — inventário funcional e rastreabilidade

Este documento diferencia implementação encontrada de validação executada. Build aprovado não significa que serviços externos foram testados.

| Capacidade | Implementação | Destino | Validação |
|---|---|---|---|
| Landing, cadastro, login e demonstração | ConnectLanding.tsx, ConnectAuthGate.tsx, app/page.tsx | Entrada pública e autenticação | Build; smoke E2E em andamento |
| Feed, mídia, comentários e interações | ConnectFeed.tsx, useConnectFeed.ts | Feed | Build; CRUD real requer sessão/RLS |
| Pessoas, busca e filtros | ConnectPeopleDirectory.tsx | Pessoas | Build; dados reais requerem Supabase |
| Perfil, avatar, banner e publicações | ConnectProfile.tsx, ImageCropper.tsx | Meu perfil | Build; upload real requer Storage/RLS |
| Chat, pedidos, anexos, gravação e histórico | ConnectChat.tsx, app/page.tsx | Conversas | Build; realtime requer sessão |
| Salas do Brasil e estados, respostas e exclusão própria | ConnectRooms.tsx, useConnectRooms.ts | Salas | Build; operações reais requerem Supabase |
| Conexão aleatória, fila e limites | app/page.tsx | Conectar | Build; matching requer banco/realtime |
| Lives, câmera, microfone e compartilhamento | ConnectLives.tsx, LiveRoom.tsx, useConnectLives.ts, livekit-token | Ao vivo | Build; LiveKit real requer credenciais |
| Notificações em tempo real | useConnectNotifications.ts | Central de notificações | Build; realtime requer sessão |
| Planos, cartão, Pix e presentes | SubscriptionPlans.tsx, ConnectCardCheckout.tsx, ConnectPixCheckout.tsx, SubscriptionGift.tsx | Assinatura | Build; Mercado Pago requer sandbox/credenciais |
| Bloqueio, denúncias e exclusão de conta | app/page.tsx, ConnectSettings.tsx, Edge Functions e migrations | Configurações e ações contextuais | Build; operações reais requerem sessão/RLS |
| Localização e estados | BrazilLocationPicker.tsx, app/lib/brazil.ts | Perfil e filtros regionais | Build |
| PWA, atualizações e Android | AppDownload.tsx, PWARegister.tsx, NativeUpdateChecker.tsx, Capacitor | Download/instalação | Build web; APK depende do workflow Android |
| Endpoint legado de moedas | mercadopago-coin-checkout/index.ts | Sem fluxo ativo | HTTP 410 explícito; migrations antigas permanecem |

## Contratos preservados

- Nenhuma tabela, migration, política RLS, Edge Function, webhook ou contrato de API foi alterado nesta etapa.
- A chave pública Supabase permanece no cliente; segredos Mercado Pago e LiveKit continuam no ambiente das Edge Functions.
- Os componentes extraídos recebem propriedades tipadas; operações de negócio permanecem no orquestrador/hooks.
- Navegação desktop e mobile preservam os destinos dos módulos.

## Verificações

- Build Next.js, verificação TypeScript e exportação estática: aprovados no commit 834ecc5e33ba833601d78bb92eec6aafe5027d58.
- Smoke E2E Chromium e viewports 320, 360, 375, 390, 430, 768, 1024, 1280, 1440 e 1920 px: workflow em execução/correção.
- Feed CRUD, chat autenticado, uploads, matching, salas, pagamentos e LiveKit: não declarados como E2E concluídos; exigem sessão/ambiente e credenciais.
- Auditoria npm: workflow coleta a severidade das vulnerabilidades para avaliação antes de qualquer atualização.

## Limites

- O deploy configurado é GitHub Pages por .github/workflows/pages.yml, não Vercel.
- Build não prova que credenciais externas estão válidas nem que webhooks de produção foram recebidos.
- Recursos não encontrados no código não são presumidos.

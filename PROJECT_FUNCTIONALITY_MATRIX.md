# CONNECT — inventário funcional e rastreabilidade

Este documento separa implementação encontrada de validação realmente executada. Build aprovado não significa que serviços externos foram testados.

| Capacidade | Implementação | Destino | Validação |
|---|---|---|---|
| Landing, cadastro, login e demonstração | `ConnectLanding.tsx`, `ConnectAuthGate.tsx` | Entrada pública e autenticação | Build, smoke E2E e axe aprovados |
| Feed, mídia, comentários e interações | `ConnectFeed.tsx`, `useConnectFeed.ts` | Feed | Build; CRUD real requer sessão/RLS |
| Pessoas, busca e filtros | `ConnectPeopleDirectory.tsx` | Pessoas | Build; dados reais requerem Supabase |
| Perfil, avatar, banner e publicações | `ConnectProfile.tsx`, `ImageCropper.tsx` | Meu perfil | Build; upload real requer Storage/RLS |
| Overlays sociais, denúncias e recorte | `ConnectOverlays.tsx` | Perfil, seguidores, denúncia e crop | Build |
| Chat, pedidos, anexos, gravação e histórico | `ConnectChat.tsx` | Conversas | Build; realtime requer sessão |
| Conexão aleatória, fila, aceite e chat temporário | `ConnectQueue.tsx` | Conectar | Build; matching real requer banco/realtime |
| Salas do Brasil e estados, respostas e exclusão própria | `ConnectRooms.tsx`, `useConnectRooms.ts` | Salas | Build; operações reais requerem Supabase |
| Lives, câmera, microfone e compartilhamento | `ConnectLives.tsx`, `LiveRoom.tsx`, `useConnectLives.ts`, `livekit-token` | Ao vivo | Build; LiveKit real requer credenciais |
| Notificações em tempo real | `useConnectNotifications.ts` | Central de notificações | Build; realtime requer sessão |
| Planos, cartão, Pix e presentes | `SubscriptionPlans.tsx`, `ConnectCardCheckout.tsx`, `ConnectPixCheckout.tsx`, `SubscriptionGift.tsx` | Assinatura | Build; Mercado Pago requer sandbox/credenciais |
| Bloqueio, denúncias e exclusão de conta | `ConnectSettings.tsx`, Edge Functions e migrations | Configurações e ações contextuais | Build; operações reais requerem sessão/RLS |
| Localização e estados | `BrazilLocationPicker.tsx`, `app/lib/brazil.ts` | Perfil e filtros regionais | Build |
| PWA, atualizações e Android | `app/download/page.tsx`, `AppDownload.tsx`, `PWARegister.tsx`, `NativeUpdateChecker.tsx`, Capacitor | Download/instalação | Página de download testada; instalação real/APK pendentes |
| Endpoint legado de moedas | `mercadopago-coin-checkout/index.ts` | Sem fluxo ativo | HTTP 410 explícito; migrations antigas permanecem |

## Contratos preservados

- Nenhuma tabela ou coluna foi removida; Edge Functions, webhooks e contratos externos foram preservados.
- A função PostgreSQL `finish_live_battle` foi restringida ao usuário autenticado que é host da live.
- Três migrations foram aplicadas e versionadas: autorização do host, otimização de 10 policies com `(select auth.uid())` e consolidação de 3 grupos de policies permissivas preservando a lógica OR.
- A chave pública Supabase permanece no cliente; segredos Mercado Pago e LiveKit continuam no ambiente das Edge Functions.
- Componentes extraídos usam propriedades tipadas. Feed, salas, lives e notificações também têm hooks dedicados.
- O arquivo principal passou de 3.720 para 2.263 linhas após a modularização; a interface principal é mantida como composição dos módulos.

## Verificações executadas

- GitHub Actions run [44226848936](https://github.com/appswebb/Connect/actions/runs/44226848936): build de produção, auditoria npm, smoke Chromium e exportação estática aprovados.
- First Load JS: **212 KB**, contra 372 KB na medição anterior à divisão de LiveKit/assinaturas.
- npm audit: **0 info, 0 low, 0 moderate, 0 high e 0 critical** após atualizar Capacitor 7.6.10 e PostCSS 8.5.25.
- Smoke E2E aprovado para landing, login, cadastro, entrada de demonstração e página de download.
- axe-core/WCAG 2.2 AA aprovado nas telas públicas, autenticação, demonstração e download.
- Sem overflow horizontal em 320, 360, 375, 390, 414, 430, 768, 1024, 1280, 1440 e 1920 px.
- Feed CRUD, chat autenticado, uploads, matching, salas, pagamentos e LiveKit não são declarados como E2E concluídos; exigem sessão/ambiente e credenciais.

## Limites registrados

- O deploy configurado é GitHub Pages por `.github/workflows/pages.yml`, não Vercel.
- Não foi encontrada rota/página de administração separada no repositório; moderação encontrada ocorre por denúncia, bloqueio e exclusão de conta.
- O histórico Supabase está divergente: 42 migrations remotas e 19 arquivos locais, com versões locais duplicadas. Não executar `supabase db push/reset` até reconciliar; ver `PROJECT_MIGRATION_AUDIT.md`.
- A proteção contra senhas vazadas permanece desabilitada no Supabase Auth e precisa ser habilitada no painel.
- Build e smoke público não provam que credenciais externas estão válidas nem que webhooks de produção foram recebidos.

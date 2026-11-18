# CONNECT — QA checklist

## Static checks
- [x] Instalação reproduzível com `npm ci` a partir do `package-lock.json`.
- [x] `npm run build` e `npx tsc --noEmit`.
- [x] Exportação estática: `out/index.html`, `out/download/index.html` e JavaScript gerado.
- [x] npm audit: zero vulnerabilidades em todas as severidades.
- [x] GitHub Actions: build, TypeScript, auditoria de dependências, smoke Chromium e exportação aprovados.
- [x] Smoke Chromium para landing, login, cadastro, demonstração e página de download.
- [x] axe-core/WCAG 2.2 AA: contraste e alvos de toque aprovados nas telas públicas, autenticação, demonstração e download.
- [x] Sem overflow horizontal em 320, 360, 375, 390, 414, 430, 768, 1024, 1280, 1440 e 1920 px.
- [ ] E2E autenticado com duas contas de teste isoladas.
- [ ] Validar Mercado Pago e LiveKit com credenciais sandbox.

## Refactored module map
- [x] `useConnectFeed`: feed, likes, comentários e upload.
- [x] `useConnectRooms`: salas regionais, respostas e exclusão de mensagens.
- [x] `useConnectLives`: LiveKit e ciclo de vida de lives.
- [x] `useConnectNotifications`: leitura, navegação e permissões do navegador.
- [x] UI: landing, autenticação, salas, lives, avatar, feed, pessoas, perfil, chat, configurações, navegação, fila de conexão, overlays e download.

## Functional regression matrix
O build confirma os módulos e contratos compilados. Os fluxos abaixo ainda precisam de sessão autenticada e/ou sandbox externo.
- [x] Landing pública, login, cadastro e entrada de demonstração (smoke + axe).
- [ ] Recuperação de senha ponta a ponta.
- [ ] Shell autenticado, navegação desktop/mobile e tema.
- [ ] Feed, mídia, likes e comentários com dados reais.
- [ ] Busca de pessoas, perfil, seguir, bloquear e denunciar com duas contas.
- [ ] Fila de conexão, aceite de match e chat temporário.
- [ ] Pedidos de mensagem, anexos, gravação de voz e arquivamento.
- [ ] Salas estaduais, respostas e exclusão de mensagem.
- [ ] Lives: criar/entrar/encerrar, câmera, microfone e compartilhamento.
- [ ] Planos, presentes, Pix, cartão e webhook.
- [ ] Notificações e navegação profunda.
- [ ] Edição de perfil, localização, privacidade e exclusão de conta.
- [x] Rota pública de download e release hub; instalação PWA real e APK ainda pendentes.

## Browser smoke test
- Script: `scripts/smoke-e2e.mjs`.
- CI cria exportação estática local e testa as rotas públicas com Chromium.
- Cobertura: landing, login, cadastro, demonstração, download, WCAG 2.2 AA e overflow nos 11 viewports listados.
- Não declara CRUD autenticado, pagamento, webhook ou LiveKit como integração real validada.

## Regression guardrails
- [x] Nenhuma tabela/coluna removida ou renomeada.
- [x] Nenhum segredo adicionado ao frontend ou a arquivos versionados.
- [x] Nenhum dado falso substituiu dados Supabase.
- [x] Ações preservadas com handlers reais; componentes de apresentação recebem callbacks tipados.
- [ ] Reexecutar CRUD/RLS com duas contas isoladas.
- [ ] Revisar foco, teclado, reduced motion e tema escuro nas telas autenticadas.

## Security boundary
- Três migrations RLS/função foram aplicadas e versionadas para corrigir autorização de host e otimizar policies.
- Nenhuma forma de tabela/schema ou contrato externo foi alterada.
- Ver `PROJECT_SECURITY_AUDIT.md` e `PROJECT_MIGRATION_AUDIT.md` para achados confirmados e reconciliação pendente.

## Environment limitations
Build e smoke público passaram. CRUD autenticado, Mercado Pago, LiveKit e instalação Android exigem conta de teste e credenciais sandbox; não declarar esses fluxos como validados sem executá-los.

# CONNECT

Aplicativo social para conhecer pessoas, conversar em privado, participar de salas regionais e transmissões ao vivo.

## Stack

- Next.js 15 (App Router), React 19 e TypeScript
- Supabase Auth, Postgres, Storage, Realtime e Edge Functions
- Mercado Pago para assinaturas, cartão, Pix e presentes
- LiveKit para transmissões ao vivo
- PWA e Capacitor para instalação e Android
- Exportação estática e publicação pelo GitHub Pages

## Estrutura

- `app/components/`: landing, autenticação, navegação, feed, pessoas, chat, salas, lives, perfil, configurações, assinatura e checkout.
- `app/hooks/`: operações de feed, salas, lives e notificações.
- `app/lib/`: cliente Supabase, dados compartilhados, navegação e utilitários.
- `app/types/`: tipos de domínio.
- `supabase/functions/`: autenticação de demonstração, tokens LiveKit e integrações Mercado Pago.
- `supabase/migrations/`: alterações versionadas de banco e políticas.
- `PROJECT_*.md`: regras locais de design, UX, frontend e QA.

## Desenvolvimento

Requisitos: Node.js 22 e npm.

```bash
npm ci
npm run dev
```

Build de produção e exportação estática:

```bash
npm run build
```

A exportação fica em `out/`. O projeto usa `basePath: "/Connect"` e `trailingSlash: true` para publicação em GitHub Pages.

## Integrações

- O cliente Supabase está configurado em `app/lib/supabase.ts` com URL e chave publicável.
- Secrets das Edge Functions devem ser configurados no painel Supabase, nunca no frontend. Consulte `supabase/functions/.env.example`.
- Mercado Pago: consulte `MERCADOPAGO_SETUP.md`.
- LiveKit: consulte `LIVEKIT_SETUP.md`.
- Android: consulte `ANDROID_RELEASE.md`.

Não copie tokens privados para arquivos versionados, código cliente, issues ou logs.

## CI e publicação

- Pull requests para `main` executam build, verificação de exportação estática e smoke tests de navegador/responsividade.
- Push em `main` aciona `.github/workflows/pages.yml`, que constrói e publica em GitHub Pages.
- O workflow Android gera artefato APK conforme sua configuração.

## Auditoria funcional

Consulte [PROJECT_FUNCTIONALITY_MATRIX.md](./PROJECT_FUNCTIONALITY_MATRIX.md) para inventário funcional, [PROJECT_SECURITY_AUDIT.md](./PROJECT_SECURITY_AUDIT.md) para achados de segurança e [PROJECT_MIGRATION_AUDIT.md](./PROJECT_MIGRATION_AUDIT.md) para o estado do histórico de migrations.


## Verificação pública da evolução 3.0

A execução Chromium [44226848936](https://github.com/appswebb/Connect/actions/runs/44226848936) validou landing, login, cadastro, demonstração e download, com axe-core/WCAG 2.2 AA e sem overflow em 11 larguras (320–1920 px). O npm audit reportou zero vulnerabilidades. CRUD autenticado, Mercado Pago e LiveKit permanecem explicitamente pendentes de contas e credenciais de teste.

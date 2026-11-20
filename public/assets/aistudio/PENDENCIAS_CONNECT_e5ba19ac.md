# CONNECT — Pendências para outra IA/desenvolvedor

## Contexto (leia primeiro)
- Repo: `appswebb/Connect` · branch `revisao-connect-fase-1` · PR #10 (rascunho). `main` publica em produção (GitHub Pages) — **não faça merge sem testar**.
- Stack: Next.js 15 (export estático), Supabase projeto `trrakyybnvxpdhxwgjrz` (us-east-1). Sem servidor próprio.
- Arquivos centrais: `app/page.tsx` (estado e lógica, ~2300 linhas), `app/components/*`, `app/hooks/useConnectNotifications.ts`, `app/lib/*`, `app/styles/connect-mobile-app.css`, `public/sw.js`, `supabase/migrations/`, `supabase/functions/`.
- Leia antes: `AUDITORIA_CONNECT.md` (o que foi feito/testado/limitações).
- Regras do projeto: não reconstruir do zero; preservar identidade visual; nada de funcionalidade falsa; verificar antes de alterar e testar depois; nunca expor chaves/segredos no front ou repo; RLS é a segurança real (a chave publishable é pública).
- Técnicas que funcionaram: testar SQL em `DO $$ ... raise exception 'RESULT %' $$` (reverte tudo) com `set local role authenticated` + `set_config('request.jwt.claims', ...)`; criar usuário sintético em `auth.users` exige `raw_user_meta_data` com `display_name` (>1 char), `username`, `gender` ∈ {woman, man, non_binary, self_described, prefer_not_to_say}. Build real só no CI do PR (`gh api repos/appswebb/connect/...`; GraphQL do gh não funciona).
- Já pronto (não refazer): sessão estável/isolamento de contas, contador 20+, balão só na aba Conectar, aba Pessoas paginada (`list_community_profiles`), janela de 5 min no banco, exclusão imediata (`delete_account_data` + Edge Function `delete-account` + tela em duas etapas), RPCs de seguidores, backend do admin, notificações do navegador com logo, `connect-demo-login` corrigido.

## 0. Antes de tudo (você/dono, não código)
1. Testar a exclusão de conta com conta descartável (senha, assinatura ativa se possível, arquivos no Storage).
2. Confirmar com contador/advogado o prazo de retenção financeira (hoje 5 anos, `account_deletion_retention.retain_until`).
3. Supabase → Authentication: ligar proteção contra senhas vazadas (pode exigir plano Pro).
4. Colocar o domínio atrás de Cloudflare (ou similar) para HSTS/CSP/limites/DDoS — GitHub Pages não permite cabeçalhos nem rate limit.
5. Cadastrar o admin: `insert into public.connect_admins(user_id) select id from auth.users where email='SEU_EMAIL';`

## 1. Painel admin — tela (Parte 9)
Backend pronto (migration `20261120070000`): `is_connect_admin()`, `admin_overview()`, `admin_list_reports(p_limit,p_before)`, `admin_set_report_status(p_report,p_status)`, `admin_publish_announcement(p_title,p_body)`; tabelas `connect_admins`, `connect_announcements` (leitura de avisos ativos por autenticados), `admin_audit_log`.
Falta:
- Rota/aba "Admin" visível só se `rpc('is_connect_admin')` for true (a segurança é do banco; o front só esconde).
- Cards do `admin_overview`; lista de denúncias paginada por `created_at` com mudar status; formulário de aviso.
- **Descobrir valores válidos de `user_reports.status`** (`select pg_get_constraintdef(...)`): `admin_overview` conta `open`/`pending` por suposição — ajustar.
- Lista de usuários (RPC nova, paginada, busca; mostrar e-mail só para admin via `auth.users` em função SECURITY DEFINER com checagem `is_connect_admin`).
- Moderação: suspender/banir (coluna nova em `profiles` ou tabela `user_suspensions` + RLS que bloqueie escrita/aparição), remover post/comentário; tudo gravando em `admin_audit_log`.
- Exibir avisos ativos no app (banner/central) e notificação em massa (inserir em `notifications` em lote, via função admin; verificar colunas da tabela antes).
- Testar: não-admin recebe `Forbidden`; admin não consegue se auto-promover (já testado no banco).

## 2. Perfil e seguidores (Parte 10)
Pronto no banco: `profile_follow_stats(p_profile)` e `list_profile_follows(p_profile,p_kind,p_limit,p_cursor_created_at,p_cursor_id)` (respeitam bloqueio e demo; `p_kind` = followers|following).
Falta na tela (`page.tsx` ~linhas 340–360 e 1220–1260; `ConnectOverlays.tsx`): usar `profile_follow_stats` no perfil visto (hoje há `rpc` de relação própria), abrir lista de seguidores/seguidos de **qualquer** perfil com scroll paginado, botões seguir/deixar de seguir, "segue você", estados vazios, e redesenho do perfil (banner, avatar, bio, estatísticas, abas posts/sobre) mantendo a identidade. Lembrar: a policy de `follows` só mostra relações do próprio usuário — por isso as listas devem usar as RPCs.
Achado relacionado: `post_likes` SELECT é `true` (ignora bloqueios).

## 3. Conexão ao vivo (Parte 2) — verificar
Janela de 5 min já está (`enter_queue(text,text)`; front lê `expires_at − created_at`). Verificar manualmente, com dois perfis de navegador: após os dois aceitarem o chat abre direto; botões minimizar e encerrar; contagem regressiva; mensagem ao expirar; nada perde conversa ao trocar de aba. Melhorar tela de espera (estados: buscando, encontrado, aceitando, aceito, expirado).

## 4. Salas e localização (Parte 5)
Não há tabela de salas (só `global_room_messages`); salas parecem definidas no front — localizar no código por que algumas aparecem sem nome (campo vazio/undefined) e garantir fallback e validação. Redesenhar a aba (cards, contagem, busca). Seletor de localização: Brasil → estado (`state_code`) → cidade, usado também em `enter_queue(p_state_code,p_city)` e no filtro "Da minha cidade". Validar estado/cidade no servidor.

## 5. Checkout (Parte 7)
Manter Mercado Pago. Edge Function `mercadopago-subscriptions` (ações `create`, `create_pix`, `pix_status`, `cancel`, `gift_create`) e `mercadopago-coin-checkout`, webhook `mercadopago-webhook` (assinatura HMAC; sem janela anti-replay — considerar). Falta: tela profissional com a marca (resumo do plano, preço, segurança, estados carregando/aprovado/pendente/recusado/expirado), confirmação **só** pelo servidor (webhook/status), checkout abandonado não pode conceder plano nem ficar como ativo (limpar `pending` antigos por cron). Testar com credenciais de teste do Mercado Pago.

## 6. Homepage e visitante (Partes 11–12)
- Homepage melhor: hero, como funciona, segurança, depoimentos **reais ou nenhum** (sem fake), CTA, rodapé legal.
- Modo visitante: ver landing/exemplos sem login; ações (curtir, comentar, seguir, conectar, enviar mensagem) abrem convite a entrar/cadastrar; nada que exija dado privado. Existe login demo (`connect-demo-login`, conta `is_demo`, escondida das listas).

## 7. Ícones (Parte 1)
Auditar todos os botões/ícones (lucide-react já é usado): botões sem ação, `aria-label` ausente, tamanhos inconsistentes, estados hover/disabled; padronizar um conjunto e tamanhos.

## 8. PWA (Parte 15)
Já instalável (manifest + `public/sw.js`, registro único em `PWARegister`; APK só manual em `.github/workflows/android-apk.yml`). Falta: aviso "nova versão disponível" (usar `public/app-version.json` + evento `waiting` do SW + botão atualizar), ícone *maskable* dedicado, testar instalação Android/iOS, offline mínimo.

## 9. Segurança (Parte 14) — restante
- Edge Functions: rate limit hoje é em memória por instância; mover para tabela no banco ou Cloudflare.
- `connect-chat` bucket aceita qualquer mime: restringir (imagens/áudio/vídeo/PDF) e tamanho.
- Revisar 17 funções SECURITY DEFINER executáveis por autenticados (todas usam `auth.uid()`); 4 tabelas com RLS sem policy (intencional, serviço apenas).
- Procedimento de limpeza de `orphaned_storage_objects` por cron (hoje só reprocessa ao excluir conta).
- Remover do banco o sistema "live" desativado (tabelas/funções) **se** o dono confirmar; retirar a função legada `request_account_deletion/cancel_account_deletion` e o cron de 7 dias **depois** que o pedido real pendente (agendado 26/11/2026) for resolvido — não tocar nele.
- Cabeçalhos/CSP via proxy (item 0).

## 10. Testes e capacidade (Partes 16–17)
Nunca medido. Fazer: popular banco de teste (não produção) com 100k+ perfis, rodar k6/Artillery nas RPCs (`list_community_profiles`, fila, mensagens), medir Realtime/Presence (limite de conexões simultâneas do plano Supabase), registrar p95 e limites reais; só então estimar capacidade. Revisar cada funcionalidade (cadastro, login, feed, posts, comentários, curtidas, mensagens, fila, salas, notificações, bloqueio, denúncia, assinatura, moedas) com checklist e Playwright (o smoke do CI cobre só landing/login/responsividade).
Teste de cadastro duplicado (e-mail/usuário com maiúsculas) de ponta a ponta — o banco já garante unicidade (`users_email_partial_key`, `profiles_username_unique_ci`).

## 11. Relatório final (formato pedido)
Ao terminar: o que foi corrigido/melhorado/implementado, problemas do banco, melhorias de segurança, testes executados (com resultado), limitações restantes e capacidade estimada **com base em medição**.

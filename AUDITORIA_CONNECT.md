# CONNECT — Auditoria e revisão (Fase 1)

Branch `revisao-connect-fase-1` · PR #10 (rascunho). Este documento separa **o que foi implementado**, **o que foi verificado** e **o que ainda não foi feito**, sem declarar como pronto o que não foi testado.

## Como esta fase foi verificada

| Verificação | Resultado |
|---|---|
| Verificação de tipos comparativa (main × branch) | Nenhum erro novo de sintaxe/tipo; sobra apenas ruído de ambiente (`process` sem `@types/node` fora do projeto) |
| `next build` | **Não executado localmente** (sem rede para instalar dependências). Depende do CI do PR #10 |
| Smoke E2E (Playwright) | Roda no CI do PR; cobre landing, login e responsividade, **não** cobre chat, fila nem Pessoas |
| Testes com duas contas, pagamentos, Realtime | **Não executados.** Exigem sessões reais e ambiente |

## Implementado nesta fase

### Parte 3 — Perda de conversa e isolamento entre contas
- **Causa:** os efeitos que carregam perfil, feed, fila, chat e canais Realtime dependiam do objeto `session`. O Supabase emite eventos de autenticação ao voltar para a aba e ao renovar o token, o que recriava o objeto e refazia tudo. Não havia limpeza de estado ao trocar de usuário.
- **Correção:** dependências passaram a usar `session?.user.id`; a referência da sessão é preservada quando só o token muda; ao entrar, sair ou **trocar de conta** todo o estado por usuário (chat, fila, encontro pendente, notificações, mensagens, salas, perfis) é zerado.
- **Limitação que não é bug do site:** duas contas no **mesmo navegador/perfil** compartilham o mesmo armazenamento de sessão do Supabase. Entrar na conta B em outra aba troca a sessão da aba A. Para testar duas contas, use dois perfis de navegador ou uma janela anônima.

### Parte 4 — Contador
- Mostra o valor exato de 1 a 20 e `20+` acima disso (`formatNotificationCount`).
- **Pendente:** layout das notificações nativas do navegador (logo, título, descrição).

### Parte 6 — Balão da conexão
- `ConnectQueue` era renderizado em todas as abas. O cartão "Conexão encontrada" e o chat temporário agora só existem na aba **Conectar**. Quando um match é encontrado, o app já levava o usuário para essa aba.

### Parte 2 (parcial) — Tempo do encontro
- O front deixou de assumir 3 minutos: a duração é calculada a partir de `expires_at − created_at` do banco, e textos e barra de progresso acompanham.
- **Para passar a 5 minutos é preciso alterar o banco** (função SQL que cria o match e grava `expires_at`). Ela não está no repositório (veja "Banco de dados").

### Parte 20 — Aba Pessoas
- Antes: até 1000 perfis em memória, filtros no navegador e recarga completa a cada alteração em **qualquer** perfil (Realtime em `profiles`), custo que multiplica pelo número de usuários online.
- Agora: páginas de 24 (configurável de 12 a 60 por `NEXT_PUBLIC_PEOPLE_PAGE_SIZE`), cursor `(created_at, id)`, busca/filtros/cidade no banco, busca com termo sanitizado, deduplicação, descarte de respostas antigas, scroll infinito com botão de fallback, totais por contagem sem baixar perfis. O Realtime em `profiles` foi removido; "online" continua vindo de Presence.
- Bloqueados e contas demo já são excluídos **pela política RLS** de `profiles`, não pelo front.
- Migration de índices: `20261119160000_connect_people_pagination_indexes.sql` (**não aplicada**).
- Mudança de comportamento: a lista não ordena mais "online primeiro"; ordena por mais recentes (o selo online continua visível).
- **Teste com grande volume de usuários não foi feito** (exige um banco com dados).

### Parte 15 (parcial) — PWA
- O site **já era** instalável (manifest + Service Worker). O Service Worker estava sendo registrado **duas vezes**; ficou só em `PWARegister`.
- O workflow `android-apk.yml` publicava uma Release nova a cada deploy. Agora só roda manualmente.
- **Pendente:** aviso de "nova versão disponível" no PWA instalado, ícone *maskable* dedicado e verificação do fluxo de instalação em dispositivos.

## Achados que ainda não foram corrigidos

### Banco de dados e migrations
- O histórico local **não reproduz** o banco (19 arquivos locais × 42 migrations remotas; versões duplicadas). As tabelas base e as funções de fila/match/exclusão **não estão no repositório**, então não é possível auditar relacionamentos, unicidade, `ON DELETE` e as RPCs apenas pelo código. `PROJECT_MIGRATION_AUDIT.md` descreve a reconciliação necessária.
- Advisor do Supabase (do documento de segurança existente): proteção contra senhas vazadas desativada, 17 funções `SECURITY DEFINER` executáveis por usuários autenticados, 29 chaves estrangeiras sem índice.

### Exclusão de conta (Parte 19)
- O fluxo atual usa as RPCs `request_account_deletion` / `cancel_account_deletion` e a tabela `account_deletion_requests` (prazo de 7 dias). Exclusão imediata exige: função/Edge Function com service role que remova dados em todas as tabelas e no Storage, revogue sessões e apague o usuário de `auth.users`. **Não foi implementada** porque, sem o esquema real, qualquer lista de tabelas seria um palpite e poderia deixar dados pessoais para trás.

### Segurança e infraestrutura (Parte 14)
- O site é estático no **GitHub Pages**: não há servidor próprio para cabeçalhos HTTP (CSP, HSTS), rate limiting ou mitigação de DDoS. A proteção realista é colocar o domínio atrás de um proxy (por exemplo Cloudflare) e aplicar limites no Supabase (Auth e Edge Functions). Nada disso existe hoje no código.
- A chave `sb_publishable_…` no front-end é pública por desenho; a segurança dos dados depende totalmente de RLS, que só pode ser validada no banco.
- Edge Functions (`connect-demo-login`, pagamentos) precisam de revisão de rate limit e de validação no servidor.

### Itens não iniciados
Partes 1 (ícones), 5 (salas), 7 (checkout), 9 (painel administrativo), 10 (perfil e seguidores), 11 (homepage), 12 (modo visitante), 13 (cadastro seguro), 16 (testes de carga e capacidade) e 17 (revisão funcional completa). Várias dependem de ver a interface renderizada ou de acesso ao banco.

## Capacidade estimada
**Não há medição.** Nenhum teste de carga foi executado, então qualquer número seria invenção. O que se sabe: antes desta fase, cada alteração em qualquer perfil forçava todos os clientes online a baixar até 1000 perfis; isso foi removido.

## Atualização — banco de produção (Supabase conectado)

Aplicadas e testadas no banco (arquivos em `supabase/migrations/`):

- `20261119192705` janela do encontro: 3 → 5 minutos (`enter_queue(text,text)`).
- `20261120004243` `profiles`: o usuário só atualiza as 11 colunas que o app edita (antes: qualquer uma, inclusive `is_demo` e `created_at`); anônimo sem acesso.
- `20261120004241` índices (cursor da aba Pessoas e chaves estrangeiras sem índice).
- `20261120004420` `list_community_profiles`: cursor por tupla `(created_at, id)`. Em tabela temporária de 200 mil perfis, a página do meio caiu de ~29,6 ms (cursor em `OR`, lia 100 mil linhas) para ~0,06 ms. Esses números são de plano de consulta em dados sintéticos, não medição em produção (3 perfis).

Substitui a migration `20261119160000`, removida (índice duplicado e `pg_trgm` no schema errado).

### Exclusão imediata de conta (Parte 19)
- Migration `20261120010000` **aplicada**: `delete_account_data` (service_role), retenção financeira isolada (hash do id, sem user_id, e-mail, Pix ou payload bruto), auditoria mínima, fila de arquivos órfãos, purga legada robusta por usuário.
- Testado em transação revertida com usuários sintéticos: usuário, perfil e ledger removidos; 2 registros retidos sem identificação; auditoria gravada; saque em andamento bloqueia (`PENDING_WITHDRAWAL`).
- Edge Function `delete-account` **publicada** (JWT obrigatório, CORS só `appswebb.github.io`, recusa contas demo, exige senha, cancela assinatura no Mercado Pago e aborta se falhar, apaga banco e depois Storage em lotes). **Não foi testada ponta a ponta com uma conta real** (exige senha e navegador).
- Tela em duas etapas (aviso + digitar EXCLUIR e senha) no código; depende do deploy do PR.
- Limitações: prazo de 5 anos de retenção é suposição (confirmar com contador/advogado); limite de tentativas é por instância da função; contas criadas só por login social (sem senha) não conseguem confirmar; se o banco apagar mas o Storage falhar, os arquivos ficam na fila de órfãos e são reprocessados na próxima exclusão (ainda não há cron para isso).
- O pedido real de exclusão em 7 dias (26/11) continua intacto; a função antiga segue ativa só para ele.

### Achados no banco
- `connect-demo-login` lista só os primeiros 1000 usuários para achar a conta demo e quebra acima disso.
- Chaves `NO ACTION`/`RESTRICT` (`live_*`, `subscription_gifts`, `wallet_ledger`, `withdrawal_requests`) bloqueiam a exclusão do usuário; a purga legada falharia para todos.
- Proteção contra senhas vazadas desativada (painel do Supabase).
- Existe 1 pedido de exclusão pendente de conta real (26/11); não foi alterado.

### Seguidores (Parte 10) e demo
- `connect-demo-login` publicado sem `listUsers` (localiza a conta pelo perfil `is_demo`). Hoje não há conta demo no banco; a função a cria no primeiro uso. Não testei o login demo em execução (exige as credenciais demo).
- Migration `20261120060000`: `profile_follow_stats` e `list_profile_follows` (cursor, sem demo, sem bloqueios nos dois sentidos, anônimo negado). Testadas em transação revertida: contagens 2/1 e 1/1, `i_follow`/`follows_me`, paginação, bloqueio remove da lista e das estatísticas, tipo inválido rejeitado.
- **Não ligado na interface ainda:** a tela continua mostrando só as listas do próprio usuário; ver seguidores de outro perfil exige a tela.

### Painel administrativo (Parte 9) — só o backend
- Migration `20261120070000` aplicada: `connect_admins` (sem acesso de cliente), `is_connect_admin`, `admin_overview`, `admin_list_reports`, `admin_set_report_status`, `admin_publish_announcement`, `connect_announcements`, `admin_audit_log`.
- Testado em transação revertida: não-admin recebe `Forbidden`, não consegue se promover nem publicar; admin vê o resumo, publica aviso; anônimo negado.
- **Nenhum admin foi cadastrado** (decisão de quem terá acesso é sua). Para se cadastrar, no SQL Editor do Supabase: `insert into public.connect_admins(user_id) select id from auth.users where email = 'SEU_EMAIL';`
- **Tela do painel NÃO foi construída**, e a lista de usuários/ações de moderação (suspender, remover conteúdo) e notificação em massa não existem. Avisos publicados ainda não aparecem para os usuários no app.

### Modo demonstração removido (a pedido)
- Front: removidos o botão "Conhecer por dentro", a tela de login demo e o atalho `?demo=1`.
- Edge Function `connect-demo-login` substituída por um stub que responde 410 (não cria nem abre sessões). Os segredos `CONNECT_DEMO_*` não são mais necessários.
- Mantido por segurança: colunas/guardas `is_demo` no banco e no front (inofensivos; contas demo continuam ocultas das listas). Nenhuma conta demo existia no banco. Limpeza total desses guardas fica como refatoração opcional.

### Integração com o commit da outra IA na `main` (`de7277d`)
- Verificado: não alterou o Supabase (migrations e Edge Functions inalteradas) nem expôs chaves (`.env.example` só com nomes). Trouxe painel admin (usa as RPCs `admin_*`), visitante, salas, fila e checkout Pix novos.
- Quebrou a `main`: `output: "standalone"` sem `basePath` e caminhos na raiz (`/icons`, `/sw.js`, manifest), o que fez o deploy do Pages falhar (`app-version.json` ausente) e, se publicado, quebraria o PWA em `/Connect/`. Também publicava `public/assets/aistudio/PENDENCIAS_CONNECT_*.md`.
- Corrigido neste branch (merge): `output: "export"` + `basePath "/Connect"`, prefixo `/Connect/` restaurado, doc interno removido de `public/`, modo demo removido.
- Bugs achados e corrigidos: (1) admin oferecia status `open`, que o `CHECK` de `user_reports` rejeita (aceita só pending/reviewing/resolved/dismissed); (2) `PWARegister` recarregava a página sozinho no `controllerchange` (perda de estado/conversa), agora só após clicar em "Atualizar"; (3) texto da janela do encontro mostrava `{windowLabel}` literal.
- CI do PR #10 verde no commit `7b50cf5`. **Enquanto o PR #10 não for mesclado, a `main` continua com o deploy quebrado.** Não testado em navegador real: painel admin com conta admin, fluxo visitante, salas, checkout Pix.

### Modo gratuito (a pedido)
- Banco: `connect_app_config.paywall_enabled = false` (migration `20261120110000`): `enter_queue` não conta nem limita buscas e `get_queue_search_quota` devolve ilimitado. Testado: 25 buscas novas seguidas passam; com a chave em `true` o limite de 20 volta.
- Front: menu "Assinatura" e a aba de planos ficam ocultos (`PAYWALL_ENABLED`, build com `NEXT_PUBLIC_PAYWALL_ENABLED=true` para reexibir).
- Não removido: Edge Functions de pagamento, tabelas e webhook (continuam disponíveis, sem entrada na interface). Quem já tem assinatura ativa no Mercado Pago **continua sendo cobrado** até cancelar; isso não foi tratado aqui.

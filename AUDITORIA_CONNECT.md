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

# CONNECT — auditoria de segurança e banco

Auditoria consultiva realizada em 18/11/2026 no projeto Supabase associado ao repositório. As verificações abaixo foram executadas no banco conectado; não são inferências do código.

## Achados e correções

### Finalização de batalhas ao vivo — corrigido

Antes da correção, `public.finish_live_battle(uuid)` era `SECURITY DEFINER`, executável por `authenticated`, e não validava `auth.uid()` nem a relação do usuário com a batalha. Um usuário autenticado poderia tentar finalizar uma batalha de terceiros após o horário.

Correção aplicada:
- A função agora exige sessão autenticada e valida `auth.uid() = live_battles.host_user_id`.
- Também rejeita batalha sem `ends_at` ou cujo tempo ainda não terminou.
- O cliente só solicita a finalização quando o usuário atual é o host da live e evita RPC repetida a cada segundo.
- Migration aplicada no Supabase e versionada no repositório: `20261118022639_restrict_finish_live_battle_to_host.sql`.

Verificação posterior no banco confirmou presença da checagem de sessão, validação do host e execução autenticada mantida para o fluxo legítimo do host.

### Tabelas de uso exclusivo do servidor

O advisor identificou quatro tabelas com RLS habilitado e sem policies:
- `connect_pix_checkouts`
- `financial_provider_events`
- `queue_entitlements`
- `queue_search_usage`

A consulta de privilégios confirmou que `anon` e `authenticated` não possuem SELECT, INSERT, UPDATE ou DELETE nessas tabelas; `service_role` possui acesso. Isso é compatível com o desenho server-only e não foi alterado.

### Funções SECURITY DEFINER

O advisor continua sinalizando 17 funções expostas a `authenticated`. A sinalização é baseada na concessão de EXECUTE, não prova isoladamente uma falha: RPCs de produto precisam validar identidade e autorização dentro da função. A consulta posterior não encontrou função `SECURITY DEFINER` executável por `authenticated` sem referência a `auth.uid()`. O advisor ainda lista 17 funções deste tipo porque `EXECUTE` continua concedido a usuários autenticados; as definições foram verificadas quanto à presença de identidade, mas a autorização por objeto/participante deve continuar sendo revisada função por função. A exceção encontrada foi `finish_live_battle`, corrigida nesta etapa.

A lista deve continuar sendo revisada função por função. O aviso não foi ocultado nem tratado como resolvido apenas porque a chamada é autenticada.

### Configuração de autenticação

- Advisor: proteção contra senhas vazadas está desabilitada.
- A configuração é do Supabase Auth e não é controlada por migration SQL deste repositório. Deve ser habilitada no painel em [Auth → Password Security](https://supabase.com/dashboard/project/trrakyybnvxpdhxwgjrz/auth/providers), avaliando o impacto para cadastro e alteração de senha.

## Dependências

A primeira auditoria npm encontrou avisos críticos/altos em Capacitor e PostCSS. As versões foram atualizadas para Capacitor 7.6.10 e PostCSS 8.5.25 via override, sem promover o Next.js 15 para uma nova major. O CI agora usa `npm ci`, mantém `package-lock.json` versionado e falha se restarem vulnerabilidades high/critical. A auditoria final após as atualizações está em execução.

## Performance e manutenção

Após as migrations `20261118023249_optimize_rls_auth_initplans` e `20261118023313_consolidate_permissive_rls_policies`, o advisor deixou de apontar as 10 policies com chamadas de auth reavaliadas por linha e os 3 conjuntos de policies permissivas sobrepostas. As regras foram reescritas preservando os mesmos critérios de acesso e combinando as permissões por OR.

Achados restantes:
- 29 chaves estrangeiras sem índice de cobertura.
- 13 índices ainda não utilizados segundo as estatísticas atuais.
- Advisor de saúde: nenhum achado.\n- Advisor de segurança: 4 tabelas server-only com RLS sem policies (grants diretos de usuários verificados como ausentes), 17 funções `SECURITY DEFINER` executáveis por `authenticated` que seguem exigindo revisão contínua e proteção contra senhas vazadas desabilitada.

As tabelas avaliadas tinham volume muito baixo no momento da auditoria. Índices adicionais devem ser priorizados com base nas consultas e no crescimento; remover índices ainda não utilizados agora pode prejudicar funcionalidades futuras.

## Verificações de RLS

Consulta a todas as tabelas ordinárias de `public` não encontrou tabela com RLS desabilitado.

## Limites

- A proteção contra senhas vazadas depende de configuração no painel, não de código.
- As verificações de banco confirmam grants e definições atuais, mas não substituem testes de autorização com duas contas reais e tentativas de acesso cruzado.
- As integrações Mercado Pago e LiveKit precisam de testes sandbox/produção com eventos e credenciais válidas.
- A auditoria npm do CI ainda precisa identificar e tratar as dependências afetadas; nenhuma atualização forçada foi aplicada.

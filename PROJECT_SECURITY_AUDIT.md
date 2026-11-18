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

O advisor continua sinalizando 17 funções expostas a `authenticated`. A sinalização é baseada na concessão de EXECUTE, não prova isoladamente uma falha: RPCs de produto precisam validar identidade e autorização dentro da função. A inspeção de código identificou verificações de `auth.uid()` nas funções de fila, match, chat, bloqueio e exclusão; a exceção encontrada foi `finish_live_battle`, corrigida nesta etapa.

A lista deve continuar sendo revisada função por função. O aviso não foi ocultado nem tratado como resolvido apenas porque a chamada é autenticada.

### Configuração de autenticação

- Advisor: proteção contra senhas vazadas está desabilitada.
- A configuração é do Supabase Auth e não é controlada por migration SQL deste repositório. Deve ser habilitada no painel em [Auth → Password Security](https://supabase.com/dashboard/project/trrakyybnvxpdhxwgjrz/auth/providers), avaliando o impacto para cadastro e alteração de senha.

## Performance e manutenção

Resultado do advisor:
- 29 chaves estrangeiras sem índice de cobertura.
- 10 policies com chamadas de auth reavaliadas por linha; o advisor recomenda encapsular chamadas estáveis como `(select auth.uid())`.
- 13 índices ainda não utilizados segundo as estatísticas atuais.
- 3 conjuntos de policies permissivas sobrepostas.
- Advisor de saúde: nenhum achado.

Esses itens não foram alterados automaticamente: criar ou remover índices e combinar policies sem analisar consultas, volume e semântica de autorização pode piorar desempenho ou mudar acesso. Devem ser priorizados com métricas reais e testes de RLS.

## Verificações de RLS

Consulta a todas as tabelas ordinárias de `public` não encontrou tabela com RLS desabilitado.

## Limites

- A proteção contra senhas vazadas depende de configuração no painel, não de código.
- As verificações de banco confirmam grants e definições atuais, mas não substituem testes de autorização com duas contas reais e tentativas de acesso cruzado.
- As integrações Mercado Pago e LiveKit precisam de testes sandbox/produção com eventos e credenciais válidas.
- A auditoria npm do CI ainda precisa identificar e tratar as dependências afetadas; nenhuma atualização forçada foi aplicada.

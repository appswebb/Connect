# CONNECT — auditoria de histórico de migrations

**Atenção: o histórico local do repositório ainda não é reproduzível do zero.**

Conferência realizada em 18/11/2026:
- Banco Supabase conectado: **42 migrations aplicadas** no histórico remoto.
- Repositório: **19 arquivos SQL** em `supabase/migrations/`.
- Existem versões locais duplicadas:
  - `20261116090000_connect_recurring_plans.sql`
  - `20261116090000_subscription_gifts_only.sql`
  - `20261116100000_connect_pix_checkouts.sql`
  - `20261116100000_publish_connect_package_details.sql`
- Várias migrations remotas aplicadas não têm arquivo local correspondente; alguns arquivos locais têm timestamps/names diferentes dos registrados no histórico remoto.

## Impacto

- Não é seguro executar `supabase db push`, `supabase migration up` ou `supabase db reset` a partir deste checkout esperando reproduzir o banco de produção.
- Uma migration local com versão duplicada pode ser rejeitada pelo CLI; migrations locais ainda não registradas remotamente podem tentar reaplicar DDL.
- O banco ativo foi inspecionado diretamente e as três migrations desta evolução foram aplicadas e versionadas com as versões remotas correspondentes:
  - `20261118022639_restrict_finish_live_battle_to_host`
  - `20261118023249_optimize_rls_auth_initplans`
  - `20261118023313_consolidate_permissive_rls_policies`

## O que foi preservado

- Nenhuma tabela, coluna, trigger ou contrato de API foi removido.
- As migrations novas são alterações de função/policies e não recriam o schema.
- Não foram renomeados nem apagados arquivos antigos de migration, porque não há correspondência SQL verificável para todos os 42 registros remotos. Renomear por suposição poderia causar reexecução de DDL ou divergência adicional.

## Reconciliação necessária

A reconciliação correta deve ser feita em um ambiente de desenvolvimento isolado:
1. Obter um dump de schema do banco remoto, incluindo extensões, enums, tabelas, índices, policies, funções, triggers e grants.
2. Comparar o dump com os 16 arquivos SQL locais e os 42 registros de `supabase_migrations.schema_migrations`.
3. Identificar quais arquivos locais já correspondem a versões remotas e alinhar os nomes/versões sem reaplicar DDL.
4. Criar uma baseline reproduzível e migrations incrementais com versões únicas.
5. Executar reset e testes de RLS em um banco descartável antes de alterar o histórico de produção.

Esta etapa foi registrada como pendência explícita em vez de inventar migrations ou declarar que o histórico está reconciliado.

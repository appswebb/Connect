-- Índices para a aba Pessoas (paginação por cursor, busca e filtro por cidade) e para a
-- política RLS de `profiles`, que consulta `user_blocks` uma vez por linha.
--
-- ATENÇÃO: o histórico de migrations deste repositório NÃO reproduz o banco de produção
-- (veja PROJECT_MIGRATION_AUDIT.md). Não use `supabase db push`. Revise e aplique este
-- arquivo manualmente no SQL Editor do Supabase. `if not exists` torna a execução segura
-- caso algum índice equivalente já exista. Com a tabela grande, execute cada
-- `create index` separadamente trocando por `create index concurrently` (fora de transação).

-- Cursor (created_at desc, id desc) usado por ConnectPeopleDirectory.
create index if not exists profiles_created_at_id_desc_idx
  on public.profiles (created_at desc, id desc);

-- Filtro "Da minha cidade".
create index if not exists profiles_location_city_idx
  on public.profiles (state_code, city)
  where location_visible = true;

-- Busca por nome/@/bio com ILIKE '%termo%'.
create extension if not exists pg_trgm;
create index if not exists profiles_display_name_trgm_idx
  on public.profiles using gin (display_name gin_trgm_ops);
create index if not exists profiles_username_trgm_idx
  on public.profiles using gin (username gin_trgm_ops);

-- Política "authenticated users can read profiles": NOT EXISTS em user_blocks nos dois sentidos.
create index if not exists user_blocks_blocker_blocked_idx
  on public.user_blocks (blocker_id, blocked_id);
create index if not exists user_blocks_blocked_blocker_idx
  on public.user_blocks (blocked_id, blocker_id);

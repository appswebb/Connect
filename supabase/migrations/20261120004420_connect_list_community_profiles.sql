-- Aba Pessoas: paginação por cursor de TUPLA (created_at, id), usável como Index Cond.
-- (A forma "created_at < X or (created_at = X and id < Y)" lê e descarta todas as linhas anteriores.)
create extension if not exists pg_trgm with schema extensions;

create or replace function public.profile_search_text(p_display_name text, p_username text, p_city text, p_state_code text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select lower(coalesce(p_display_name, '') || ' ' || coalesce(p_username, '') || ' ' || coalesce(p_city, '') || ' ' || coalesce(p_state_code, ''))
$$;

create index if not exists profiles_search_trgm_idx
  on public.profiles using gin (public.profile_search_text(display_name, username, city, state_code) extensions.gin_trgm_ops);

create or replace function public.list_community_profiles(
  p_limit integer default 24,
  p_cursor_created_at timestamptz default null,
  p_cursor_id uuid default null,
  p_search text default null,
  p_filter text default 'all',
  p_online_ids uuid[] default null
)
returns setof public.profiles
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_limit integer := least(greatest(coalesce(p_limit, 24), 1), 61);
  v_term text := nullif(lower(trim(coalesce(p_search, ''))), '');
  v_sql text;
  v_state text;
  v_city text;
  v_visible boolean;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_filter is not null and p_filter not in ('all', 'new', 'near', 'online') then
    raise exception 'Invalid filter' using errcode = '22023';
  end if;

  -- security invoker: a RLS de profiles continua excluindo contas demo e bloqueios nos dois sentidos.
  v_sql := format('select p.* from public.profiles p where p.id <> %L::uuid', v_uid);

  if p_cursor_created_at is not null and p_cursor_id is not null then
    v_sql := v_sql || format(' and (p.created_at, p.id) < (%L::timestamptz, %L::uuid)', p_cursor_created_at, p_cursor_id);
  end if;

  if p_filter = 'new' then
    v_sql := v_sql || ' and p.created_at >= now() - interval ''7 days''';
  elsif p_filter = 'near' then
    select m.state_code, m.city, m.location_visible into v_state, v_city, v_visible
    from public.profiles m where m.id = v_uid;
    if not coalesce(v_visible, false) or v_state is null or v_city is null then
      return;
    end if;
    v_sql := v_sql || format(' and p.location_visible and p.state_code = %L and p.city = %L', v_state, v_city);
  elsif p_filter = 'online' then
    if p_online_ids is null or cardinality(p_online_ids) = 0 then
      return;
    end if;
    v_sql := v_sql || format(' and p.id = any(%L::uuid[])', (select array_agg(x) from (select unnest(p_online_ids) as x limit 100) s));
  end if;

  if v_term is not null then
    v_term := left(v_term, 60);
    v_sql := v_sql || format(
      ' and public.profile_search_text(p.display_name, p.username, p.city, p.state_code) like %L',
      '%' || replace(replace(replace(v_term, '\', '\\'), '%', '\%'), '_', '\_') || '%'
    );
  end if;

  v_sql := v_sql || format(' order by p.created_at desc, p.id desc limit %s', v_limit);
  return query execute v_sql;
end;
$$;

revoke all on function public.list_community_profiles(integer, timestamptz, uuid, text, text, uuid[]) from public, anon;
grant execute on function public.list_community_profiles(integer, timestamptz, uuid, text, text, uuid[]) to authenticated;

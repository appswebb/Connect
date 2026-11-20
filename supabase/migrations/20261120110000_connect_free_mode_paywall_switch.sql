-- Modo gratuito (aplicado em produção): paywall_enabled=false => buscas ilimitadas para todos.
-- Para voltar a cobrar: update public.connect_app_config set value='true'::jsonb where key='paywall_enabled';
create table if not exists public.connect_app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.connect_app_config enable row level security;
revoke all on public.connect_app_config from public, anon, authenticated;
insert into public.connect_app_config(key, value) values ('paywall_enabled', 'false'::jsonb) on conflict (key) do nothing;

do $$
declare d text; pw text := $p$coalesce((select (c.value #>> '{}')::boolean from public.connect_app_config c where c.key='paywall_enabled'), false)$p$;
begin
  d := pg_get_functiondef('public.enter_queue(text,text)'::regprocedure);
  if position('    if not coalesce(v_unlimited,false) then' in d) = 0 then raise exception 'enter_queue: trecho nao encontrado'; end if;
  d := replace(d, '    if not coalesce(v_unlimited,false) then', '    if not coalesce(v_unlimited,false) and ' || pw || ' then');
  execute d;

  d := pg_get_functiondef('public.get_queue_search_quota()'::regprocedure);
  if position('case when v_until > now() then 2147483647' in d) = 0 or position('coalesce(v_until > now(),false),' in d) = 0 then raise exception 'quota: trecho nao encontrado'; end if;
  d := replace(d, 'case when v_until > now() then 2147483647', 'case when v_until > now() or not ' || pw || ' then 2147483647');
  d := replace(d, 'coalesce(v_until > now(),false),', '(coalesce(v_until > now(),false) or not ' || pw || '),');
  execute d;
end $$;

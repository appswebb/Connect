-- Exclusão imediata de conta. Só service_role executa (via Edge Function delete-account).
-- Retenção legal: registros financeiros ficam isolados, sem identificação direta (hash unidirecional do id).
create table if not exists public.account_deletion_retention (
  id bigint generated always as identity primary key,
  subject_hash text not null,
  source_table text not null,
  payload jsonb not null,
  retain_until timestamptz not null default now() + interval '5 years', -- confirmar prazo com contador/advogado
  created_at timestamptz not null default now()
);
create table if not exists public.account_deletion_audit (
  id bigint generated always as identity primary key,
  subject_hash text not null,
  method text not null,
  deleted_at timestamptz not null default now()
);
create table if not exists public.orphaned_storage_objects (
  id bigint generated always as identity primary key,
  bucket_id text not null,
  object_path text not null,
  created_at timestamptz not null default now(),
  unique (bucket_id, object_path)
);
alter table public.account_deletion_retention enable row level security;
alter table public.account_deletion_audit enable row level security;
alter table public.orphaned_storage_objects enable row level security;
revoke all on public.account_deletion_retention, public.account_deletion_audit, public.orphaned_storage_objects from public, anon, authenticated;

create or replace function public.list_user_storage_paths(p_user uuid)
returns table(bucket_id text, object_path text)
language sql stable security definer set search_path = ''
as $$
  select o.bucket_id, o.name from storage.objects o
  where o.bucket_id = 'connect-media' and (storage.foldername(o.name))[1] = p_user::text
  union
  select o.bucket_id, o.name from storage.objects o
  where o.bucket_id = 'connect-chat'
    and ((storage.foldername(o.name))[2] = p_user::text
      or (storage.foldername(o.name))[1] in (select m.id::text from public.matches m where p_user in (m.user_one, m.user_two)))
$$;

create or replace function public.delete_account_data(p_user uuid, p_method text default 'self_service')
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_hash text := encode(sha256(convert_to(p_user::text, 'utf8')), 'hex');
begin
  perform 1 from auth.users where id = p_user for update;
  if not found then raise exception 'USER_NOT_FOUND'; end if;
  if exists (select 1 from public.withdrawal_requests where user_id = p_user and status in ('requested','under_review','processing')) then
    raise exception 'PENDING_WITHDRAWAL';
  end if;

  insert into public.account_deletion_retention(subject_hash, source_table, payload)
    select v_hash, 'connect_payments', to_jsonb(t) - 'user_id' - 'raw_event' from public.connect_payments t where user_id = p_user;
  insert into public.account_deletion_retention(subject_hash, source_table, payload)
    select v_hash, 'connect_subscriptions', to_jsonb(t) - 'user_id' - 'checkout_url' from public.connect_subscriptions t where user_id = p_user;
  insert into public.account_deletion_retention(subject_hash, source_table, payload)
    select v_hash, 'coin_orders', to_jsonb(t) - 'user_id' - 'raw_event' - 'checkout_url' from public.coin_orders t where user_id = p_user and status in ('paid','approved');
  insert into public.account_deletion_retention(subject_hash, source_table, payload)
    select v_hash, 'connect_pix_checkouts', to_jsonb(t) - 'user_id' - 'qr_code' - 'qr_code_base64' from public.connect_pix_checkouts t where user_id = p_user and paid_at is not null;
  insert into public.account_deletion_retention(subject_hash, source_table, payload)
    select v_hash, 'subscription_gifts', to_jsonb(t) - 'sender_id' - 'recipient_id' - 'checkout_url' from public.subscription_gifts t
    where (sender_id = p_user or recipient_id = p_user) and paid_at is not null;
  insert into public.account_deletion_retention(subject_hash, source_table, payload)
    select v_hash, 'wallet_ledger', to_jsonb(t) - 'user_id' from public.wallet_ledger t where user_id = p_user;
  insert into public.account_deletion_retention(subject_hash, source_table, payload)
    select v_hash, 'withdrawal_requests', to_jsonb(t) - 'user_id' - 'pix_key_masked' - 'pix_key_fingerprint' from public.withdrawal_requests t where user_id = p_user;

  -- linhas que bloqueiam a exclusão (FK NO ACTION/RESTRICT)
  delete from public.live_gifts where sender_id = p_user or receiver_id = p_user;
  delete from public.live_battle_scores where user_id = p_user;
  delete from public.live_battle_scores where battle_id in (select id from public.live_battles where host_user_id = p_user or challenger_user_id = p_user);
  delete from public.live_gifts where battle_id in (select id from public.live_battles where host_user_id = p_user or challenger_user_id = p_user);
  update public.live_battles set winner_user_id = null where winner_user_id = p_user;
  delete from public.live_battles where host_user_id = p_user or challenger_user_id = p_user;
  delete from public.subscription_gifts where sender_id = p_user or recipient_id = p_user;
  delete from public.wallet_ledger where user_id = p_user;
  delete from public.withdrawal_requests where user_id = p_user;

  insert into public.account_deletion_audit(subject_hash, method) values (v_hash, p_method);
  delete from auth.users where id = p_user; -- CASCADE remove perfil, posts, mensagens, sessões etc.
end;
$$;

drop function if exists public.purge_due_account_deletions();
create function public.purge_due_account_deletions()
returns integer
language plpgsql security definer set search_path = ''
as $$
declare r record; n integer := 0;
begin
  for r in select user_id from public.account_deletion_requests where scheduled_for <= now() loop
    begin
      insert into public.orphaned_storage_objects(bucket_id, object_path)
        select bucket_id, object_path from public.list_user_storage_paths(r.user_id) on conflict do nothing;
      perform public.delete_account_data(r.user_id, 'scheduled_purge');
      n := n + 1;
    exception when others then
      raise warning 'purge failed for %: %', r.user_id, sqlerrm;
    end;
  end loop;
  return n;
end;
$$;

revoke all on function public.list_user_storage_paths(uuid), public.delete_account_data(uuid, text), public.purge_due_account_deletions() from public, anon, authenticated;
grant execute on function public.list_user_storage_paths(uuid), public.delete_account_data(uuid, text), public.purge_due_account_deletions() to service_role;

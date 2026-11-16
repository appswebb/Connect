create table if not exists public.subscription_gifts (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete restrict,
  recipient_id uuid not null references auth.users(id) on delete restrict,
  plan_id text not null references public.connect_plans(id),
  duration_days integer not null check (duration_days in (30, 365)),
  amount_brl numeric(12,2) not null check (amount_brl > 0),
  status text not null default 'pending' check (status in ('pending','paid','failed','cancelled','refunded')),
  provider text not null default 'mercadopago',
  provider_payment_id text,
  checkout_url text,
  paid_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_gifts_sender_recipient_different check (sender_id <> recipient_id)
);
create unique index if not exists subscription_gifts_provider_payment_uidx
  on public.subscription_gifts(provider, provider_payment_id) where provider_payment_id is not null;
create index if not exists subscription_gifts_recipient_created_idx
  on public.subscription_gifts(recipient_id, created_at desc);
alter table public.subscription_gifts enable row level security;
drop policy if exists "Users can view sent or received subscription gifts" on public.subscription_gifts;
create policy "Users can view sent or received subscription gifts"
  on public.subscription_gifts for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = recipient_id);
revoke insert, update, delete on public.subscription_gifts from anon, authenticated;
grant select on public.subscription_gifts to authenticated;

create or replace function public.apply_subscription_gift_payment(
  p_gift_id uuid,
  p_payment_id text,
  p_amount numeric,
  p_currency text,
  p_raw_event jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_gift public.subscription_gifts%rowtype;
  v_base timestamptz;
  v_start timestamptz;
  v_end timestamptz;
begin
  if coalesce(p_currency, '') <> 'BRL' then
    raise exception 'Moeda do pagamento inválida.';
  end if;
  select * into v_gift from public.subscription_gifts where id = p_gift_id for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'gift_not_found'); end if;
  if abs(coalesce(p_amount, 0) - v_gift.amount_brl) > 0.009 then
    raise exception 'Valor do pagamento não corresponde ao presente.';
  end if;
  if v_gift.status = 'paid' then
    return jsonb_build_object('ok', true, 'already_applied', true, 'ends_at', v_gift.ends_at);
  end if;
  if v_gift.status <> 'pending' then
    return jsonb_build_object('ok', false, 'reason', 'gift_not_pending');
  end if;

  select greatest(coalesce(q.unlimited_until, now()), now())
    into v_base
    from (select 1) seed
    left join public.queue_entitlements q on q.user_id = v_gift.recipient_id;
  v_start := v_base;
  v_end := v_start + make_interval(days => v_gift.duration_days);

  update public.subscription_gifts
    set status = 'paid', provider_payment_id = p_payment_id,
        paid_at = now(), starts_at = v_start, ends_at = v_end,
        updated_at = now()
    where id = v_gift.id;

  insert into public.queue_entitlements(user_id, unlimited_until, updated_at)
    values(v_gift.recipient_id, v_end, now())
    on conflict (user_id) do update
      set unlimited_until = greatest(coalesce(public.queue_entitlements.unlimited_until, now()), v_end),
          updated_at = now();

  insert into public.notifications(recipient_id, actor_id, type, title, body, entity_type, entity_id)
    values(v_gift.recipient_id, v_gift.sender_id, 'subscription_gift_received',
      'Você ganhou uma assinatura CONNECT!',
      case when v_gift.duration_days = 30 then 'Você recebeu 1 mês de CONNECT.' else 'Você recebeu 1 ano de CONNECT.' end,
      'subscription_gift', v_gift.id);

  return jsonb_build_object('ok', true, 'ends_at', v_end);
end;
$$;
revoke all on function public.apply_subscription_gift_payment(uuid, text, numeric, text, jsonb) from public, anon, authenticated;
grant execute on function public.apply_subscription_gift_payment(uuid, text, numeric, text, jsonb) to service_role;

update public.gift_catalog set active = false where active = true;
update public.coin_packages set active = false where active = true;
revoke execute on function public.buy_live_gift(text, integer) from public, anon, authenticated;
revoke execute on function public.send_live_gift(uuid, text, integer, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.send_gift_to_user(text, uuid, integer) from public, anon, authenticated;

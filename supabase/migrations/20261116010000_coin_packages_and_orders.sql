-- Real-money coin packages and idempotent wallet crediting.
create table if not exists public.coin_packages (
  id text primary key,
  name text not null,
  coins integer not null check (coins > 0),
  price_brl numeric(10,2) not null check (price_brl > 0),
  active boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coin_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  package_id text not null references public.coin_packages(id),
  coins integer not null check (coins > 0),
  amount_brl numeric(10,2) not null check (amount_brl > 0),
  provider text not null default 'mercadopago',
  provider_preference_id text,
  provider_payment_id text unique,
  checkout_url text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled','refunded','charged_back')),
  paid_at timestamptz,
  raw_event jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists coin_orders_user_created_idx on public.coin_orders(user_id, created_at desc);
create unique index if not exists coin_orders_preference_id_key on public.coin_orders(provider_preference_id) where provider_preference_id is not null;

alter table public.coin_packages enable row level security;
alter table public.coin_orders enable row level security;
drop policy if exists "Anyone can read active coin packages" on public.coin_packages;
create policy "Anyone can read active coin packages" on public.coin_packages for select using (active = true);
drop policy if exists "Users can read own coin orders" on public.coin_orders;
create policy "Users can read own coin orders" on public.coin_orders for select to authenticated using (auth.uid() = user_id);
revoke all on public.coin_orders from anon, authenticated;
grant select on public.coin_orders to authenticated;
revoke all on public.coin_packages from anon, authenticated;
grant select on public.coin_packages to anon, authenticated;

insert into public.coin_packages (id,name,coins,price_brl,active,sort_order) values
 ('coins-500','Pacote 500 moedas',500,4.90,true,1),
 ('coins-1200','Pacote 1.200 moedas',1200,9.90,true,2),
 ('coins-3000','Pacote 3.000 moedas',3000,19.90,true,3),
 ('coins-7000','Pacote 7.000 moedas',7000,39.90,true,4)
on conflict (id) do update set name=excluded.name,coins=excluded.coins,price_brl=excluded.price_brl,sort_order=excluded.sort_order,updated_at=now();

create or replace function public.credit_coin_order(
  p_order_id uuid,
  p_payment_id text,
  p_amount numeric,
  p_raw_event jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.coin_orders%rowtype;
  v_balance bigint;
begin
  if p_payment_id is null or length(trim(p_payment_id)) = 0 then
    raise exception 'Pagamento inválido';
  end if;
  select * into v_order from public.coin_orders where id = p_order_id for update;
  if not found then raise exception 'Pedido não encontrado'; end if;
  if round(p_amount::numeric,2) <> v_order.amount_brl then
    raise exception 'Valor do pagamento não confere';
  end if;
  if v_order.provider_payment_id is not null and v_order.provider_payment_id <> p_payment_id then
    raise exception 'Pedido já vinculado a outro pagamento';
  end if;
  if v_order.status = 'approved' then
    select coins into v_balance from public.user_wallets where user_id = v_order.user_id;
    return jsonb_build_object('credited',false,'balance',coalesce(v_balance,0));
  end if;
  if v_order.status not in ('pending') then
    raise exception 'Pedido não está pendente';
  end if;
  insert into public.user_wallets(user_id,coins,updated_at)
  values(v_order.user_id,v_order.coins,now())
  on conflict (user_id) do update
    set coins = public.user_wallets.coins + excluded.coins, updated_at = now();
  update public.coin_orders set status='approved',provider_payment_id=p_payment_id,
    paid_at=now(),raw_event=coalesce(p_raw_event,'{}'::jsonb),updated_at=now()
    where id=p_order_id;
  select coins into v_balance from public.user_wallets where user_id=v_order.user_id;
  return jsonb_build_object('credited',true,'balance',v_balance,'coins_added',v_order.coins);
end;
$$;
revoke all on function public.credit_coin_order(uuid,text,numeric,jsonb) from public, anon, authenticated;
grant execute on function public.credit_coin_order(uuid,text,numeric,jsonb) to service_role;

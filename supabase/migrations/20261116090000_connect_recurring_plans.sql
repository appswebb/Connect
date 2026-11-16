-- CONNECT recurring subscriptions (Mercado Pago)
create table if not exists public.connect_plans (
  id text primary key,
  name text not null,
  description text not null default '',
  billing_interval text not null check (billing_interval in ('month','year')),
  price_brl numeric(10,2) not null check (price_brl > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.connect_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null references public.connect_plans(id),
  provider text not null default 'mercadopago' check (provider = 'mercadopago'),
  provider_subscription_id text unique,
  status text not null default 'pending' check (status in ('pending','authorized','paused','cancelled','expired','past_due')),
  checkout_url text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.connect_payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references public.connect_subscriptions(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'mercadopago' check (provider = 'mercadopago'),
  provider_payment_id text not null unique,
  amount_brl numeric(10,2) not null check (amount_brl >= 0),
  status text not null check (status in ('pending','approved','rejected','cancelled','refunded','charged_back')),
  paid_at timestamptz,
  raw_event jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.connect_plans enable row level security;
alter table public.connect_subscriptions enable row level security;
alter table public.connect_payments enable row level security;
drop policy if exists "Active CONNECT plans are readable" on public.connect_plans;
create policy "Active CONNECT plans are readable" on public.connect_plans for select to anon, authenticated using (active = true);
drop policy if exists "Users can read own CONNECT subscriptions" on public.connect_subscriptions;
create policy "Users can read own CONNECT subscriptions" on public.connect_subscriptions for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can read own CONNECT payments" on public.connect_payments;
create policy "Users can read own CONNECT payments" on public.connect_payments for select to authenticated using ((select auth.uid()) = user_id);
insert into public.connect_plans (id,name,description,billing_interval,price_brl,active)
values
('connect-monthly','Pacote CONNECT Mensal','Buscas ilimitadas no CONNECT com renovação automática mensal.','month',0.01,false),
('connect-annual','Pacote CONNECT Anual','Buscas ilimitadas no CONNECT com renovação automática a cada 12 meses.','year',0.01,false)
on conflict (id) do nothing;

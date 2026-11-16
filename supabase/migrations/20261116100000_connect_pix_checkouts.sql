create table if not exists public.connect_pix_checkouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null references public.connect_plans(id),
  amount_brl numeric(12,2) not null check (amount_brl > 0),
  duration_days integer not null check (duration_days in (30,365)),
  provider_payment_id text unique,
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled','refunded','charged_back','failed')),
  qr_code text,
  qr_code_base64 text,
  expires_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists connect_pix_checkouts_user_created_idx on public.connect_pix_checkouts(user_id, created_at desc);
alter table public.connect_pix_checkouts enable row level security;
revoke all on public.connect_pix_checkouts from anon, authenticated;

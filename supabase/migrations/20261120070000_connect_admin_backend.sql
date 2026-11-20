-- Backend do painel admin. Acesso só para quem está em connect_admins (nenhum cliente escreve nela).
-- Para conceder acesso, rode no SQL Editor do Supabase (como dono do projeto):
--   insert into public.connect_admins(user_id) select id from auth.users where email = 'SEU_EMAIL';
create table if not exists public.connect_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.connect_admins enable row level security;
revoke all on public.connect_admins from public, anon, authenticated;

create table if not exists public.connect_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 1000),
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.connect_announcements enable row level security;
revoke all on public.connect_announcements from public, anon;
grant select on public.connect_announcements to authenticated;
create policy "Authenticated read active announcements" on public.connect_announcements for select to authenticated using (active);

create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  admin_id uuid, action text not null, target text, created_at timestamptz not null default now()
);
alter table public.admin_audit_log enable row level security;
revoke all on public.admin_audit_log from public, anon, authenticated;

create or replace function public.is_connect_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.connect_admins a where a.user_id = (select auth.uid())) $$;

create or replace function public.admin_overview()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_connect_admin() then raise exception 'Forbidden' using errcode = '42501'; end if;
  return jsonb_build_object(
    'users', (select count(*) from public.profiles where not is_demo),
    'new_7d', (select count(*) from public.profiles where not is_demo and created_at >= now() - interval '7 days'),
    'open_reports', (select count(*) from public.user_reports where status in ('pending','reviewing')),
    'pending_deletions', (select count(*) from public.account_deletion_requests)
  );
end $$;

create or replace function public.admin_list_reports(p_limit integer default 30, p_before timestamptz default null)
returns table(id uuid, reporter_id uuid, reported_user_id uuid, category text, details text, status text, target_type text, target_id uuid, created_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_connect_admin() then raise exception 'Forbidden' using errcode = '42501'; end if;
  return query select r.id, r.reporter_id, r.reported_user_id, r.category, r.details, r.status, r.target_type, r.target_id, r.created_at
    from public.user_reports r where p_before is null or r.created_at < p_before
    order by r.created_at desc limit least(greatest(coalesce(p_limit,30),1),100);
end $$;

create or replace function public.admin_set_report_status(p_report uuid, p_status text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_connect_admin() then raise exception 'Forbidden' using errcode = '42501'; end if;
  update public.user_reports set status = p_status where id = p_report;
  insert into public.admin_audit_log(admin_id, action, target) values (auth.uid(), 'report_status:' || p_status, p_report::text);
end $$;

create or replace function public.admin_publish_announcement(p_title text, p_body text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare v_id uuid;
begin
  if not public.is_connect_admin() then raise exception 'Forbidden' using errcode = '42501'; end if;
  insert into public.connect_announcements(title, body, created_by) values (p_title, p_body, auth.uid()) returning id into v_id;
  insert into public.admin_audit_log(admin_id, action, target) values (auth.uid(), 'announcement', v_id::text);
  return v_id;
end $$;

revoke all on function public.is_connect_admin(), public.admin_overview(), public.admin_list_reports(integer, timestamptz), public.admin_set_report_status(uuid, text), public.admin_publish_announcement(text, text) from public, anon;
grant execute on function public.is_connect_admin(), public.admin_overview(), public.admin_list_reports(integer, timestamptz), public.admin_set_report_status(uuid, text), public.admin_publish_announcement(text, text) to authenticated;

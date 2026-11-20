-- Seguidores reais: índices + RPCs (contagem e listas paginadas) respeitando bloqueios e contas demo.
create index if not exists follows_followed_created_idx on public.follows (followed_id, created_at desc, follower_id);
create index if not exists follows_follower_created_idx on public.follows (follower_id, created_at desc, followed_id);

create or replace function public.profile_follow_stats(p_profile uuid)
returns table(followers_count bigint, following_count bigint, i_follow boolean, follows_me boolean)
language plpgsql stable security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if p_profile <> v_uid and not exists (select 1 from public.profiles p where p.id = p_profile and not p.is_demo)
     or exists (select 1 from public.user_blocks b where (b.blocker_id = v_uid and b.blocked_id = p_profile) or (b.blocker_id = p_profile and b.blocked_id = v_uid)) then
    return;
  end if;
  return query select
    (select count(*) from public.follows f join public.profiles pf on pf.id = f.follower_id and not pf.is_demo where f.followed_id = p_profile),
    (select count(*) from public.follows f join public.profiles pf on pf.id = f.followed_id and not pf.is_demo where f.follower_id = p_profile),
    exists (select 1 from public.follows f where f.follower_id = v_uid and f.followed_id = p_profile),
    exists (select 1 from public.follows f where f.follower_id = p_profile and f.followed_id = v_uid);
end;
$$;

create or replace function public.list_profile_follows(p_profile uuid, p_kind text, p_limit integer default 24, p_cursor_created_at timestamptz default null, p_cursor_id uuid default null)
returns table(id uuid, display_name text, username text, avatar_url text, city text, state_code text, location_visible boolean, followed_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
declare v_uid uuid := auth.uid(); v_limit integer := least(greatest(coalesce(p_limit, 24), 1), 61);
begin
  if v_uid is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if p_kind not in ('followers', 'following') then raise exception 'Invalid kind' using errcode = '22023'; end if;
  if p_profile <> v_uid and not exists (select 1 from public.profiles p where p.id = p_profile and not p.is_demo) then return; end if;
  if exists (select 1 from public.user_blocks b where (b.blocker_id = v_uid and b.blocked_id = p_profile) or (b.blocker_id = p_profile and b.blocked_id = v_uid)) then return; end if;
  return query
    select pr.id, pr.display_name, pr.username, pr.avatar_url, pr.city, pr.state_code, pr.location_visible, f.created_at
    from public.follows f
    join public.profiles pr on pr.id = case when p_kind = 'followers' then f.follower_id else f.followed_id end
    where (case when p_kind = 'followers' then f.followed_id else f.follower_id end) = p_profile
      and not pr.is_demo
      and not exists (select 1 from public.user_blocks b where (b.blocker_id = v_uid and b.blocked_id = pr.id) or (b.blocker_id = pr.id and b.blocked_id = v_uid))
      and (p_cursor_created_at is null or p_cursor_id is null or (f.created_at, pr.id) < (p_cursor_created_at, p_cursor_id))
    order by f.created_at desc, pr.id desc
    limit v_limit;
end;
$$;

revoke all on function public.profile_follow_stats(uuid), public.list_profile_follows(uuid, text, integer, timestamptz, uuid) from public, anon;
grant execute on function public.profile_follow_stats(uuid), public.list_profile_follows(uuid, text, integer, timestamptz, uuid) to authenticated;

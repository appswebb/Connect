-- Keep CONNECT notifications focused on meaningful events.
-- Likes/comments are deliberately not pushed to the notification center.
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('like','comment','message','message_request','message_request_accepted','new_follower','match','match_accepted','match_closed','live','post','site_update'));

drop trigger if exists notify_post_like on public.post_likes;
drop trigger if exists notify_post_comment on public.comments;
drop trigger if exists notify_live_started on public.live_sessions;
drop trigger if exists notify_post_published on public.posts;

create or replace function public.notify_followers_of_post()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if exists (
    select 1 from public.profiles p
    where p.id = new.user_id and p.is_demo = false
  ) then
    insert into public.notifications
      (recipient_id, actor_id, type, title, body, entity_type, entity_id)
    select f.follower_id, new.user_id, 'post',
      left(actor.display_name, 60) || ' publicou algo novo',
      'Uma pessoa que você segue publicou no CONNECT.',
      'post', new.id
    from public.follows f
    join public.profiles actor on actor.id = new.user_id and actor.is_demo = false
    join public.profiles recipient on recipient.id = f.follower_id and recipient.is_demo = false
    where f.following_id = new.user_id
      and f.follower_id <> new.user_id
      and not exists (
        select 1 from public.user_blocks b
        where (b.blocker_id = f.follower_id and b.blocked_id = new.user_id)
           or (b.blocker_id = new.user_id and b.blocked_id = f.follower_id)
      );
  end if;
  return new;
end;
$function$;

create or replace function public.notify_followers_of_live()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.status = 'live'
     and (tg_op = 'INSERT' or old.status is distinct from new.status)
     and exists (
       select 1 from public.profiles p
       where p.id = new.host_user_id and p.is_demo = false
     ) then
    insert into public.notifications
      (recipient_id, actor_id, type, title, body, entity_type, entity_id)
    select f.follower_id, new.host_user_id, 'live',
      'Nova transmissão ao vivo',
      left(host.display_name, 80) || ' iniciou uma live: ' || left(new.title, 90),
      'live', new.id
    from public.follows f
    join public.profiles host on host.id = new.host_user_id and host.is_demo = false
    join public.profiles recipient on recipient.id = f.follower_id and recipient.is_demo = false
    where f.following_id = new.host_user_id
      and f.follower_id <> new.host_user_id
      and not exists (
        select 1 from public.user_blocks b
        where (b.blocker_id = f.follower_id and b.blocked_id = new.host_user_id)
           or (b.blocker_id = new.host_user_id and b.blocked_id = f.follower_id)
      );
  end if;
  return new;
end;
$function$;

revoke all on function public.notify_followers_of_post() from public, anon, authenticated;
revoke all on function public.notify_followers_of_live() from public, anon, authenticated;

create trigger notify_post_published
  after insert on public.posts
  for each row execute function public.notify_followers_of_post();

create trigger notify_live_started
  after insert on public.live_sessions
  for each row execute function public.notify_followers_of_live();

create trigger notify_live_restarted
  after update of status on public.live_sessions
  for each row execute function public.notify_followers_of_live();

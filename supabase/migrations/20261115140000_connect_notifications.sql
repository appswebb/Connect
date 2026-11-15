create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  type text not null check (type in ('like','comment','message','match','match_accepted','match_closed','live')),
  title text not null,
  body text not null,
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_created_idx
  on public.notifications (recipient_id, created_at desc);
create index if not exists notifications_unread_idx
  on public.notifications (recipient_id, created_at desc)
  where read_at is null;

alter table public.notifications enable row level security;
revoke all on public.notifications from anon, public;
grant select, update, delete on public.notifications to authenticated;

drop policy if exists "Users can read their own notifications" on public.notifications;
create policy "Users can read their own notifications"
  on public.notifications for select to authenticated
  using (recipient_id = (select auth.uid()));

drop policy if exists "Users can mark their own notifications" on public.notifications;
create policy "Users can mark their own notifications"
  on public.notifications for update to authenticated
  using (recipient_id = (select auth.uid()))
  with check (recipient_id = (select auth.uid()));

drop policy if exists "Users can delete their own notifications" on public.notifications;
create policy "Users can delete their own notifications"
  on public.notifications for delete to authenticated
  using (recipient_id = (select auth.uid()));

create or replace function public.handle_connect_notification_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_recipient uuid;
  v_actor uuid;
  v_entity uuid;
  v_type text;
  v_title text;
  v_body text;
  v_entity_type text;
begin
  if tg_table_name = 'post_likes' then
    v_actor := new.user_id;
    v_entity := new.post_id;
    v_entity_type := 'post';
    v_type := 'like';
    v_title := 'Curtiram sua publicação';
    v_body := 'Alguém curtiu uma publicação sua.';
    select p.user_id into v_recipient from public.posts p where p.id = new.post_id;
  elsif tg_table_name = 'comments' then
    v_actor := new.user_id;
    v_entity := new.post_id;
    v_entity_type := 'post';
    v_type := 'comment';
    v_title := 'Novo comentário';
    v_body := 'Alguém comentou em uma publicação sua.';
    select p.user_id into v_recipient from public.posts p where p.id = new.post_id;
  elsif tg_table_name = 'messages' then
    v_actor := new.sender_id;
    v_entity := new.match_id;
    v_entity_type := 'match';
    v_type := 'message';
    v_title := 'Nova mensagem';
    v_body := 'Você recebeu uma nova mensagem privada.';
    select case when m.user_one = new.sender_id then m.user_two else m.user_one end
      into v_recipient
      from public.matches m
      where m.id = new.match_id
        and m.match_status = 'accepted'
        and m.ended_at is null;
  elsif tg_table_name = 'matches' then
    if tg_op = 'INSERT' and new.match_status = 'pending' then
      insert into public.notifications (recipient_id, actor_id, type, title, body, entity_type, entity_id)
      select pair.recipient_id, pair.actor_id, 'match', 'Nova conexão para confirmar',
             'Você encontrou alguém! Confirme a conexão dentro do prazo.',
             'match', new.id
      from (values (new.user_one,new.user_two),(new.user_two,new.user_one)) as pair(recipient_id,actor_id)
      join public.profiles recipient on recipient.id = pair.recipient_id and recipient.is_demo = false
      join public.profiles actor on actor.id = pair.actor_id and actor.is_demo = false
      where not exists (
        select 1 from public.user_blocks b
        where (b.blocker_id = pair.recipient_id and b.blocked_id = pair.actor_id)
           or (b.blocker_id = pair.actor_id and b.blocked_id = pair.recipient_id)
      );
    elsif tg_op = 'UPDATE' and old.match_status is distinct from new.match_status then
      if new.match_status = 'accepted' then
        insert into public.notifications (recipient_id, actor_id, type, title, body, entity_type, entity_id)
        select pair.recipient_id, pair.actor_id, 'match_accepted', 'Conexão confirmada!',
               'Vocês aceitaram a conexão. A conversa já está disponível.',
               'match', new.id
        from (values (new.user_one,new.user_two),(new.user_two,new.user_one)) as pair(recipient_id,actor_id)
        join public.profiles recipient on recipient.id = pair.recipient_id and recipient.is_demo = false
        join public.profiles actor on actor.id = pair.actor_id and actor.is_demo = false
        where not exists (
          select 1 from public.user_blocks b
          where (b.blocker_id = pair.recipient_id and b.blocked_id = pair.actor_id)
             or (b.blocker_id = pair.actor_id and b.blocked_id = pair.recipient_id)
        );
      elsif new.match_status in ('declined','expired') then
        insert into public.notifications (recipient_id, actor_id, type, title, body, entity_type, entity_id)
        select pair.recipient_id, pair.actor_id, 'match_closed', 'Conexão encerrada',
               case when new.match_status = 'expired'
                    then 'O prazo para confirmar a conexão terminou.'
                    else 'A conexão não foi confirmada.' end,
               'match', new.id
        from (values (new.user_one,new.user_two),(new.user_two,new.user_one)) as pair(recipient_id,actor_id)
        join public.profiles recipient on recipient.id = pair.recipient_id and recipient.is_demo = false
        join public.profiles actor on actor.id = pair.actor_id and actor.is_demo = false
        where not exists (
          select 1 from public.user_blocks b
          where (b.blocker_id = pair.recipient_id and b.blocked_id = pair.actor_id)
             or (b.blocker_id = pair.actor_id and b.blocked_id = pair.recipient_id)
        );
      end if;
    end if;
    return new;
  elsif tg_table_name = 'live_sessions' then
    if tg_op = 'INSERT' and new.status = 'live' then
      insert into public.notifications (recipient_id, actor_id, type, title, body, entity_type, entity_id)
      select recipient.id, new.host_user_id, 'live', 'Nova transmissão ao vivo',
             left(host.display_name, 80) || ' iniciou uma live: ' || left(new.title, 90),
             'live', new.id
      from public.profiles recipient
      join public.profiles host on host.id = new.host_user_id and host.is_demo = false
      where recipient.is_demo = false
        and recipient.id <> new.host_user_id
        and not exists (
          select 1 from public.user_blocks b
          where (b.blocker_id = recipient.id and b.blocked_id = new.host_user_id)
             or (b.blocker_id = new.host_user_id and b.blocked_id = recipient.id)
        );
    end if;
    return new;
  end if;

  if v_recipient is null or v_actor is null or v_recipient = v_actor then
    return new;
  end if;

  if exists (
    select 1 from public.profiles actor
    join public.profiles recipient on recipient.id = v_recipient
    where actor.id = v_actor
      and actor.is_demo = false
      and recipient.is_demo = false
  ) and not exists (
    select 1 from public.user_blocks b
    where (b.blocker_id = v_recipient and b.blocked_id = v_actor)
       or (b.blocker_id = v_actor and b.blocked_id = v_recipient)
  ) then
    insert into public.notifications (recipient_id, actor_id, type, title, body, entity_type, entity_id)
    values (v_recipient, v_actor, v_type, v_title, v_body, v_entity_type, v_entity);
  end if;

  return new;
end;
$function$;

revoke all on function public.handle_connect_notification_event() from public, anon, authenticated;

drop trigger if exists notify_post_like on public.post_likes;
create trigger notify_post_like after insert on public.post_likes
for each row execute function public.handle_connect_notification_event();

drop trigger if exists notify_post_comment on public.comments;
create trigger notify_post_comment after insert on public.comments
for each row execute function public.handle_connect_notification_event();

drop trigger if exists notify_direct_message on public.messages;
create trigger notify_direct_message after insert on public.messages
for each row execute function public.handle_connect_notification_event();

drop trigger if exists notify_match_event on public.matches;
create trigger notify_match_event after insert or update on public.matches
for each row execute function public.handle_connect_notification_event();

drop trigger if exists notify_live_started on public.live_sessions;
create trigger notify_live_started after insert on public.live_sessions
for each row execute function public.handle_connect_notification_event();

do $publication$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$publication$;

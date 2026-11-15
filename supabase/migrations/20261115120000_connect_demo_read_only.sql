alter table public.profiles
  add column if not exists is_demo boolean not null default false;

create or replace function public.handle_new_connect_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_looking_for text[];
begin
  select coalesce(array_agg(value), array['any']::text[])
    into v_looking_for
  from jsonb_array_elements_text(
    coalesce(new.raw_user_meta_data->'looking_for', '["any"]'::jsonb)
  ) as value;

  insert into public.profiles (
    id, display_name, username, gender, gender_description, looking_for, is_demo
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', ''),
    lower(coalesce(new.raw_user_meta_data->>'username', '')),
    coalesce(new.raw_user_meta_data->>'gender', ''),
    nullif(new.raw_user_meta_data->>'gender_description', ''),
    v_looking_for,
    coalesce((new.raw_app_meta_data->>'connect_demo')::boolean, false)
  );
  return new;
end;
$function$;

drop policy if exists "authenticated users can read profiles" on public.profiles;
create policy "authenticated users can read profiles"
on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or (
    is_demo = false
    and not exists (
      select 1 from public.user_blocks b
      where b.blocker_id = profiles.id
        and b.blocked_id = (select auth.uid())
    )
  )
);

create or replace function public.prevent_demo_account_write()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if coalesce((select auth.jwt())->'app_metadata'->>'connect_demo', 'false') = 'true' then
    raise exception 'DEMO_READ_ONLY: Esta conta de demonstração permite apenas visualizar o CONNECT.';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$function$;

do $block$
declare
  v_table text;
  v_op text;
begin
  foreach v_table in array array[
    'profiles','posts','post_likes','comments','global_room_messages',
    'messages','user_blocks','user_reports','live_sessions','queue_entries',
    'matches','account_deletion_requests'
  ] loop
    if v_table = 'profiles' then
      v_op := 'before update or delete';
    else
      v_op := 'before insert or update or delete';
    end if;
    execute format('drop trigger if exists prevent_demo_write on public.%I', v_table);
    execute format(
      'create trigger prevent_demo_write %s on public.%I for each row execute function public.prevent_demo_account_write()',
      v_op, v_table
    );
  end loop;
  execute 'drop trigger if exists prevent_demo_write on storage.objects';
  execute 'create trigger prevent_demo_write before insert or update or delete on storage.objects for each row execute function public.prevent_demo_account_write()';
end;
$block$;

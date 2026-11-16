alter table public.user_reports
  add column if not exists target_type text not null default 'profile',
  add column if not exists target_id uuid;

alter table public.user_reports
  drop constraint if exists user_reports_target_type_check;

alter table public.user_reports
  add constraint user_reports_target_type_check
  check (target_type in ('profile','post','comment','room_message','chat_message','live'));

create index if not exists user_reports_target_lookup_idx
  on public.user_reports (target_type, target_id)
  where target_id is not null;

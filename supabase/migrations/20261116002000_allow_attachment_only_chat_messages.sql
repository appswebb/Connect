alter table public.messages drop constraint if exists messages_body_check;

alter table public.messages
  add constraint messages_body_check
  check (
    (
      attachment_path is not null
      and message_type in ('image', 'audio', 'file')
      and char_length(trim(body)) <= 4000
    )
    or
    (
      attachment_path is null
      and char_length(trim(body)) between 1 and 4000
    )
  );

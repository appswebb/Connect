alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
check (type = any (array[
  'like','comment','message','message_request','message_request_accepted',
  'new_follower','match','match_accepted','match_closed','live','post',
  'site_update','subscription_gift_received'
]::text[]));
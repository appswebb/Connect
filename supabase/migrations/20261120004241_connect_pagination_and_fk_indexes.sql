-- Cursor (created_at desc, id desc) da aba Pessoas.
create index if not exists profiles_created_at_id_desc_idx on public.profiles (created_at desc, id desc);
-- Política RLS consulta user_blocks nos dois sentidos; (blocker_id, blocked_id) já é único.
create index if not exists user_blocks_blocked_blocker_idx on public.user_blocks (blocked_id, blocker_id);
-- Chaves estrangeiras sem índice (alerta do advisor), principalmente as que sofrem ON DELETE na exclusão de conta.
create index if not exists messages_sender_id_idx on public.messages (sender_id);
create index if not exists follows_followed_id_idx on public.follows (followed_id);
create index if not exists comments_user_id_idx on public.comments (user_id);
create index if not exists global_room_messages_user_id_idx on public.global_room_messages (user_id);
create index if not exists user_reports_reported_user_id_idx on public.user_reports (reported_user_id);
create index if not exists user_reports_reporter_id_idx on public.user_reports (reporter_id);
create index if not exists chat_user_preferences_match_id_idx on public.chat_user_preferences (match_id);
create index if not exists queue_entries_match_id_idx on public.queue_entries (match_id);
create index if not exists message_requests_match_id_idx on public.message_requests (match_id);
create index if not exists gift_transfers_sender_id_idx on public.gift_transfers (sender_id);
create index if not exists gift_transfers_recipient_id_idx on public.gift_transfers (recipient_id);
create index if not exists subscription_gifts_sender_id_idx on public.subscription_gifts (sender_id);
create index if not exists connect_payments_subscription_id_idx on public.connect_payments (subscription_id);

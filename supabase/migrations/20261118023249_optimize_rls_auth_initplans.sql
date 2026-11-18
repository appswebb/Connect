drop policy if exists "Users can read own coin orders" on public.coin_orders;
create policy "Users can read own coin orders"
on public.coin_orders for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can view relationships involving them" on public.follows;
create policy "Users can view relationships involving them"
on public.follows for select to authenticated
using ((select auth.uid()) = follower_id or (select auth.uid()) = followed_id);

drop policy if exists "Users can view gifts they sent or received" on public.gift_transfers;
create policy "Users can view gifts they sent or received"
on public.gift_transfers for select to authenticated
using ((select auth.uid()) = sender_id or (select auth.uid()) = recipient_id);

drop policy if exists "guest can request own live seat" on public.live_guest_requests;
create policy "guest can request own live seat"
on public.live_guest_requests for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and status = 'pending'
  and exists (
    select 1 from public.live_sessions s
    where s.id = live_guest_requests.live_id and s.status = 'live'
  )
);

drop policy if exists "host can manage guest requests" on public.live_guest_requests;
create policy "host can manage guest requests"
on public.live_guest_requests for update to authenticated
using (
  exists (
    select 1 from public.live_sessions s
    where s.id = live_guest_requests.live_id
      and s.host_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.live_sessions s
    where s.id = live_guest_requests.live_id
      and s.host_user_id = (select auth.uid())
  )
);

drop policy if exists "requester and host can view guest requests" on public.live_guest_requests;
create policy "requester and host can view guest requests"
on public.live_guest_requests for select to authenticated
using (
  (select auth.uid()) = user_id
  or exists (
    select 1 from public.live_sessions s
    where s.id = live_guest_requests.live_id
      and s.host_user_id = (select auth.uid())
  )
);

drop policy if exists "requester can cancel pending request" on public.live_guest_requests;
create policy "requester can cancel pending request"
on public.live_guest_requests for delete to authenticated
using ((select auth.uid()) = user_id and status = 'pending');

drop policy if exists "requester can retry declined guest request" on public.live_guest_requests;
create policy "requester can retry declined guest request"
on public.live_guest_requests for update to authenticated
using ((select auth.uid()) = user_id and status = 'declined')
with check ((select auth.uid()) = user_id and status = 'pending');

drop policy if exists "Participants can read message requests" on public.message_requests;
create policy "Participants can read message requests"
on public.message_requests for select to authenticated
using ((select auth.uid()) = sender_id or (select auth.uid()) = recipient_id);

drop policy if exists "Users can view sent or received subscription gifts" on public.subscription_gifts;
create policy "Users can view sent or received subscription gifts"
on public.subscription_gifts for select to authenticated
using ((select auth.uid()) = sender_id or (select auth.uid()) = recipient_id);

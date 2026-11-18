drop policy if exists "Active CONNECT plans are readable" on public.connect_plans;
drop policy if exists "CONNECT monthly and annual package details are readable" on public.connect_plans;
create policy "CONNECT plans are readable"
on public.connect_plans for select to anon, authenticated
using (
  active = true
  or id = any (array['connect-monthly'::text, 'connect-annual'::text])
);

drop policy if exists "host can manage guest requests" on public.live_guest_requests;
drop policy if exists "requester can retry declined guest request" on public.live_guest_requests;
create policy "host or requester can update guest requests"
on public.live_guest_requests for update to authenticated
using (
  exists (
    select 1 from public.live_sessions s
    where s.id = live_guest_requests.live_id
      and s.host_user_id = (select auth.uid())
  )
  or (
    (select auth.uid()) = user_id
    and status = 'declined'
  )
)
with check (
  exists (
    select 1 from public.live_sessions s
    where s.id = live_guest_requests.live_id
      and s.host_user_id = (select auth.uid())
  )
  or (
    (select auth.uid()) = user_id
    and status = 'pending'
  )
);

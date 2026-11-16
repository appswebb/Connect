drop policy if exists "CONNECT monthly and annual package details are readable" on public.connect_plans;
create policy "CONNECT monthly and annual package details are readable"
on public.connect_plans
for select
to anon, authenticated
using (id in ('connect-monthly', 'connect-annual'));
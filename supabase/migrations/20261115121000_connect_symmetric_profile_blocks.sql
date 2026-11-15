drop policy if exists "authenticated users can read profiles" on public.profiles;
create policy "authenticated users can read profiles"
on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or (
    is_demo = false
    and not exists (
      select 1 from public.user_blocks b
      where (b.blocker_id = profiles.id and b.blocked_id = (select auth.uid()))
         or (b.blocker_id = (select auth.uid()) and b.blocked_id = profiles.id)
    )
  )
);
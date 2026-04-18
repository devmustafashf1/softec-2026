-- ============================================================
--  Fix: infinite recursion in profiles RLS policies
--  Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Drop the two self-referencing admin policies
drop policy if exists "admins: read all profiles"   on public.profiles;
drop policy if exists "admins: update any profile"  on public.profiles;

-- Security-definer function reads the caller's role directly,
-- bypassing RLS so it never re-triggers the policy.
create or replace function public.get_my_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role::text from public.profiles where id = auth.uid();
$$;

-- Recreate the admin policies using the function instead of a subquery
create policy "admins: read all profiles"
  on public.profiles
  for select
  using (public.get_my_role() = 'admin');

create policy "admins: update any profile"
  on public.profiles
  for update
  using (public.get_my_role() = 'admin');

-- ============================================================
--  Migration: Add client-user fields to profiles
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Add username column (unique, used for client portal login)
alter table public.profiles
  add column if not exists username       text unique,
  add column if not exists total_balance  numeric(12,2) default 0,
  add column if not exists amount_paid    numeric(12,2) default 0,
  add column if not exists next_review    text,
  add column if not exists account_status text default 'CURRENT';

-- Update the handle_new_user trigger to also capture username
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, company_name, industry, username)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(
      (new.raw_user_meta_data ->> 'role')::user_role,
      'agent'
    ),
    new.raw_user_meta_data ->> 'company_name',
    new.raw_user_meta_data ->> 'industry',
    new.raw_user_meta_data ->> 'username'
  );
  return new;
end;
$$;

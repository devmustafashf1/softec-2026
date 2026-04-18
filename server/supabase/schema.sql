-- ============================================================
--  DebtFlow Admin — Supabase Schema
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Enums ───────────────────────────────────────────────────
create type user_role as enum ('admin', 'agent', 'client');

-- ── Profiles ────────────────────────────────────────────────
-- One row per Supabase Auth user. Extends auth.users with
-- app-specific fields. id is a foreign key to auth.users.
create table public.profiles (
  id            uuid        primary key references auth.users(id) on delete cascade,
  role          user_role   not null default 'agent',
  full_name     text,
  company_name  text,
  industry      text,
  phone         text,
  avatar_url    text,
  is_active     boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── updated_at trigger ──────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ── Auto-create profile on sign-up ──────────────────────────
-- When a user registers via Supabase Auth, this trigger
-- automatically inserts a row into profiles.
-- Extra metadata (full_name, role, etc.) is passed via
-- signUp({ data: { full_name, role, company_name, industry } })
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer          -- runs as DB owner, can bypass RLS
set search_path = public  -- security best practice
as $$
begin
  insert into public.profiles (id, full_name, role, company_name, industry)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(
      (new.raw_user_meta_data ->> 'role')::user_role,
      'agent'
    ),
    new.raw_user_meta_data ->> 'company_name',
    new.raw_user_meta_data ->> 'industry'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Row-Level Security ───────────────────────────────────────
alter table public.profiles enable row level security;

-- Users can always read their own profile
create policy "users: read own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Users can update their own profile (but NOT change their role)
create policy "users: update own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    -- prevent self-promotion: role must stay the same
    and role = (select role from public.profiles where id = auth.uid())
  );

-- Admins can read ALL profiles
create policy "admins: read all profiles"
  on public.profiles
  for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can update any profile (including changing roles)
create policy "admins: update any profile"
  on public.profiles
  for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ── Helper view (optional but useful) ───────────────────────
-- Joins auth.users email with profiles so you get one clean row
create or replace view public.users_view as
  select
    p.id,
    u.email,
    p.role,
    p.full_name,
    p.company_name,
    p.industry,
    p.phone,
    p.avatar_url,
    p.is_active,
    p.created_at,
    p.updated_at
  from public.profiles p
  join auth.users u on u.id = p.id;

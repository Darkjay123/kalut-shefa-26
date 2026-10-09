-- Kalut-Shefa '26 · run this once in Supabase > SQL Editor
create extension if not exists pgcrypto;

create table if not exists public.visits (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  visitor_id text, is_new boolean, path text, referrer text, device text, user_agent text, utm_source text
);
create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  phone text check (char_length(phone) <= 40),
  email text check (char_length(email) <= 160),
  attending text not null check (attending in ('yes','no')),
  events text[] not null default '{}',
  guests int not null default 1 check (guests between 0 and 10),
  side text check (side in ('groom','bride','both')),
  message text check (char_length(message) <= 1000),
  visitor_id text
);
create table if not exists public.gifts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text, email text, amount_kobo bigint check (amount_kobo > 0), reference text unique, note text check (char_length(note) <= 200), status text default 'paid_client'
);
create table if not exists public.admins ( email text primary key );

alter table public.visits enable row level security;
alter table public.rsvps  enable row level security;
alter table public.gifts  enable row level security;
alter table public.admins enable row level security;

-- Guests (anon) can only ADD rows, never read them.
create policy "guests add visits" on public.visits for insert to anon, authenticated with check (true);
create policy "guests add rsvps"  on public.rsvps  for insert to anon, authenticated with check (true);
create policy "guests add gifts"  on public.gifts  for insert to anon, authenticated with check (true);

-- Only signed-in emails listed in public.admins can read.
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.admins where lower(email) = lower(auth.jwt() ->> 'email')) $$;
create policy "admins read visits" on public.visits for select to authenticated using (public.is_admin());
create policy "admins read rsvps"  on public.rsvps  for select to authenticated using (public.is_admin());
create policy "admins read gifts"  on public.gifts  for select to authenticated using (public.is_admin());
create policy "admins delete rsvps" on public.rsvps for delete to authenticated using (public.is_admin());
create policy "admins see admins" on public.admins for select to authenticated using (public.is_admin());

-- Who can open the admin portal (add Elijah's email too):
insert into public.admins (email) values ('enechukwujohn11@gmail.com') on conflict do nothing;

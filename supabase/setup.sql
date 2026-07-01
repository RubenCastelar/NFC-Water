create extension if not exists pgcrypto;

create table if not exists public.water_entries (
  id uuid primary key default gen_random_uuid(),
  profile_id text not null,
  amount_ml integer not null check (amount_ml = 600),
  source text not null check (source in ('nfc', 'manual')),
  created_at timestamptz not null default now()
);

create index if not exists water_entries_profile_created_at_idx
  on public.water_entries (profile_id, created_at desc);

alter table public.water_entries enable row level security;

drop policy if exists "water entries select personal profile" on public.water_entries;
create policy "water entries select personal profile"
on public.water_entries
for select
to anon
using (profile_id = 'agua-personal-bf4f2e8d9a0647d8b7e0cfe6b0f4c7a1');

drop policy if exists "water entries insert personal profile" on public.water_entries;
create policy "water entries insert personal profile"
on public.water_entries
for insert
to anon
with check (
  profile_id = 'agua-personal-bf4f2e8d9a0647d8b7e0cfe6b0f4c7a1'
  and amount_ml = 600
  and source in ('nfc', 'manual')
);

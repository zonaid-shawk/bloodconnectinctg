create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) >= 2),
  phone text,
  blood_group text check (
    blood_group is null or blood_group in (
      'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
    )
  ),
  district text,
  upazila text,
  address text,
  date_of_birth date,
  gender text check (
    gender is null or gender in (
      'Female', 'Male', 'Non-binary', 'Prefer not to say'
    )
  ),
  whatsapp_contact_consent boolean not null default false,
  last_donation_date date,
  availability boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_available_donors_search_idx
  on public.profiles (blood_group, district, upazila)
  where availability is true and whatsapp_contact_consent is true;

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can create own profile" on public.profiles;
create policy "Users can create own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

revoke all on public.profiles from public, anon;
grant select, insert, update on public.profiles to authenticated;

create or replace view public.available_donors
with (security_invoker = false)
as
select
  id,
  full_name,
  phone,
  blood_group,
  district,
  upazila,
  availability
from public.profiles
where availability is true
  and whatsapp_contact_consent is true
  and phone is not null;

revoke all on public.available_donors from public, anon;
grant select on public.available_donors to authenticated;

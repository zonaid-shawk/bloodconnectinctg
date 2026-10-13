alter table public.profiles
  add column if not exists date_of_birth date,
  add column if not exists gender text,
  add column if not exists whatsapp_contact_consent boolean,
  add column if not exists last_donation_date date;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can create own profile'
  ) then
    create policy "Users can create own profile"
      on public.profiles
      for insert
      to authenticated
      with check (auth.uid() = id);
  end if;
end
$$;

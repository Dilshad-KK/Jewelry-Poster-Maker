-- Supabase SQL setup for this app

-- 1) Rates table
create table if not exists public.rates (
  date date primary key,
  per_gram numeric not null,
  per_gram_18k numeric,
  per_gram_9k numeric,
  per_sovereign numeric not null,
  image_url text,
  shop_name text,
  shop_address text,
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- If you already created the table earlier, run these to add the new columns:
alter table if exists public.rates
  add column if not exists per_gram_18k numeric;
alter table if exists public.rates
  add column if not exists per_gram_9k numeric;

-- Trigger to auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_rates_updated_at on public.rates;
create trigger trg_rates_updated_at
before update on public.rates
for each row execute function public.set_updated_at();

-- 2) Storage bucket for uploads
-- Run from the Supabase SQL editor or create via Dashboard -> Storage -> New bucket
-- Make the bucket public if you want public URLs to work without signed URLs
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

-- 4) Site settings for theme/colors
create table if not exists public.site_settings (
  id text primary key default 'default',
  theme text check (theme in ('classic','overlay')) default 'classic',
  primary_color text,
  accent_color text,
  bg_color text,
  logo_url text,
  updated_at timestamptz not null default now()
);

-- 3) RLS (optional; API uses service role)
-- If you want to allow anon read of latest rate without service role, enable RLS and set policies:
-- alter table public.rates enable row level security;
-- create policy "Allow read to anon" on public.rates for select to public using (true);

create extension if not exists pgcrypto;

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  coupon text not null,
  url text not null,
  default_commission numeric(5,2) not null check (default_commission >= 0 and default_commission <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.brand_commissions (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  month_start date not null,
  commission_rate numeric(5,2) not null check (commission_rate >= 0 and commission_rate <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, month_start),
  check (extract(day from month_start) = 1)
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  sale_amount numeric(12,2) not null check (sale_amount > 0),
  commission_rate numeric(5,2) not null check (commission_rate >= 0 and commission_rate <= 100),
  commission_amount numeric(12,2) generated always as (round(sale_amount * commission_rate / 100, 2)) stored,
  sold_at date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.publications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  format text not null check (format in ('story', 'reel')),
  platform text not null check (platform in ('instagram', 'tiktok')),
  published_at date not null,
  created_at timestamptz not null default now()
);

create index if not exists brands_user_id_idx on public.brands(user_id);
create index if not exists brand_commissions_month_idx on public.brand_commissions(month_start);
create index if not exists sales_user_date_idx on public.sales(user_id, sold_at);
create index if not exists sales_brand_date_idx on public.sales(brand_id, sold_at);
create index if not exists publications_user_date_idx on public.publications(user_id, published_at);
create index if not exists publications_brand_date_idx on public.publications(brand_id, published_at);

alter table public.brands enable row level security;
alter table public.brand_commissions enable row level security;
alter table public.sales enable row level security;
alter table public.publications enable row level security;

create policy "Users manage their own brands"
on public.brands for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users manage commissions for their brands"
on public.brand_commissions for all
using (exists (
  select 1 from public.brands b
  where b.id = brand_id and b.user_id = auth.uid()
))
with check (exists (
  select 1 from public.brands b
  where b.id = brand_id and b.user_id = auth.uid()
));

create policy "Users manage their own sales"
on public.sales for all
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (select 1 from public.brands b where b.id = brand_id and b.user_id = auth.uid())
);

create policy "Users manage their own publications"
on public.publications for all
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (select 1 from public.brands b where b.id = brand_id and b.user_id = auth.uid())
);

-- Seed the current month's commission for every brand. Future months are initialized
-- lazily by the application from the brand's default_commission.
insert into public.brand_commissions (brand_id, month_start, commission_rate)
select id, date_trunc('month', current_date)::date, default_commission
from public.brands
on conflict (brand_id, month_start) do nothing;

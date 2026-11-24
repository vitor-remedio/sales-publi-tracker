-- Add the affiliate sales/publications features to the existing tracker schema.
-- This migration is intentionally additive: it preserves brands, coupons, campaigns,
-- payments and all existing records.

alter table public.brands
  add column if not exists coupon text not null default '',
  add column if not exists url text not null default '',
  add column if not exists default_commission numeric(5,2) not null default 0;

update public.brands
set default_commission = coalesce(default_commission_percent, default_commission, 0);

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

alter table public.sales
  alter column coupon_id drop not null,
  alter column gross_amount_cents set default 0,
  add column if not exists brand_id uuid references public.brands(id) on delete cascade,
  add column if not exists sale_amount numeric(12,2) not null default 0,
  add column if not exists commission_rate numeric(5,2) not null default 0;

alter table public.sales
  add column if not exists commission_amount numeric(12,2)
  generated always as (round(sale_amount * commission_rate / 100, 2)) stored;

create index if not exists sales_brand_id_sold_at_idx on public.sales(brand_id, sold_at);
create index if not exists brand_commissions_month_idx on public.brand_commissions(month_start);

drop policy if exists "owner full access" on public.sales;
create policy "Users manage sales for their own brands"
on public.sales for all
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and (
    brand_id is null
    or exists (
      select 1 from public.brands b
      where b.id = brand_id and b.user_id = (select auth.uid())
    )
  )
);

alter table public.brand_commissions enable row level security;
create policy "Users manage commissions for their brands"
on public.brand_commissions for all
to authenticated
using (exists (
  select 1 from public.brands b
  where b.id = brand_commissions.brand_id and b.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.brands b
  where b.id = brand_commissions.brand_id and b.user_id = (select auth.uid())
));

create table if not exists public.publications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  format text not null check (format in ('story', 'reel')),
  platform text not null check (platform in ('instagram', 'tiktok')),
  published_at date not null,
  created_at timestamptz not null default now()
);

create index if not exists publications_user_date_idx on public.publications(user_id, published_at);
create index if not exists publications_brand_date_idx on public.publications(brand_id, published_at);

alter table public.publications enable row level security;
create policy "Users manage their own publications"
on public.publications for all
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.brands b
    where b.id = brand_id and b.user_id = (select auth.uid())
  )
);

-- New public-schema tables require explicit Data API grants in current Supabase projects.
grant select, insert, update, delete on public.brand_commissions to authenticated;
grant select, insert, update, delete on public.publications to authenticated;

-- Initialize the current month's rate from each brand's default.
insert into public.brand_commissions (brand_id, month_start, commission_rate)
select id, date_trunc('month', timezone('America/Sao_Paulo', now()))::date, default_commission
from public.brands
on conflict (brand_id, month_start) do nothing;

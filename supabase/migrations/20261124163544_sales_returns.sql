-- Mark returned sales so they remain visible in history but are excluded from financial totals.
alter table public.sales
  add column if not exists is_return boolean not null default false;

create index if not exists sales_brand_sold_at_idx
  on public.sales (brand_id, sold_at);

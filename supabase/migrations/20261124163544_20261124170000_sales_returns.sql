-- Mark returned sales so they remain visible in history but are excluded from financial totals.
alter table public.sales
  add column if not exists is_return boolean not null default false;

-- This index was part of the initial rollout, but the previous migration already
-- created an equivalent index (sales_brand_id_sold_at_idx). Keep the final schema
-- free of duplicate indexes.
create index if not exists sales_brand_sold_at_idx
  on public.sales (brand_id, sold_at);
drop index if exists public.sales_brand_sold_at_idx;

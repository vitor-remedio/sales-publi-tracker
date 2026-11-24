-- Mark returned sales so they remain visible in history but are excluded from financial totals.
alter table public.sales
  add column if not exists is_return boolean not null default false;

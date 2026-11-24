-- ============================================================
-- Sales & Publi Tracker: initial schema
-- Money is stored in cents (integer). Every row belongs to a user.
-- ============================================================

create type public.campaign_status as enum ('contracted', 'delivered', 'cancelled');
create type public.payment_kind    as enum ('fixed_fee', 'commission');
create type public.payment_status  as enum ('pending', 'received');

-- Keeps updated_at in sync on every update
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- brands ----------
create table public.brands (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  contact text,
  default_commission_percent numeric(5,2) check (default_commission_percent between 0 and 100),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- campaigns (publis) ----------
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete restrict,
  title text not null,
  status public.campaign_status not null default 'contracted',
  fixed_fee_cents integer not null default 0 check (fixed_fee_cents >= 0),
  contracted_at date,
  due_date date,
  delivered_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- coupons ----------
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete restrict,
  code text not null,
  discount_percent numeric(5,2) check (discount_percent between 0 and 100),
  commission_percent numeric(5,2) check (commission_percent between 0 and 100),
  valid_until date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, code)
);

-- ---------- sales (by coupon) ----------
create table public.sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  coupon_id uuid not null references public.coupons(id) on delete restrict,
  sold_at date not null,
  gross_amount_cents integer not null check (gross_amount_cents >= 0),
  commission_cents integer not null default 0 check (commission_cents >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- payments ----------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete restrict,
  campaign_id uuid references public.campaigns(id) on delete set null,
  kind public.payment_kind not null,
  reference_month date,            -- first day of the month (for commissions)
  amount_cents integer not null check (amount_cents >= 0),
  status public.payment_status not null default 'pending',
  expected_date date,
  received_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- indexes ----------
create index on public.brands    (user_id);
create index on public.campaigns (user_id, status);
create index on public.campaigns (brand_id);
create index on public.coupons   (user_id);
create index on public.coupons   (brand_id);
create index on public.sales     (user_id, sold_at);
create index on public.sales     (coupon_id);
create index on public.payments  (user_id, status);
create index on public.payments  (brand_id);

-- ---------- updated_at triggers ----------
create trigger set_updated_at before update on public.brands    for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.campaigns for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.coupons   for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.sales     for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.payments  for each row execute function public.set_updated_at();

-- ---------- RLS + grants + policies ----------
-- New tables are not exposed to the API automatically, so we grant explicitly.
do $$
declare t text;
begin
  foreach t in array array['brands','campaigns','coupons','sales','payments']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format(
      'create policy "owner full access" on public.%I
         for all to authenticated
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;
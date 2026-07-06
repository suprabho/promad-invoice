-- Billing entities — the "billed from" side of an invoice.
--
-- The app ships with a built-in PROMAD entity, so it works without this
-- table. Create the table to add and persist additional entities via the
-- "Add Entity" dialog. Each invoice stores a snapshot of its entity, so the
-- `entities` rows are only used to populate the picker and the dialog.
--
-- The per-invoice snapshot lives in an `entity` column on the `invoices`
-- table — see `invoices-entity.sql`, which you must run for saving invoices
-- to work at all (this table is optional; that migration is not).
--
-- Columns are quoted to preserve camelCase so they map 1:1 to the JS entity
-- object keys the Supabase client inserts/selects (accountNo, brandColor, …).
--
-- Safe to re-run. `create table if not exists` is a no-op on an existing
-- table, so it will NOT add columns to an `entities` table you created from
-- an earlier version of this file — leaving it missing newer columns. Adding
-- an entity then fails with, e.g.:
--   Could not find the 'accountNo' column of 'entities' in the schema cache
-- The `add column if not exists` statements below heal such a table, and the
-- `notify pgrst` at the end refreshes PostgREST's schema cache immediately.

create table if not exists entities (
  id            text primary key default gen_random_uuid()::text,
  "name"        text not null,
  "logo"        text,                      -- 'promad' for the built-in SVG; null = text wordmark
  "brandColor"  text default '#EDEA00',
  "accountNo"   text,
  "accountType" text default 'Current',
  "bank"        text,
  "ifsc"        text,
  "gstin"       text,
  "pan"         text,
  created_at    timestamptz default now()
);

-- Heal a pre-existing table that predates any of these columns (notably
-- "accountNo", which the "Add Entity" dialog always writes). Each statement
-- is a no-op when the column is already present.
alter table entities add column if not exists "logo"        text;
alter table entities add column if not exists "brandColor"  text default '#EDEA00';
alter table entities add column if not exists "accountNo"   text;
alter table entities add column if not exists "accountType" text default 'Current';
alter table entities add column if not exists "bank"        text;
alter table entities add column if not exists "ifsc"        text;
alter table entities add column if not exists "gstin"       text;
alter table entities add column if not exists "pan"         text;
alter table entities add column if not exists created_at    timestamptz default now();

-- Match the clients table's access model (anon key + RLS as configured for
-- this project). Adjust policies to suit your security requirements. Policies
-- are dropped first so re-running this file doesn't error on "already exists".
alter table entities enable row level security;

drop policy if exists "entities are readable" on entities;
create policy "entities are readable" on entities
  for select using (true);

drop policy if exists "entities are insertable" on entities;
create policy "entities are insertable" on entities
  for insert with check (true);

-- Ask PostgREST to refresh its schema cache immediately so the table and its
-- columns are usable without waiting for the periodic reload (this is what the
-- "schema cache" error above is complaining about).
notify pgrst, 'reload schema';

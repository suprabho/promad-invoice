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
-- NOTE: `create table if not exists` is a no-op if an `entities` table already
-- exists, so it will NOT overwrite an older, drifted schema. If a pre-existing
-- table has a stray NOT NULL `type` column, adding an entity fails with
-- "null value in column \"type\" ... violates not-null constraint" — run
-- `entities-type-fix.sql` (the reconciliation at the end of this file mirrors
-- it, so re-running this whole file heals an existing table too).

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
-- this project). Adjust policies to suit your security requirements.
-- Dropped-then-created so the whole file stays safe to re-run (plain
-- `create policy` errors if the policy already exists).
alter table entities enable row level security;

drop policy if exists "entities are readable" on entities;
create policy "entities are readable" on entities
  for select using (true);

drop policy if exists "entities are insertable" on entities;
create policy "entities are insertable" on entities
  for insert with check (true);

-- Reconcile a pre-existing table that carries a stray NOT NULL `type` column
-- the app never writes (see entities-type-fix.sql for the full rationale).
-- Allowing NULL lets inserts that omit `type` succeed; no-op on a clean table.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'entities'
      and column_name = 'type'
  ) then
    alter table entities alter column "type" drop not null;
  end if;
end $$;

-- Refresh PostgREST's schema cache so the reconciliation takes effect at once.
notify pgrst, 'reload schema';

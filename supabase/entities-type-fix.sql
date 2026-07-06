-- Reconcile a pre-existing `entities` table that carries a stray, NOT NULL
-- `type` column the app never writes.
--
-- Symptom — adding a billing entity fails with:
--   null value in column "type" of relation "entities" violates not-null constraint
--
-- Cause — `entities.sql` uses `create table if not exists`, so if an
-- `entities` table already existed in your Supabase project (from an earlier
-- schema or another tool), that migration was a silent no-op and the existing
-- table was kept. That table has a `type` column marked NOT NULL with no
-- default. The app inserts only the name / account / bank / GSTIN / PAN / brand
-- fields — it has no concept of an entity "type" (in this app `type` is a
-- domestic/export attribute of *invoices*, not entities) — so `type` resolves
-- to NULL on insert and Postgres rejects the row.
--
-- Fix — drop the NOT NULL constraint on `type` so the omitted column is
-- allowed to be NULL. We deliberately do NOT guess a default value: the
-- column's valid values are unknown and a bad default could violate a CHECK
-- constraint. Allowing NULL is the safe, non-destructive reconciliation — the
-- column and any data in it are left untouched. Guarded so it only runs if the
-- column exists, making it a harmless no-op on a table created cleanly from
-- `entities.sql` (which has no `type` column).
--
-- Run this once in the Supabase SQL editor. Safe to re-run.

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

-- Refresh PostgREST's schema cache immediately so the change takes effect
-- without waiting for the periodic reload.
notify pgrst, 'reload schema';

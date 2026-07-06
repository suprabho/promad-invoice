-- ============================================================================
-- promad-invoice → dedicated `invoicing` Postgres schema
-- ============================================================================
--
-- WHY THIS EXISTS
-- promad-invoice shares a Supabase project (one database) with Footshorts (the
-- `vismay` repo). Both apps used to create a table called `entities` in the
-- default `public` schema, but with completely incompatible shapes:
--
--   • promad     → billing entities  (name, brandColor, accountNo, gstin, pan…)
--   • Footshorts → leagues/teams/players (type, slug, football_data_id, …)
--
-- Footshorts' schema is large and established, so its `entities` table owns the
-- name in `public`. promad's `create table if not exists entities` then silently
-- did nothing, the app started reading Footshorts' rows, and every write to
-- `entities` failed with errors like:
--
--   Could not find the 'accountNo' column of 'entities' in the schema cache
--
-- THE FIX
-- Give promad its own `invoicing` schema so its tables can never collide with
-- Footshorts (or vizmaya) again. `public.entities` is left untouched — it still
-- belongs to Footshorts. The app's Supabase client is pointed at this schema:
--
--   createClient(url, key, { db: { schema: 'invoicing' } })   // src/utils/supabase.js
--
-- ⚠️  ONE MANUAL STEP (cannot be done from SQL):
-- Add `invoicing` to the project's exposed schemas so the API can see it:
--   Supabase dashboard → Project Settings → API → "Exposed schemas" → add `invoicing`
--   (CLI/config equivalent: [api] schemas = ["public", "graphql_public", "invoicing"])
-- Without this, requests fail with:
--   PGRST106  The schema must be one of the following: public, graphql_public
--
-- HOW TO RUN
-- Paste this whole file into the Supabase SQL editor and run it once. It is
-- idempotent and safe to re-run. It moves promad's existing `invoices` and
-- `clients` tables (with all their data, indexes and RLS policies) into the new
-- schema — it does not drop or recreate them.
-- ============================================================================

-- 1. The dedicated schema ----------------------------------------------------
create schema if not exists invoicing;

-- 2. Grant the Supabase API roles access (mirrors what `public` gets) --------
grant usage on schema invoicing to anon, authenticated, service_role;

-- Tables created later in this schema inherit these grants automatically.
alter default privileges in schema invoicing
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema invoicing
  grant all on sequences to anon, authenticated, service_role;

-- 3. Move promad's existing tables out of the shared `public` schema ---------
-- SET SCHEMA relocates the table in place, preserving ALL data, indexes, RLS
-- policies and the invoices.entity snapshot column. `if exists` keeps this safe
-- on a project that has not created these tables yet.
--
-- `public.entities` is deliberately NOT moved: that name belongs to Footshorts.
-- promad's own billing-entities table is created fresh in step 4.
alter table if exists public.invoices set schema invoicing;
alter table if exists public.clients  set schema invoicing;

-- 4. promad's billing entities — a fresh table in the new schema -------------
-- The "billed from" side of an invoice. Optional in practice: the app ships a
-- built-in PROMAD default and falls back to it if this table is absent, so it
-- only powers the "Add Entity" picker. Columns are quoted to preserve camelCase
-- so they map 1:1 to the JS object keys the client inserts/selects.
create table if not exists invoicing.entities (
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
  "hasGst"      boolean not null default true, -- GST-registered? false → issues Non-GST invoices
  created_at    timestamptz default now()
);

-- Backfill the GST flag on entities tables created before it existed. Defaults
-- to true so existing rows keep billing Domestic/Export as before.
alter table if exists invoicing.entities
  add column if not exists "hasGst" boolean not null default true;

alter table invoicing.entities enable row level security;

-- Permissive anon-key policies, matching the app's access model. Dropped first
-- so re-running this file does not error on "policy already exists".
drop policy if exists "entities are readable"   on invoicing.entities;
drop policy if exists "entities are insertable" on invoicing.entities;
create policy "entities are readable"   on invoicing.entities for select using (true);
create policy "entities are insertable" on invoicing.entities for insert with check (true);

-- 5. Ensure the per-invoice billing-entity snapshot column exists ------------
-- The app writes a snapshot of the chosen entity to invoices.entity (jsonb) so
-- historical invoices keep their details even if an entity is later edited.
-- No-ops if invoices was not present to be moved in step 3.
alter table if exists invoicing.invoices
  add column if not exists entity jsonb;

-- 6. Backfill grants for the moved tables + refresh the API schema cache -----
grant all on all tables    in schema invoicing to anon, authenticated, service_role;
grant all on all sequences in schema invoicing to anon, authenticated, service_role;

notify pgrst, 'reload schema';

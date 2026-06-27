-- Billing entities — the "billed from" side of an invoice.
--
-- The app ships with a built-in PROMAD entity, so it works without this
-- table. Create the table to add and persist additional entities via the
-- "Add Entity" dialog. Each invoice stores a snapshot of its entity, so the
-- `entities` rows are only used to populate the picker and the dialog.
--
-- Columns are quoted to preserve camelCase so they map 1:1 to the JS entity
-- object keys the Supabase client inserts/selects (accountNo, brandColor, …).

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

-- Match the clients table's access model (anon key + RLS as configured for
-- this project). Adjust policies to suit your security requirements.
alter table entities enable row level security;

create policy "entities are readable" on entities
  for select using (true);

create policy "entities are insertable" on entities
  for insert with check (true);

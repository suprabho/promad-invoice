# PROMAD Invoice Manager

## Start the app

```bash
cd invoicing-app
npm run dev
```

Then open → http://localhost:5173

This runs **both** the React frontend (Vite on port 5173) and the Express API server (port 3001) together.

---

## Invoice data

All invoices are stored in `data/invoices.json`. Includes the March 2026 invoice as seed data.

## Invoice number format

`MMYYNNNN` — e.g. `03260001` = first invoice of March 2026.
The next April invoice will auto-generate as `04260001`, and so on.

## Invoice types

- **Domestic** — IGST 18% is calculated and shown
- **Export** — No IGST; LUT # field appears instead

## Billing entities

Each invoice is billed *from* a **billing entity** (name, bank details, GSTIN,
PAN, brand colour). PROMAD ships as a built-in default, so nothing needs setup.

- Pick the entity from the **Billing Entity** dropdown when creating an invoice.
- Add more via **Add Entity** in the sidebar. New entities render their name as
  a text wordmark in the brand colour; PROMAD keeps its logo.
- Each invoice stores a snapshot of its entity, so older invoices keep their
  original billing details even if an entity is later changed.

Each invoice stores its entity snapshot in an `entity` column on the
`invoices` table. Run `supabase/invoices-entity.sql` once in the Supabase SQL
editor to add it — without it, saving an invoice fails with *"Could not find
the 'entity' column of 'invoices' in the schema cache."*

To persist added entities, also create the `entities` table in Supabase using
`supabase/entities.sql`. Without it the app still runs with the built-in
PROMAD entity.

If **Add Entity** fails with *"null value in column \"type\" of relation
\"entities\" violates not-null constraint"*, your project has an older
`entities` table with a stray `type` column that the app doesn't use (the
`create table if not exists` in `entities.sql` won't overwrite it). Run
`supabase/entities-type-fix.sql` once in the Supabase SQL editor to allow that
column to be NULL — it's non-destructive and safe to re-run.

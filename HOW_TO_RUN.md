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
- **Non-GST** — No IGST *and* no LUT; the total equals the subtotal

Which types are available depends on the billing entity's **GST registration**
(see below): GST-registered entities issue *Domestic* or *Export* invoices,
while non-GST entities issue *Non-GST* invoices only.

## Billing entities

Each invoice is billed *from* a **billing entity** (name, bank details, GSTIN,
PAN, brand colour, GST registration). PROMAD ships as a built-in default, so
nothing needs setup.

- Pick the entity from the **Billing Entity** dropdown when creating an invoice.
- Add more via **Add Entity** in the sidebar. New entities render their name as
  a text wordmark in the brand colour; PROMAD keeps its logo.
- Toggle **GST registered** when adding an entity. Registered entities bill
  Domestic (IGST) / Export (LUT); unregistered entities bill Non-GST invoices
  with neither, and their GSTIN field is hidden. Defaults to on.
- Each invoice stores a snapshot of its entity, so older invoices keep their
  original billing details even if an entity is later changed.

Each invoice stores its entity snapshot in an `entity` column on the
`invoices` table (see the database setup below).

## Database (Supabase)

This app shares its Supabase project (one database) with **Footshorts** (the
`vismay` repo). To keep the two apps' tables from colliding — both otherwise
define a `public.entities` table, with incompatible shapes — all of promad's
tables live in a dedicated **`invoicing`** Postgres schema.

**Setup (run once):**

1. In the Supabase **SQL editor**, paste and run
   [`supabase/invoicing-schema.sql`](supabase/invoicing-schema.sql). It creates
   the `invoicing` schema, moves the existing `invoices`/`clients` tables into
   it (preserving all data), creates the billing `entities` table, ensures the
   per-invoice `entity` snapshot column, and allows the **Non-GST** invoice
   type on the `invoices` table. It's idempotent — safe to re-run.
2. In **Project Settings → API → "Exposed schemas"**, add `invoicing` and save.
   This is required for the API to see the schema; without it requests fail with
   *"PGRST106 — The schema must be one of the following: public, graphql_public."*

The Supabase client is pointed at this schema in `src/utils/supabase.js`
(`db: { schema: 'invoicing' }`), so all queries resolve to `invoicing.*`.

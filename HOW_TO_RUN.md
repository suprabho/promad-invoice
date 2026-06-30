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

To persist added entities, create the `entities` table in Supabase using
`supabase/entities.sql`. Without it the app still runs with the built-in
PROMAD entity.

-- Add the per-invoice billing-entity snapshot column.
--
-- The "multiple billing entities" feature stores a *snapshot* of the chosen
-- entity on every invoice (see InvoiceForm.jsx / resolveEntity in
-- utils/entities.js), so historical invoices keep their original billing
-- details even if the entity is later edited or removed. The Supabase client
-- writes this snapshot as the `entity` key of the invoice row.
--
-- Without this column, creating or updating an invoice fails with:
--   Could not find the 'entity' column of 'invoices' in the schema cache
--
-- Run this once in the Supabase SQL editor. It's safe to re-run: the column
-- is only added if missing, and existing invoices keep NULL (resolveEntity
-- falls back to the built-in PROMAD default for them).

alter table invoices
  add column if not exists entity jsonb;

-- Ask PostgREST to refresh its schema cache immediately so the new column is
-- usable without waiting for the periodic reload (this is what the error above
-- is complaining about).
notify pgrst, 'reload schema';

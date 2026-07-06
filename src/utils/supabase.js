import { createClient } from '@supabase/supabase-js'

// promad-invoice shares its Supabase project (database) with Footshorts (the
// `vismay` repo). To stop promad's tables colliding with Footshorts' — both
// apps otherwise define a `public.entities` table, with incompatible shapes —
// all of promad's tables live in a dedicated `invoicing` Postgres schema.
//
// Pointing the client here makes every .from('invoices' | 'clients' |
// 'entities') resolve to invoicing.* instead of public.*. The schema must also
// be added to the project's exposed schemas in the Supabase dashboard
// (Project Settings → API → "Exposed schemas"). See supabase/invoicing-schema.sql.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { db: { schema: 'invoicing' } },
)

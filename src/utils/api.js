import { supabase } from './supabase'
import { DEFAULT_ENTITIES } from './entities'

export async function fetchInvoiceList() {
  const { data, error } = await supabase
    .from('invoices')
    .select('id, date, type, client, total')
    .order('id')
  if (error) throw new Error(error.message)
  return data.map(({ id, date, type, client, total }) => ({
    id, date, type, clientName: client.name, total,
  }))
}

export async function fetchInvoice(id) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw new Error('Invoice not found')
  return data
}

export async function createInvoice(invoice) {
  const { data, error } = await supabase
    .from('invoices')
    .insert(invoice)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateInvoice(id, invoice) {
  const { data, error } = await supabase
    .from('invoices')
    .update(invoice)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteInvoice(id) {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
  return { success: true }
}

// ── Clients ──

export async function fetchClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name')
  if (error) throw new Error(error.message)
  return data
}

export async function createClient(client) {
  const { data, error } = await supabase
    .from('clients')
    .insert(client)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

// ── Billing entities ──

// Built-in defaults are always available; entities stored in Supabase are
// merged on top (keyed by id). If the `entities` table is missing we fall
// back to defaults so the app keeps working with zero setup.
export async function fetchEntities() {
  const { data, error } = await supabase
    .from('entities')
    .select('*')
    .order('name')
  if (error || !data) return DEFAULT_ENTITIES
  const byId = new Map(DEFAULT_ENTITIES.map(e => [e.id, e]))
  for (const e of data) byId.set(e.id, e)
  return [...byId.values()]
}

export async function createEntity(entity) {
  const { data, error } = await supabase
    .from('entities')
    .insert(entity)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

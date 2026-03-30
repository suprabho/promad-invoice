import { supabase } from './supabase'

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

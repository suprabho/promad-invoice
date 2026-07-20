import { entityCode } from './entities'

/**
 * Invoice number format: CCMMYYNNNN
 * CC   = billing entity's code    (see entityCode in entities.js)
 * MM   = invoice month (2 digits, zero-padded)
 * YY   = invoice year  (2 digits)
 * NNNN = sequential index within that entity + month/year (4 digits, zero-padded)
 *
 * Each entity keeps its OWN series: the index is scoped to the entity (not
 * shared across all invoices) and each entity's first bill of a month starts
 * at 0000.
 *
 * Example: PROMAD's (code "PM") first invoice of April 2026 → "PM04260000",
 * its next → "PM04260001"; a second entity issues its own "AB04260000".
 */

export function generateInvoiceId(month, year, existingInvoices, entity) {
  const mm = String(month).padStart(2, '0')
  const yy = String(year).slice(-2)
  const code = entityCode(entity)
  const prefix = `${code}${mm}${yy}`

  // Find the highest existing index for THIS entity + month/year. Because the
  // entity code is baked into the prefix, this isolates each entity's series
  // even though the list rows carry no separate entity field.
  const sameSeries = existingInvoices
    .map(inv => inv.id)
    .filter(id => typeof id === 'string' && id.startsWith(prefix))

  // First bill of the month for an entity starts at 0.
  let nextIndex = 0
  if (sameSeries.length > 0) {
    const indices = sameSeries
      .map(id => parseInt(id.slice(prefix.length), 10))
      .filter(n => !Number.isNaN(n))
    if (indices.length > 0) nextIndex = Math.max(...indices) + 1
  }

  return `${prefix}${String(nextIndex).padStart(4, '0')}`
}

export function formatInvoiceDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getTodayISO() {
  return new Date().toISOString().split('T')[0]
}

export function getMonthYear(dateString) {
  const d = new Date(dateString)
  return { month: d.getMonth() + 1, year: d.getFullYear() }
}

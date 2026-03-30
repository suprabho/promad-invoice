/**
 * Invoice number format: MMYYNNNN
 * MM   = invoice month (2 digits, zero-padded)
 * YY   = invoice year  (2 digits)
 * NNNN = sequential index for that month/year (4 digits, zero-padded)
 *
 * Example: first invoice of April 2026 → "04260001"
 */

export function generateInvoiceId(month, year, existingInvoices) {
  const mm = String(month).padStart(2, '0')
  const yy = String(year).slice(-2)
  const prefix = `${mm}${yy}`

  // Find the highest existing index for this month/year
  const sameMonth = existingInvoices
    .map(inv => inv.id)
    .filter(id => id.startsWith(prefix))

  let nextIndex = 1
  if (sameMonth.length > 0) {
    const indices = sameMonth.map(id => parseInt(id.slice(4), 10))
    nextIndex = Math.max(...indices) + 1
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

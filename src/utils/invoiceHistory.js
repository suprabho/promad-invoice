/**
 * Shaping the sidebar's invoice history: filter by billing entity, then bucket
 * into months.
 *
 * The history list grows without bound (every invoice ever issued), so it is
 * grouped by month and filterable by the entity that issued each bill. Both
 * work off the *summary* rows returned by fetchInvoiceList — no full invoice
 * is loaded to build the list.
 */

import { invoiceEntityCode, invoiceEntityName } from './entities'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/**
 * Sortable month bucket key ("2026-03") for an invoice.
 *
 * Read straight off the ISO date string rather than via `new Date()`: dates are
 * stored date-only, which parses as UTC midnight and would slide into the
 * previous month for anyone west of UTC on the 1st. Returns '' when the date is
 * missing or malformed, which buckets the invoice under "Undated".
 */
export function invoiceMonthKey(invoice) {
  const m = String(invoice?.date || '').match(/^(\d{4})-(\d{2})/)
  if (!m) return ''
  return `${m[1]}-${m[2]}`
}

/** "2026-03" → "March 2026". */
export function monthLabel(key) {
  const [year, month] = String(key).split('-')
  const name = MONTH_NAMES[Number(month) - 1]
  return name ? `${name} ${year}` : 'Undated'
}

/**
 * The distinct billing entities present in a list of invoices, as filter
 * options: `{ code, name, count }`, ordered by how many invoices each issued
 * (then by code) so the entity billed most often leads.
 */
export function entityFilterOptions(invoices, entities = []) {
  const byCode = new Map()
  for (const inv of invoices) {
    const code = invoiceEntityCode(inv)
    const existing = byCode.get(code)
    if (existing) existing.count += 1
    else byCode.set(code, { code, name: invoiceEntityName(inv, entities), count: 1 })
  }
  return [...byCode.values()].sort(
    (a, b) => b.count - a.count || a.code.localeCompare(b.code)
  )
}

/**
 * Filter by entity code (null / 'all' = no filter) and group into months,
 * newest month first and newest invoice first within each month. "Undated"
 * invoices sort last.
 *
 * Returns `[{ key, label, invoices }]`.
 */
export function groupInvoicesByMonth(invoices, entityFilter = null) {
  const wanted = entityFilter && entityFilter !== 'all'
    ? String(entityFilter).toUpperCase()
    : null

  const buckets = new Map()
  for (const inv of invoices) {
    if (wanted && invoiceEntityCode(inv) !== wanted) continue
    const key = invoiceMonthKey(inv)
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key).push(inv)
  }

  return [...buckets.entries()]
    // '' (undated) sorts after every real month key.
    .sort(([a], [b]) => (b || '0000-00').localeCompare(a || '0000-00'))
    .map(([key, list]) => ({
      key: key || 'undated',
      label: monthLabel(key),
      // Newest first. Sorting on the id would order by entity prefix before
      // date (every VAN bill ahead of every PM one); ISO dates sort
      // lexicographically, so comparing them directly is chronological. The id
      // only breaks ties between invoices issued on the same day.
      invoices: [...list].sort(
        (a, b) =>
          String(b.date || '').localeCompare(String(a.date || '')) ||
          String(b.id).localeCompare(String(a.id))
      ),
    }))
}


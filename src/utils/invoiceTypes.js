/**
 * Invoice types and how they relate to a billing entity's GST status.
 *
 * A billing entity is either GST-registered or not (see entityHasGst in
 * entities.js). That determines which invoice types it can issue:
 *
 *   • GST-registered entities   → `domestic` (IGST 18%)  or  `export` (LUT #)
 *   • non-GST-registered entity → `non_gst` only — no IGST line, no LUT
 *
 * `non_gst` is the invoice type for entities that aren't registered for GST
 * (e.g. individuals / businesses below the GST threshold): a plain invoice
 * whose total equals its subtotal, carrying neither a tax line nor an LUT #.
 */
import { entityHasGst } from './entities'

export const IGST_RATE = 0.18

export const INVOICE_TYPES = {
  domestic: {
    label: 'Domestic (IGST 18%)',
    badge: 'Domestic',
    badgeClass: 'bg-blue-50 text-blue-600',
  },
  export: {
    label: 'Export (LUT)',
    badge: 'Export',
    badgeClass: 'bg-green-50 text-green-600',
  },
  non_gst: {
    label: 'Non-GST',
    badge: 'Non-GST',
    badgeClass: 'bg-gray-100 text-gray-600',
  },
}

/** Invoice types a given entity is allowed to issue, most-common first. */
export function typesForEntity(entity) {
  return entityHasGst(entity) ? ['domestic', 'export'] : ['non_gst']
}

/** Display metadata for an invoice type, defaulting to `domestic`. */
export function invoiceTypeMeta(type) {
  return INVOICE_TYPES[type] || INVOICE_TYPES.domestic
}

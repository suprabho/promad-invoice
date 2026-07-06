/**
 * Billing entities — the "billed from" side of an invoice.
 *
 * Previously this was a single hardcoded PROMAD constant baked into the
 * invoice canvas. Entities are now first-class records so the app can bill
 * as several organisations / individuals, each with its own bank details,
 * GSTIN, PAN and branding, while sharing the same invoice layout.
 *
 * PROMAD ships as a built-in default so the app works with zero setup. Any
 * entities stored in the Supabase `entities` table are merged on top (see
 * fetchEntities in api.js). Each invoice stores a *snapshot* of its entity,
 * so historical invoices keep rendering correctly even if an entity is later
 * edited or removed.
 */

export const DEFAULT_BRAND_COLOR = '#EDEA00'

export const DEFAULT_ENTITIES = [
  {
    id: 'promad',
    name: 'PROMAD DESIGN',
    logo: 'promad', // renders the built-in PROMAD wordmark SVG
    brandColor: DEFAULT_BRAND_COLOR,
    accountNo: '50200103282761',
    accountType: 'Current',
    bank: 'HDFC',
    ifsc: 'HDFC0008118',
    gstin: '06ABGFP1006J1ZI',
    pan: 'ABGFP1006J',
    hasGst: true, // GST-registered → issues Domestic / Export invoices
  },
]

/**
 * Resolve the entity to render for an invoice, falling back to the first
 * built-in default for legacy invoices saved before entities existed.
 */
export function resolveEntity(invoice) {
  return invoice?.entity || DEFAULT_ENTITIES[0]
}

/**
 * Whether a billing entity is registered for GST.
 *
 * Drives which invoice types the entity can issue (see typesForEntity in
 * invoiceTypes.js): GST-registered entities bill Domestic (IGST) or Export
 * (LUT); non-GST entities bill a plain Non-GST invoice with neither.
 *
 * Defaults to `true` when the flag is absent so entities created before this
 * field existed — and the built-in PROMAD default — keep their behaviour.
 */
export function entityHasGst(entity) {
  return entity?.hasGst !== false
}

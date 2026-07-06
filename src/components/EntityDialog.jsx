import { useState } from 'react'
import { X, Spinner } from '@phosphor-icons/react'
import { createEntity } from '../utils/api'
import { DEFAULT_BRAND_COLOR } from '../utils/entities'

// Create a new billing entity — the "billed from" side of an invoice
// (name, bank details, GSTIN, PAN and brand colour). New entities render
// their name as a text wordmark; the built-in PROMAD entity keeps its SVG.
export default function EntityDialog({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '',
    accountNo: '',
    accountType: 'Current',
    bank: '',
    ifsc: '',
    gstin: '',
    pan: '',
    brandColor: DEFAULT_BRAND_COLOR,
    hasGst: true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))

  // Toggling GST off clears any GSTIN — a non-GST entity has none, and its
  // invoices carry neither IGST nor an LUT.
  const toggleGst = (value) =>
    setForm(f => ({ ...f, hasGst: value, gstin: value ? f.gstin : '' }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return setError('Entity name is required.')
    setSaving(true)
    setError('')
    try {
      const saved = await createEntity(form)
      onCreated(saved)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const field = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300'
  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">New Billing Entity</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className={labelCls}>Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. ACME STUDIOS"
              className={field}
              required
              autoFocus
            />
          </div>

          {/* GST registration — decides which invoice types this entity issues */}
          <div className="rounded-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-gray-800">GST registered</div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {form.hasGst
                    ? 'Bills Domestic (IGST 18%) & Export (LUT) invoices.'
                    : 'Bills Non-GST invoices — no IGST, no LUT.'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.hasGst}
                aria-label="GST registered"
                onClick={() => toggleGst(!form.hasGst)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-300 ${
                  form.hasGst ? 'bg-[#EDEA00]' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    form.hasGst ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Account #</label>
              <input type="text" value={form.accountNo} onChange={e => set('accountNo', e.target.value)} className={field} />
            </div>
            <div>
              <label className={labelCls}>Account Type</label>
              <input type="text" value={form.accountType} onChange={e => set('accountType', e.target.value)} className={field} />
            </div>
            <div>
              <label className={labelCls}>Bank</label>
              <input type="text" value={form.bank} onChange={e => set('bank', e.target.value)} className={field} />
            </div>
            <div>
              <label className={labelCls}>IFSC</label>
              <input type="text" value={form.ifsc} onChange={e => set('ifsc', e.target.value)} className={field} />
            </div>
            {form.hasGst && (
              <div>
                <label className={labelCls}>GSTIN</label>
                <input type="text" value={form.gstin} onChange={e => set('gstin', e.target.value)} className={field} />
              </div>
            )}
            <div>
              <label className={labelCls}>PAN</label>
              <input type="text" value={form.pan} onChange={e => set('pan', e.target.value)} className={field} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Brand Colour</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.brandColor}
                onChange={e => set('brandColor', e.target.value)}
                className="h-9 w-12 rounded-lg border border-gray-200 cursor-pointer bg-white"
              />
              <input
                type="text"
                value={form.brandColor}
                onChange={e => set('brandColor', e.target.value)}
                className={field}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#EDEA00] hover:bg-yellow-300 text-gray-900 font-semibold text-sm rounded-xl transition-colors disabled:opacity-60"
            >
              {saving ? <Spinner size={15} className="animate-spin" /> : null}
              {saving ? 'Saving...' : 'Save Entity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

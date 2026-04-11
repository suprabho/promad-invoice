import { useState, useEffect } from 'react'
import {
  Plus,
  Trash,
  ArrowRight,
} from '@phosphor-icons/react'
import { generateInvoiceId, getTodayISO, getMonthYear } from '../utils/invoiceNumber'
import { createClient } from '../utils/api'

const IGST_RATE = 0.18

const CURRENCIES = {
  INR: { symbol: '₹', locale: 'en-IN' },
  USD: { symbol: '$', locale: 'en-US' },
}

const emptyItem = () => ({ sl: 1, description: '', quantity: 0, price: 0, unit: 'hour', total: 0 })

const emptyForm = () => ({
  date: getTodayISO(),
  type: 'domestic',
  currency: 'INR',
  lut: '',
  client: { name: '', address: '', website: '', gstin: '' },
  items: [emptyItem()],
})

function recalc(form) {
  const items = form.items.map((item, i) => ({
    ...item,
    sl: i + 1,
    total: Number(item.quantity) * Number(item.price),
  }))
  const subtotal = items.reduce((s, it) => s + it.total, 0)
  const isDomestic = form.type === 'domestic'
  const igst = isDomestic ? Math.round(subtotal * IGST_RATE) : 0
  const total = subtotal + igst
  return { ...form, items, subtotal, igst: isDomestic ? igst : null, total }
}

export default function InvoiceForm({ invoiceList = [], clients = [], editInvoice, onSave, onCancel, onClientCreated }) {
  const isEditing = !!editInvoice

  const [form, setForm] = useState(() => {
    if (editInvoice) {
      return recalc({
        date: editInvoice.date,
        type: editInvoice.type,
        currency: editInvoice.currency,
        lut: editInvoice.lut || '',
        client: { ...editInvoice.client },
        items: editInvoice.items.map(it => ({ ...it })),
      })
    }
    return emptyForm()
  })

  const [generatedId, setGeneratedId] = useState(editInvoice?.id || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedClientId, setSelectedClientId] = useState(() => {
    if (editInvoice) {
      const match = clients.find(c => c.name === editInvoice.client.name)
      return match?.id || ''
    }
    return ''
  })

  // Auto-generate invoice ID whenever date or invoiceList changes (only for new invoices)
  useEffect(() => {
    if (isEditing) return
    const { month, year } = getMonthYear(form.date)
    const id = generateInvoiceId(month, year, invoiceList)
    setGeneratedId(id)
  }, [form.date, invoiceList, isEditing])

  const setField = (path, value) => {
    setForm(prev => {
      const next = structuredClone(prev)
      const keys = path.split('.')
      let obj = next
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]]
      obj[keys[keys.length - 1]] = value
      return recalc(next)
    })
  }

  const setItemField = (index, key, value) => {
    setForm(prev => {
      const next = structuredClone(prev)
      next.items[index][key] = value
      return recalc(next)
    })
  }

  const addItem = () => {
    setForm(prev => {
      const next = structuredClone(prev)
      next.items.push(emptyItem())
      return recalc(next)
    })
  }

  const removeItem = (index) => {
    setForm(prev => {
      const next = structuredClone(prev)
      if (next.items.length === 1) {
        next.items[0] = { ...emptyItem(), sl: next.items[0].sl, unit: '' }
      } else {
        next.items.splice(index, 1)
      }
      return recalc(next)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.client.name.trim()) return setError('Client name is required.')
    if (form.items.some(it => !it.description.trim())) return setError('All line items need a description.')
    if (!form.type === 'export' && !form.lut.trim()) return setError('LUT # is required for export invoices.')

    setSaving(true)
    try {
      // Auto-save new client if not selected from dropdown (only for new invoices)
      if (!isEditing && !selectedClientId && form.client.name.trim()) {
        const { name, address, website, gstin } = form.client
        const saved = await createClient({ name, address, website, gstin })
        if (onClientCreated) onClientCreated(saved)
      }
      const payload = recalc({ ...form, id: generatedId })
      if (!payload.lut) payload.lut = null
      await onSave(payload)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const calc = recalc(form)
  const cur = CURRENCIES[form.currency]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Meta ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Invoice ID (auto)
          </label>
          <div className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm font-mono font-bold text-gray-800">
            #{generatedId}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Date
          </label>
          <input
            type="date"
            value={form.date}
            onChange={e => setField('date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Invoice Type
          </label>
          <select
            value={form.type}
            onChange={e => setField('type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 bg-white"
          >
            <option value="domestic">Domestic (IGST 18%)</option>
            <option value="export">Export (LUT)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Currency
          </label>
          <select
            value={form.currency}
            onChange={e => setField('currency', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 bg-white"
          >
            {Object.keys(CURRENCIES).map(c => (
              <option key={c} value={c}>{c} ({CURRENCIES[c].symbol})</option>
            ))}
          </select>
        </div>
      </div>

      {form.type === 'export' && (
        <div className="w-full sm:max-w-xs">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            LUT #
          </label>
          <input
            type="text"
            value={form.lut}
            onChange={e => setField('lut', e.target.value)}
            placeholder="e.g. AD260324019444B"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
            required
          />
        </div>
      )}

      {/* ── Client ── */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Client Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <select
              value={selectedClientId}
              onChange={e => {
                const id = e.target.value
                setSelectedClientId(id)
                if (id === '') {
                  setField('client.name', '')
                  setField('client.address', '')
                  setField('client.website', '')
                  setField('client.gstin', '')
                } else {
                  const c = clients.find(cl => cl.id === id)
                  if (c) {
                    setField('client.name', c.name)
                    setField('client.address', c.address || '')
                    setField('client.website', c.website || '')
                    setField('client.gstin', c.gstin || '')
                  }
                }
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 bg-white"
            >
              <option value="">+ New Client</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <input
              type="text"
              placeholder="Client Name"
              value={form.client.name}
              onChange={e => setField('client.name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <textarea
              placeholder="Address"
              value={form.client.address}
              onChange={e => setField('client.address', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 resize-none"
            />
          </div>
          <input
            type="text"
            placeholder="Website (optional)"
            value={form.client.website}
            onChange={e => setField('client.website', e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
          />
          <input
            type="text"
            placeholder="GSTIN (optional)"
            value={form.client.gstin}
            onChange={e => setField('client.gstin', e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
          />
        </div>
      </div>

      {/* ── Line Items ── */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Line Items
        </h3>

        {/* Header row — desktop only */}
        <div className="hidden sm:grid grid-cols-[2rem_1fr_5.5rem_5.5rem_5.5rem_5.5rem_1.5rem] gap-2 mb-1">
          <span className="text-xs text-gray-400 font-medium">SL</span>
          <span className="text-xs text-gray-400 font-medium">Description</span>
          <span className="text-xs text-gray-400 font-medium">Qty</span>
          <span className="text-xs text-gray-400 font-medium">Price</span>
          <span className="text-xs text-gray-400 font-medium">Unit</span>
          <span className="text-xs text-gray-400 font-medium text-right">Total</span>
          <span />
        </div>

        <div className="space-y-3 sm:space-y-2">
          {form.items.map((item, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 p-3 sm:p-0 sm:border-0 sm:rounded-none sm:grid sm:grid-cols-[2rem_1fr_5.5rem_5.5rem_5.5rem_5.5rem_1.5rem] sm:gap-2 sm:items-center"
            >
              {/* Mobile header row */}
              <div className="flex items-center justify-between mb-2 sm:hidden">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Item {i + 1}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="text-gray-300 hover:text-red-400 transition-colors"
                  aria-label="Remove item"
                >
                  <Trash size={16} />
                </button>
              </div>

              {/* SL (desktop only) */}
              <div className="hidden sm:block text-sm font-bold text-gray-400 text-center">{i + 1}</div>

              {/* Description */}
              <input
                type="text"
                placeholder="Service description"
                value={item.description}
                onChange={e => setItemField(i, 'description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 mb-2 sm:mb-0"
                required
              />

              {/* Mobile: 3-col grid for qty/price/unit */}
              <div className="grid grid-cols-3 gap-2 mb-2 sm:hidden">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Qty</label>
                  <input
                    type="number"
                    placeholder="0"
                    min="0"
                    step="0.5"
                    value={item.quantity || ''}
                    onChange={e => setItemField(i, 'quantity', Number(e.target.value))}
                    className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Price</label>
                  <input
                    type="number"
                    placeholder="0"
                    min="0"
                    value={item.price || ''}
                    onChange={e => setItemField(i, 'price', Number(e.target.value))}
                    className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Unit</label>
                  <input
                    type="text"
                    placeholder="hour"
                    value={item.unit}
                    onChange={e => setItemField(i, 'unit', e.target.value)}
                    className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  />
                </div>
              </div>

              {/* Desktop-only duplicate inputs (inside grid cells) */}
              <input
                type="number"
                placeholder="0"
                min="0"
                step="0.5"
                value={item.quantity || ''}
                onChange={e => setItemField(i, 'quantity', Number(e.target.value))}
                className="hidden sm:block px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
              />
              <input
                type="number"
                placeholder="0"
                min="0"
                value={item.price || ''}
                onChange={e => setItemField(i, 'price', Number(e.target.value))}
                className="hidden sm:block px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
              />
              <input
                type="text"
                placeholder="hour"
                value={item.unit}
                onChange={e => setItemField(i, 'unit', e.target.value)}
                className="hidden sm:block px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
              />

              {/* Mobile total row */}
              <div className="flex justify-between items-center pt-2 border-t border-gray-100 sm:hidden">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</span>
                <span className="text-sm font-semibold text-gray-800">
                  {cur.symbol}{(item.total || 0).toLocaleString(cur.locale)}
                </span>
              </div>

              {/* Desktop total + delete */}
              <div className="hidden sm:block text-sm font-semibold text-right text-gray-700 pr-1">
                {cur.symbol}{(item.total || 0).toLocaleString(cur.locale)}
              </div>
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="hidden sm:flex justify-center text-gray-300 hover:text-red-400 transition-colors"
                aria-label="Remove item"
              >
                <Trash size={16} />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addItem}
          className="mt-3 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <Plus size={15} />
          Add line item
        </button>
      </div>

      {/* ── Totals summary ── */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>{cur.symbol}{calc.subtotal.toLocaleString(cur.locale)}</span>
        </div>
        {form.type === 'domestic' && (
          <div className="flex justify-between text-gray-600">
            <span>IGST 18%</span>
            <span>{cur.symbol}{(calc.igst || 0).toLocaleString(cur.locale)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base text-gray-900 pt-2 border-t border-gray-200">
          <span>Total</span>
          <span>{cur.symbol}{calc.total.toLocaleString(cur.locale)}</span>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      {/* ── Actions ── */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#EDEA00] hover:bg-yellow-300 text-gray-900 font-semibold text-sm rounded-xl transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : isEditing ? 'Update & Preview' : 'Save & Preview'}
          <ArrowRight size={16} weight="bold" />
        </button>
      </div>
    </form>
  )
}

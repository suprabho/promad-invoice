import { useState, useEffect, useRef, useMemo } from 'react'
import {
  FolderOpen,
  FilePlus,
  DownloadSimple,
  FileJpg,
  FilePdf,
  CaretDown,
  ArrowLeft,
  Receipt,
  Spinner,
  UserPlus,
  Buildings,
  PencilSimple,
  TrashSimple,
  List,
  X,
} from '@phosphor-icons/react'
import InvoiceCanvas from './components/InvoiceCanvas'
import InvoiceForm from './components/InvoiceForm'
import ClientDialog from './components/ClientDialog'
import EntityDialog from './components/EntityDialog'
import { fetchInvoiceList, fetchInvoice, createInvoice, updateInvoice, deleteInvoice, fetchClients, fetchEntities } from './utils/api'
import { downloadAsJpeg, downloadAsPdf } from './utils/exportInvoice'
import { formatCurrency } from './utils/invoiceNumber'
import { invoiceTypeMeta } from './utils/invoiceTypes'
import { invoiceEntityCode } from './utils/entities'
import { entityFilterOptions, groupInvoicesByMonth } from './utils/invoiceHistory'

const CANVAS_ID = 'invoice-canvas'

export default function App() {
  const [mode, setMode] = useState('home') // 'home' | 'load' | 'create' | 'preview'
  const [invoiceList, setInvoiceList] = useState([])
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [loadingList, setLoadingList] = useState(false)
  const [loadingInvoice, setLoadingInvoice] = useState(false)
  const [exporting, setExporting] = useState(null) // 'pdf' | 'jpg' | null
  const [clients, setClients] = useState([])
  const [entities, setEntities] = useState([])
  const [editingInvoice, setEditingInvoice] = useState(null)
  const [showClientDialog, setShowClientDialog] = useState(false)
  const [showEntityDialog, setShowEntityDialog] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [toast, setToast] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [entityFilter, setEntityFilter] = useState('all') // billing-entity code, or 'all'
  const [previewScale, setPreviewScale] = useState(1)
  const scrollRef = useRef(null)
  const previewWrapRef = useRef(null)
  const historyRef = useRef(null)

  // Sidebar history: which entities can be filtered on, and the month buckets
  // for the current filter.
  const entityFilters = useMemo(
    () => entityFilterOptions(invoiceList, entities),
    [invoiceList, entities]
  )
  const monthGroups = useMemo(
    () => groupInvoicesByMonth(invoiceList, entityFilter),
    [invoiceList, entityFilter]
  )

  // Changing the filter swaps in a different set of months, so an inherited
  // scroll offset would drop the user into the middle of the new list.
  useEffect(() => {
    historyRef.current?.scrollTo({ top: 0 })
  }, [entityFilter])

  // Drop a filter whose entity no longer has any invoices (its last one was
  // deleted), so the history can't get stuck showing an empty list.
  useEffect(() => {
    if (entityFilter === 'all') return
    if (!entityFilters.some(o => o.code === entityFilter)) setEntityFilter('all')
  }, [entityFilters, entityFilter])

  // Dynamically scale the 794px invoice canvas so it fits the viewport on mobile.
  useEffect(() => {
    if (mode !== 'preview') return
    const el = previewWrapRef.current
    if (!el) return
    const update = () => {
      const available = el.clientWidth
      if (!available) return
      setPreviewScale(Math.min(1, available / 794))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [mode, selectedInvoice])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const loadList = async () => {
    setLoadingList(true)
    try {
      const list = await fetchInvoiceList()
      setInvoiceList(list)
    } catch {
      showToast('Could not connect to Supabase.')
    } finally {
      setLoadingList(false)
    }
  }

  const loadClients = async () => {
    try {
      const list = await fetchClients()
      setClients(list)
    } catch { /* silent */ }
  }

  const loadEntities = async () => {
    try {
      const list = await fetchEntities()
      setEntities(list)
    } catch { /* silent */ }
  }

  useEffect(() => {
    loadList()
    loadClients()
    loadEntities()
  }, [])

  const handleSelectInvoice = async (id) => {
    setLoadingInvoice(true)
    try {
      const inv = await fetchInvoice(id)
      setSelectedInvoice(inv)
      setMode('preview')
      setTimeout(() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50)
    } catch {
      showToast('Failed to load invoice.')
    } finally {
      setLoadingInvoice(false)
    }
  }

  const handleCreate = async (invoice) => {
    await createInvoice(invoice)
    await loadList()
    setSelectedInvoice(invoice)
    setMode('preview')
    showToast(`Invoice #${invoice.id} saved!`)
    setTimeout(() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50)
  }

  const handleUpdate = async (invoice) => {
    await updateInvoice(invoice.id, invoice)
    await loadList()
    setSelectedInvoice(invoice)
    setEditingInvoice(null)
    setMode('preview')
    showToast(`Invoice #${invoice.id} updated!`)
    setTimeout(() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50)
  }

  const handleEdit = () => {
    setEditingInvoice(selectedInvoice)
    setMode('create')
  }

  const handleDelete = async () => {
    const id = selectedInvoice.id
    setShowDeleteConfirm(false)
    try {
      await deleteInvoice(id)
      await loadList()
      setSelectedInvoice(null)
      setMode('home')
      showToast(`Invoice #${id} deleted.`)
    } catch {
      showToast('Failed to delete invoice.')
    }
  }

  const handleExport = async (type) => {
    if (!selectedInvoice) return
    setExporting(type)
    const filename = `PROMAD-Invoice-${selectedInvoice.id}`
    try {
      if (type === 'jpg') await downloadAsJpeg(CANVAS_ID, filename)
      else await downloadAsPdf(CANVAS_ID, filename)
      showToast(`Downloaded as ${type.toUpperCase()}`)
    } catch (e) {
      showToast('Export failed. Try again.')
    } finally {
      setExporting(null)
    }
  }

  const go = (next) => {
    setMode(next)
    setSidebarOpen(false)
  }

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex flex-col md:flex-row" style={{ fontFamily: 'Manrope, sans-serif' }}>
      {/* ── Mobile top bar ── */}
      <header className="md:hidden shrink-0 z-30 flex items-center justify-between bg-white border-b border-gray-100 px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#EDEA00] flex items-center justify-center">
            <Receipt size={14} weight="bold" className="text-gray-900" />
          </div>
          <span className="font-bold text-sm tracking-tight text-gray-900">PROMAD Invoices</span>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 -mr-2 text-gray-700 hover:bg-gray-50 rounded-lg"
          aria-label="Open menu"
        >
          <List size={22} />
        </button>
      </header>

      {/* ── Mobile drawer backdrop ── */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 shrink-0 h-screen bg-white border-r border-gray-100 flex flex-col overflow-hidden transform transition-transform duration-200 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        {/* Brand */}
        <div className="shrink-0 px-5 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#EDEA00] flex items-center justify-center">
              <Receipt size={14} weight="bold" className="text-gray-900" />
            </div>
            <span className="font-bold text-sm tracking-tight text-gray-900">PROMAD Invoices</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 text-gray-400 hover:text-gray-700"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <div className="shrink-0 px-3 py-4 space-y-1">
          <button
            onClick={() => { setEditingInvoice(null); go('create') }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              mode === 'create'
                ? 'bg-[#EDEA00] text-gray-900'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FilePlus size={17} weight={mode === 'create' ? 'bold' : 'regular'} />
            New Invoice
          </button>
          <button
            onClick={() => go('load')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              mode === 'load'
                ? 'bg-[#EDEA00] text-gray-900'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FolderOpen size={17} weight={mode === 'load' ? 'bold' : 'regular'} />
            Load Invoice
          </button>
          <button
            onClick={() => { setShowClientDialog(true); setSidebarOpen(false) }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <UserPlus size={17} />
            Add Client
          </button>
          <button
            onClick={() => { setShowEntityDialog(true); setSidebarOpen(false) }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Buildings size={17} />
            Add Entity
          </button>
        </div>

        {/* History — the only part of the sidebar that scrolls */}
        <div className="flex-1 min-h-0 flex flex-col border-t border-gray-100">
          <div className="shrink-0 px-4 pt-4 pb-2">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">History</p>
            {/* Billing-entity filter — hidden when there is only one entity to
                choose from, since a lone chip filters nothing. */}
            {entityFilters.length > 1 && (
              <div className="flex flex-wrap gap-1 mt-2.5">
                <button
                  onClick={() => setEntityFilter('all')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    entityFilter === 'all'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {entityFilters.map(opt => (
                  <button
                    key={opt.code}
                    onClick={() => setEntityFilter(opt.code)}
                    title={`${opt.name} — ${opt.count} invoice${opt.count === 1 ? '' : 's'}`}
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                      entityFilter === opt.code
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {opt.code}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div ref={historyRef} className="flex-1 min-h-0 overflow-y-auto px-3 pb-4">
            {loadingList ? (
              <div className="flex justify-center pt-6">
                <Spinner size={18} className="text-gray-300 animate-spin" />
              </div>
            ) : invoiceList.length === 0 ? (
              <p className="text-xs text-gray-400 text-center pt-6 px-4">No invoices yet. Create your first one!</p>
            ) : monthGroups.length === 0 ? (
              <p className="text-xs text-gray-400 text-center pt-6 px-4">No invoices billed from this entity yet.</p>
            ) : (
              monthGroups.map(group => (
                <div key={group.key} className="mb-3">
                  <div className="sticky top-0 z-10 -mx-3 px-4 py-2 bg-white flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      {group.label}
                    </span>
                    <span className="text-[11px] font-medium text-gray-300">{group.invoices.length}</span>
                  </div>
                  <div className="space-y-1 mt-1">
                    {group.invoices.map(inv => (
                      <button
                        key={inv.id}
                        onClick={() => { handleSelectInvoice(inv.id); setSidebarOpen(false) }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors ${
                          selectedInvoice?.id === inv.id
                            ? 'bg-gray-900 text-white'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono font-semibold truncate">#{inv.id}</span>
                          {entityFilters.length > 1 && entityFilter === 'all' && (
                            <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              selectedInvoice?.id === inv.id
                                ? 'bg-white/20 text-white'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {invoiceEntityCode(inv)}
                            </span>
                          )}
                        </div>
                        <div className="text-xs mt-0.5 opacity-70 truncate">{inv.clientName}</div>
                        <div className="text-xs mt-0.5 font-semibold opacity-90">
                          ₹{formatCurrency(inv.total)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto min-w-0">
        {/* Home / empty state */}
        {mode === 'home' && (
          <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16">
            <div className="w-16 h-16 rounded-2xl bg-[#EDEA00] flex items-center justify-center mb-4">
              <Receipt size={32} weight="bold" className="text-gray-900" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">PROMAD Invoice Manager</h1>
            <p className="text-gray-500 text-sm max-w-xs">
              Create a new invoice or load an existing one from the sidebar.
            </p>
          </div>
        )}

        {/* Load mode */}
        {mode === 'load' && (
          <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8 sm:py-10">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Load Invoice</h2>
            <p className="text-sm text-gray-500 mb-6">Select an invoice below to preview it.</p>
            {loadingInvoice && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Spinner size={16} className="animate-spin" />
                Loading…
              </div>
            )}
            {invoiceList.length === 0 && !loadingList && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
                No invoices found. Create your first invoice to get started.
              </div>
            )}
            {invoiceList.length > 0 && (
              <div className="grid gap-3">
                {[...invoiceList].reverse().map(inv => (
                  <button
                    key={inv.id}
                    onClick={() => handleSelectInvoice(inv.id)}
                    className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-5 py-4 hover:border-yellow-300 hover:shadow-sm transition-all text-left group"
                  >
                    <div>
                      <div className="text-sm font-mono font-bold text-gray-900">#{inv.id}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{inv.clientName}</div>
                      <div className="text-xs mt-1">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${invoiceTypeMeta(inv.type).badgeClass}`}>
                          {invoiceTypeMeta(inv.type).badge}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">₹{formatCurrency(inv.total)}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{inv.date}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create / Edit mode */}
        {mode === 'create' && (
          <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8 sm:py-10">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {editingInvoice ? `Edit Invoice #${editingInvoice.id}` : 'New Invoice'}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {editingInvoice
                ? 'Update the details below. Totals are recalculated automatically.'
                : 'Fill in the details below. Invoice ID and totals are calculated automatically.'}
            </p>
            <InvoiceForm
              key={editingInvoice?.id || 'new'}
              invoiceList={invoiceList}
              clients={clients}
              entities={entities}
              editInvoice={editingInvoice}
              onSave={editingInvoice ? handleUpdate : handleCreate}
              onCancel={() => {
                if (editingInvoice) {
                  setEditingInvoice(null)
                  setMode('preview')
                } else {
                  setMode('home')
                }
              }}
              onClientCreated={(c) => setClients(prev => [...prev, c].sort((a, b) => a.name.localeCompare(b.name)))}
            />
          </div>
        )}

        {/* Preview mode */}
        {mode === 'preview' && selectedInvoice && (
          <div className="px-4 sm:px-8 py-6 sm:py-8">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 mb-5 max-w-4xl sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:mb-6">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setMode('load')}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors shrink-0"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
                <div className="h-4 w-px bg-gray-200 shrink-0" />
                <div className="min-w-0">
                  <span className="text-sm font-mono font-bold text-gray-900">#{selectedInvoice.id}</span>
                  <span className="text-sm text-gray-400 ml-2 truncate">{selectedInvoice.client.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <PencilSimple size={15} />
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-red-200 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <TrashSimple size={15} />
                  Delete
                </button>
                <div className="hidden sm:block h-4 w-px bg-gray-200" />
                <button
                  onClick={() => handleExport('jpg')}
                  disabled={!!exporting}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
                >
                  {exporting === 'jpg' ? <Spinner size={15} className="animate-spin" /> : <FileJpg size={15} />}
                  JPEG
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={!!exporting}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#EDEA00] hover:bg-yellow-300 rounded-xl text-sm font-semibold text-gray-900 transition-colors disabled:opacity-60"
                >
                  {exporting === 'pdf' ? <Spinner size={15} className="animate-spin" /> : <FilePdf size={15} />}
                  <span className="hidden sm:inline">Download PDF</span>
                  <span className="sm:hidden">PDF</span>
                </button>
              </div>
            </div>

            {/* Invoice canvas wrapper — scales to fit viewport on small screens */}
            <div ref={previewWrapRef} className="w-full max-w-[794px]">
              <div
                className="rounded-2xl overflow-hidden shadow-xl"
                style={{
                  width: 794 * previewScale,
                  height: 1123 * previewScale,
                }}
              >
                <div
                  style={{
                    width: 794,
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top left',
                  }}
                >
                  <InvoiceCanvas invoice={selectedInvoice} />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Invoice</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete invoice <span className="font-mono font-bold">#{selectedInvoice?.id}</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Dialog */}
      {showClientDialog && (
        <ClientDialog
          onClose={() => setShowClientDialog(false)}
          onCreated={(c) => {
            setClients(prev => [...prev, c].sort((a, b) => a.name.localeCompare(b.name)))
            showToast(`Client "${c.name}" saved!`)
          }}
        />
      )}

      {/* Entity Dialog */}
      {showEntityDialog && (
        <EntityDialog
          onClose={() => setShowEntityDialog(false)}
          onCreated={(ent) => {
            setEntities(prev => [...prev, ent].sort((a, b) => a.name.localeCompare(b.name)))
            showToast(`Entity "${ent.name}" saved!`)
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg z-50 transition-all">
          {toast}
        </div>
      )}
    </div>
  )
}

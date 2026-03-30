import { formatInvoiceDate, formatCurrency } from '../utils/invoiceNumber'
import PromadLogoSvg from '../Promad_logo.svg'

const CURRENCIES = {
  INR: { symbol: '₹', code: 'INR' },
  USD: { symbol: '$', code: 'USD' },
}

// Fixed Promad payment details
const PROMAD = {
  name: 'PROMAD DESIGN',
  accountNo: '50200103282761',
  accountType: 'Current',
  bank: 'HDFC',
  ifsc: 'HDFC0008118',
  gstin: '06ABGFP1006J1ZI',
  pan: 'ABGFP1006J',
}

function PromadLogo() {
  return (
    <div className="flex flex-col items-end gap-0.5">
      <img src={PromadLogoSvg} alt="Promad Logo" className="h-[36px]" />
      <span className="text-[11px] text-[#555] font-medium tracking-[0.3px]">
        PAN: {PROMAD.pan}
      </span>
    </div>
  )
}

export default function InvoiceCanvas({ invoice }) {
  if (!invoice) return null

  const {
    id,
    date,
    type,
    currency = 'INR',
    lut,
    client,
    items,
    subtotal,
    igst,
    total,
  } = invoice

  const isDomestic = type === 'domestic'
  const cur = CURRENCIES[currency] || CURRENCIES.INR

  return (
    <div
      id="invoice-canvas"
      className="flex flex-col w-[794px] min-h-[1123px] bg-white font-sans relative overflow-hidden"
    >
      {/* ── HEADER ─────────────────────────────────────── */}
      <div className="flex justify-between relative h-[180px] bg-white">
        {/* Yellow blob shape */}

        <div className="absolute top-0 left-0 w-[520px] h-[180px] bg-promad-yellow rounded-br-[120px]">
          {/* ── INVOICE META ───────────────────────────────── */}
          <div className="pt-5 px-10">
            <div className="font-bold text-base text-promad-dark tracking-[0.5px]">
              #{id}
            </div>
            <div className="text-[13px] text-[#555] mt-1">
              DATE:&nbsp;&nbsp;{formatInvoiceDate(date)}
            </div>
          </div>
          <span className="absolute bottom-6 left-10 text-[72px] font-extrabold text-promad-dark tracking-[-2px] leading-none">
            Invoice
          </span>

        </div>

        {/* Logo top-right */}
        <div className="absolute top-7 right-10">
          <PromadLogo />
        </div>

      </div>



      {/* ── TABLE + SIDEBAR ────────────────────────────── */}
      <div className="flex flex-row flex-1">
        {/* Left column — Invoice To */}
        <div className="flex flex-col justify-end w-60 shrink-0 bg-[#f0f0f0] py-7">
          <div className='flex flex-col px-6 mb-6'>
            <div className="text-[13px] font-bold mb-2.5 text-promad-dark">
              Invoice To:
            </div>
            <div className="text-[13px] font-bold text-promad-dark mb-1.5 leading-[1.4]">
              {client.name}
            </div>
            <div className="text-xs text-[#444] leading-[1.6]">
              {client.address}
            </div>
            {client.website && (
              <div className="text-[11px] text-[#555] mt-2">
                {client.website}
              </div>
            )}
            {client.gstin && (
              <div className="text-[11px] text-[#555] mt-1">
                GSTIN: {client.gstin}
              </div>
            )}
            {!isDomestic && lut && (
              <div className="text-[11px] text-[#555] mt-1 font-semibold">
                LUT #: {lut}
              </div>
            )}
          </div>
          
          {/* Payment info */}
          <div className="w-[340px] shrink-0 border-t-2 p-6 border-promad-dark">
            <div className="text-[13px] font-bold mb-2.5 text-promad-dark">
              Payment Info:
            </div>
            <div className="text-xs text-[#333] leading-[1.8]">
              <div>Name: {PROMAD.name}</div>
              <div>A/C #: {PROMAD.accountNo}</div>
              <div>A/C Type: {PROMAD.accountType}</div>
              <div>Bank: {PROMAD.bank}</div>
              <div>IFSC: {PROMAD.ifsc}</div>
              <div>GSTIN: {PROMAD.gstin}</div>
            </div>
          </div>
        </div>

        {/* Right column — Table + Totals */}
        <div className="flex flex-col flex-1 p-10 items-end">
          {/* Table header */}
          <div className="grid grid-cols-[36px_1fr_80px_160px_100px] gap-2 pb-2 border-b border-[#ddd] text-[11px] font-semibold text-[#777] uppercase tracking-[0.5px]">
            <span>SL.</span>
            <span>Item Description</span>
            <span className="text-right">Quantity</span>
            <span className="text-right">Price / Unit</span>
            <span className="text-right">Total</span>
          </div>

          {/* Table rows */}
          {items.map((item, i) => (
            <div
              key={i}
              className="grid grid-cols-[36px_1fr_80px_160px_100px] gap-2 py-4 border-b border-[#f0f0f0] text-sm text-promad-dark items-center"
            >
              <span className="font-bold">{item.sl}.</span>
              <span className="font-medium">{item.description}</span>
              <span className="text-right font-bold">{item.quantity}</span>
              <span className="text-right">{cur.symbol} {formatCurrency(item.price)} / {item.unit}</span>
              <span className="text-right">{cur.symbol} {formatCurrency(item.total)}</span>
            </div>
          ))}

          {/* Totals */}
          <div className="flex flex-col items-end mt-auto w-[calc(100%-36px)]">
            <div className="flex justify-between py-2 text-[13px] text-[#444] w-full">
              <span className="font-semibold">Subtotal</span>
              <span>{cur.symbol}{formatCurrency(subtotal)}</span>
            </div>

            {isDomestic && igst != null && (
              <div className="flex justify-between py-2 text-[13px] text-[#444] border-b border-[#ddd] w-full">
                <span className="font-semibold">IGST 18%</span>
                <span>{cur.symbol}{formatCurrency(igst)}</span>
              </div>
            )}

            {!isDomestic && lut && (
              <div className="flex justify-between py-2 text-[13px] text-[#444] border-b border-[#ddd] w-full">
                <span className="font-semibold">LUT #</span>
                <span className="text-xs">{lut}</span>
              </div>
            )}
          </div>

          {/* ── FOOTER ─────────────────────────────────────── */}
          <div className="mt-32 w-full flex items-stretch min-h-[160px] -mx-10 -mb-10">
            {/* Grand total */}
            <div className="flex-1 bg-promad-yellow flex items-end justify-end rounded-tl-[60px] p-10">
              <span className="text-[4rem] font-regular text-promad-dark tracking-[-1px]">
                {cur.symbol}{formatCurrency(total)}/-
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

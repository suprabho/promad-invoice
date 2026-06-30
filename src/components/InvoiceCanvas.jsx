import { formatInvoiceDate, formatCurrency } from '../utils/invoiceNumber'
import { resolveEntity, DEFAULT_BRAND_COLOR } from '../utils/entities'

const CURRENCIES = {
  INR: { symbol: '₹', code: 'INR' },
  USD: { symbol: '$', code: 'USD' },
}

// Renders the billing entity's brand mark in the top-right corner.
// Entities flagged `logo: 'promad'` get the built-in PROMAD wordmark SVG;
// every other entity falls back to a clean text wordmark of its name.
function EntityLogo({ entity }) {
  if (entity.logo !== 'promad') {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-[26px] font-extrabold text-promad-dark tracking-[-0.5px] leading-none">
          {entity.name}
        </span>
        {entity.pan && (
          <span className="text-[11px] text-[#555] font-medium tracking-[0.3px]">
            PAN: {entity.pan}
          </span>
        )}
      </div>
    )
  }
  return <PromadLogo pan={entity.pan} />
}

// Inline SVG so html2canvas renders the logo as DOM nodes.
// Loading the logo as an <img src="...svg"> caused html2canvas to crop
// most of the paths out (only the yellow "D" shape survived).
function PromadLogo({ pan }) {
  return (
    <div className="flex flex-col items-end gap-0.5">
      <svg
        width="130"
        height="54"
        viewBox="0 0 130 54"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-[36px] w-auto"
        aria-label="Promad Logo"
      >
        <path d="M107.161 22.7188H77.3822C77.8992 10.6459 87.942 0.990234 100.208 0.990234H129.005V29.6359C129.005 41.8374 119.285 51.8145 107.161 52.3417V22.7188Z" fill="#EEE33E"/>
        <path d="M128.01 1.98V29.6486C128.01 40.9629 119.272 50.2971 108.144 51.3V21.7543H78.442C79.4502 10.6971 88.8208 1.99286 100.208 1.99286H128.022M130 0H100.208C87.0372 0 76.374 10.62 76.374 23.7086H106.166V53.3443C119.337 53.3443 130 42.7243 130 29.6357V0Z" fill="#231F20"/>
        <path d="M107.329 22.5649V16.8049C107.329 13.6292 109.927 11.0449 113.12 11.0449C116.312 11.0449 118.91 13.6292 118.91 16.8049C118.91 19.9806 116.312 22.5649 113.12 22.5649H107.329Z" fill="white"/>
        <path d="M113.12 12.1893C115.679 12.1893 117.76 14.2593 117.76 16.805C117.76 19.3507 115.679 21.4207 113.12 21.4207H108.48V16.805C108.48 14.2593 110.561 12.1893 113.12 12.1893ZM113.12 9.875C109.281 9.875 106.166 12.9736 106.166 16.7921V23.7093H113.12C116.959 23.7093 120.074 20.6107 120.074 16.7921C120.074 12.9736 116.959 9.875 113.12 9.875Z" fill="#231F20"/>
        <path d="M6.30742 40.4102C7.8455 40.4102 9.09922 40.8344 10.0428 41.6702C10.9863 42.5059 11.4645 43.6244 11.4645 44.9873C11.4645 46.3502 10.9992 47.5587 10.0686 48.3687C9.138 49.1787 7.88427 49.5902 6.32034 49.5902H3.61901V53.653H0V40.4102H6.30742ZM5.95844 46.5044C6.50129 46.5044 6.91489 46.3759 7.19924 46.1187C7.4836 45.8616 7.6387 45.5144 7.6387 45.0516C7.6387 44.5759 7.48359 44.2159 7.18632 43.9716C6.88904 43.7273 6.47544 43.6116 5.95844 43.6116H3.60608V46.4916H5.95844V46.5044Z" fill="#231F20"/>
        <path d="M21.5202 48.9602L25.2167 53.653H20.7834L17.578 49.4744H16.6216V53.653H13.0026V40.4102H19.5039C21.1453 40.4102 22.412 40.8216 23.3038 41.6316C24.1956 42.4544 24.648 43.5216 24.648 44.833C24.648 45.8616 24.3637 46.7359 23.8079 47.4687C23.2521 48.2016 22.4895 48.703 21.5202 48.9602ZM16.6216 46.6459H19.1807C19.7365 46.6459 20.1372 46.5044 20.4215 46.2344C20.693 45.9516 20.8351 45.5787 20.8351 45.1159C20.8351 44.653 20.693 44.2802 20.3957 44.0359C20.0984 43.7916 19.6977 43.663 19.1807 43.663H16.6216V46.6587V46.6459Z" fill="#231F20"/>
        <path d="M25.6949 47.0319C25.6949 44.9876 26.3283 43.3419 27.6079 42.0948C28.8874 40.8476 30.5677 40.2305 32.6745 40.2305C34.7812 40.2305 36.4744 40.8476 37.754 42.0948C39.0336 43.3419 39.6669 44.9876 39.6669 47.0319C39.6669 49.0762 39.0336 50.7348 37.754 51.9819C36.4744 53.2162 34.7812 53.8462 32.6745 53.8462C30.5677 53.8462 28.8745 53.229 27.6079 51.9819C26.3283 50.7476 25.6949 49.089 25.6949 47.0319ZM29.5337 47.0319C29.5337 48.1376 29.818 49.0248 30.3867 49.6805C30.9554 50.3362 31.718 50.6705 32.6745 50.6705C33.6309 50.6705 34.4064 50.3362 34.9751 49.6805C35.5438 49.0248 35.8282 48.1376 35.8282 47.0319C35.8282 45.9262 35.5438 45.0519 34.9751 44.3962C34.4064 43.7276 33.6438 43.3933 32.6745 43.3933C31.7051 43.3933 30.9554 43.7276 30.3867 44.3962C29.818 45.0648 29.5337 45.939 29.5337 47.0319Z" fill="#231F20"/>
        <path d="M42.7172 41.3228H40.688V40.7957H42.7689C43.9709 40.7957 46.1423 40.7957 46.7627 40.0371V43.1614H46.8274C47.6158 41.4643 49.5545 40.4485 51.5321 40.4485C53.2382 40.4485 54.7375 41.3228 55.2933 43.1614C56.2626 41.4128 58.0204 40.4485 59.998 40.4485C62.4667 40.4485 63.8238 41.8243 63.8238 44.9743V53.1257H65.853V53.6528H58.2143V53.1257H59.7653V44.1C59.7653 42.3771 59.468 41.5028 58.3823 41.5028C56.5341 41.5028 55.2933 43.8171 55.2933 45.1285V53.1385H56.9089V53.6657H49.5933V53.1385H51.2348V44.1128C51.2348 42.39 50.9375 41.5157 49.8518 41.5157C48.0035 41.5157 46.7627 43.83 46.7627 45.1414V53.1514H48.2879V53.6785H40.675V53.1514H42.7043V41.3485L42.7172 41.3228Z" fill="#231F20"/>
        <path d="M79.8379 51.3127C79.8379 52.2127 79.9801 52.7784 80.51 52.7784C81.2209 52.7784 81.544 51.9041 81.544 51.1455H82.074C82.074 52.8684 80.8461 54.0127 78.9332 54.0127C77.6148 54.0127 76.5291 53.3955 75.9992 52.1741C75.2366 53.5755 73.2074 54.0127 72.0571 54.0127C69.7952 54.0127 67.5074 52.9841 67.5074 50.4513C67.5074 47.417 70.4156 46.7098 73.0911 46.5041L75.9733 46.2727V43.817C75.9733 42.0684 75.6761 40.9755 73.4788 40.9755C72.4836 40.9755 70.7775 41.207 70.8033 41.8498C70.8292 42.3513 72.3026 42.2613 72.3026 43.6627C72.3026 44.6913 71.6305 45.4113 70.5061 45.4113C69.1877 45.4113 68.5931 44.537 68.5931 43.5084C68.5931 41.8755 70.7387 40.4355 73.6727 40.4355C76.6067 40.4355 79.8379 41.2584 79.8379 44.5884V51.3127ZM75.9604 46.787L73.6339 47.0184C71.721 47.2241 71.553 48.2398 71.553 49.7955C71.553 51.3513 71.6435 53.1255 73.6339 53.1255C75.0169 53.1255 75.8958 51.7241 75.9604 50.1684V46.7741V46.787Z" fill="#231F20"/>
        <path d="M91.3541 33.0816H93.616C95.697 33.0816 97.3126 33.0816 97.8425 32.1816V53.1388H99.8717V53.6659H97.8425C96.7827 53.6659 94.8181 53.6659 93.784 54.0131V51.8788H93.7194C93.0086 53.1902 91.9616 54.0131 90.0229 54.0131C87.0889 54.0131 83.8188 51.5316 83.8188 47.4688C83.8188 43.7274 86.1454 40.4488 90.0746 40.4488C91.9228 40.4488 93.0473 41.2716 93.7194 42.6988H93.784V33.6088H91.3412V33.0816H91.3541ZM93.784 44.6788C93.784 43.0459 92.6079 41.1431 90.6045 41.1431C88.7304 41.1431 88.2263 42.7759 88.2263 44.7688V48.9731C88.2263 51.9559 88.963 53.2931 90.7208 53.2931C92.6596 53.2931 93.7711 51.4802 93.7711 49.7831V44.6659L93.784 44.6788Z" fill="#231F20"/>
      </svg>
      <span className="text-[11px] text-[#555] font-medium tracking-[0.3px]">
        PAN: {pan}
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
  const entity = resolveEntity(invoice)
  const brand = entity.brandColor || DEFAULT_BRAND_COLOR

  return (
    <div
      id="invoice-canvas"
      className="flex flex-col w-[794px] min-h-[1123px] bg-white font-sans relative overflow-hidden"
    >
      {/* ── HEADER ─────────────────────────────────────── */}
      <div className="flex justify-between relative h-[180px] bg-white">
        {/* Yellow blob shape */}

        <div
          className="absolute top-0 left-0 w-[520px] h-[180px] rounded-br-[120px]"
          style={{ backgroundColor: brand }}
        >
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
          <EntityLogo entity={entity} />
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
              <div>Name: {entity.name}</div>
              {entity.accountNo && <div>A/C #: {entity.accountNo}</div>}
              {entity.accountType && <div>A/C Type: {entity.accountType}</div>}
              {entity.bank && <div>Bank: {entity.bank}</div>}
              {entity.ifsc && <div>IFSC: {entity.ifsc}</div>}
              {entity.gstin && <div>GSTIN: {entity.gstin}</div>}
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
            <div
              className="flex-1 flex items-end justify-end rounded-tl-[60px] p-10"
              style={{ backgroundColor: brand }}
            >
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

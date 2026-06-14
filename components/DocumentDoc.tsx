'use client'

import { CompanyInfo, FALLBACK_COMPANY } from '@/lib/company'

const typeConfig = {
  invoice: { label: 'ใบแจ้งหนี้', labelEn: 'INVOICE', icon: 'receipt_long', color: '#6b96c2', bg: '#e8f1f9' },
  receipt: { label: 'ใบเสร็จรับเงิน', labelEn: 'RECEIPT', icon: 'check_circle', color: '#3d8a64', bg: '#e9f3ed' },
  taxinvoice: { label: 'ใบกำกับภาษี', labelEn: 'TAX INVOICE', icon: 'gavel', color: '#9c7c5a', bg: '#f5ece3' },
}

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  draft: { label: 'ร่าง', bg: '#f0f2f5', color: '#8a97a2' },
  sent: { label: 'ส่งแล้ว', bg: '#e8f1f9', color: '#6b96c2' },
  paid: { label: 'ชำระแล้ว', bg: '#e9f3ed', color: '#3d8a64' },
  overdue: { label: 'เกินกำหนด', bg: '#fceee8', color: '#e07b54' },
}

export interface BankView { name: string; type: string; no: string; holder: string; brand: string; icon: string }

export function bankBrand(name: string): { brand: string; icon: string } {
  const n = name || ''
  if (n.includes('กสิกร') || /kbank/i.test(n)) return { brand: '#1aa84a', icon: 'eco' }
  if (n.includes('ไทยพาณิชย์') || /scb/i.test(n)) return { brand: '#4e2a84', icon: 'savings' }
  if (n.includes('กรุงเทพ') || /bbl/i.test(n)) return { brand: '#1e4598', icon: 'account_balance' }
  if (n.includes('พร้อมเพย์') || /promptpay/i.test(n)) return { brand: '#0a3a6b', icon: 'qr_code_2' }
  if (n.includes('กรุงไทย') || /ktb/i.test(n)) return { brand: '#00a4e4', icon: 'account_balance' }
  if (n.includes('กรุงศรี')) return { brand: '#fdb913', icon: 'account_balance' }
  return { brand: '#5f7d99', icon: 'account_balance' }
}

const FALLBACK_BANKS: BankView[] = [
  { name: 'ธนาคารกสิกรไทย', type: 'ออมทรัพย์', no: '041-8-63463-4', holder: 'บริษัท มิวอี้ ดีไซน์ ดิจิตอลเน็ตเวิร์ค จำกัด', brand: '#1aa84a', icon: 'eco' },
  { name: 'ธนาคารไทยพาณิชย์', type: 'ออมทรัพย์', no: '264-2-51789-0', holder: 'บริษัท มิวอี้ ดีไซน์ ดิจิตอลเน็ตเวิร์ค จำกัด', brand: '#4e2a84', icon: 'savings' },
  { name: 'ธนาคารกรุงเทพ', type: 'กระแสรายวัน', no: '195-0-44217-6', holder: 'บริษัท มิวอี้ ดีไซน์ ดิจิตอลเน็ตเวิร์ค จำกัด', brand: '#1e4598', icon: 'account_balance' },
  { name: 'พร้อมเพย์ / PromptPay', type: '', no: '0-1055-60143-09-9', holder: 'มิวอี้ ดีไซน์ ดิจิตอลเน็ตเวิร์ค', brand: '#0a3a6b', icon: 'qr_code_2' },
]

function fmt(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Convert a number to Thai baht text (e.g. 17000 -> หนึ่งหมื่นเจ็ดพันบาทถ้วน)
function bahtText(num: number): string {
  if (!num || isNaN(num)) return 'ศูนย์บาทถ้วน'
  num = Math.round(num * 100) / 100
  const [baht, satang] = num.toFixed(2).split('.')
  const digits = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
  const units = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน']
  function readInt(raw: string): string {
    const s = raw.replace(/^0+/, '') || '0'
    if (s === '0') return ''
    const n = s.length
    if (n > 6) {
      const head = s.slice(0, n - 6)
      const tail = s.slice(n - 6)
      return readInt(head) + 'ล้าน' + (parseInt(tail) === 0 ? '' : readInt(tail))
    }
    let result = ''
    for (let i = 0; i < n; i++) {
      const d = +s[i]
      const pos = n - i - 1
      if (d === 0) continue
      if (pos === 0 && d === 1 && n > 1) result += 'เอ็ด'
      else if (pos === 1 && d === 1) result += 'สิบ'
      else if (pos === 1 && d === 2) result += 'ยี่สิบ'
      else result += digits[d] + units[pos]
    }
    return result
  }
  let text = (readInt(baht) || 'ศูนย์') + 'บาท'
  text += satang === '00' ? 'ถ้วน' : readInt(satang) + 'สตางค์'
  return text
}

type DocTypeKey = keyof typeof typeConfig

interface DocItem { name: string; detail?: string; qty: number; unit: string; price: number }

export interface DocumentDocProps {
  type: 'invoice' | 'receipt' | 'taxinvoice'
  no: string
  status: string
  issueDate: string
  dueDate?: string
  clientName?: string
  clientAddress?: string
  clientTaxId?: string
  clientContact?: string
  clientPhone?: string
  items: DocItem[]
  discount?: number
  vatEnabled?: boolean
  bankIndex?: number
  banks?: BankView[]
  payMethod?: string
  payDate?: string
  payRef?: string
  slipUrl?: string
  notes?: string
  quotationId?: string
  refNo?: string
  company?: CompanyInfo
  onOpenRef?: () => void
}

export default function DocumentDoc(props: DocumentDocProps) {
  const {
    type, no, status, issueDate, dueDate,
    clientName, clientAddress, clientTaxId, clientContact, clientPhone,
    items, discount = 0, vatEnabled = false, bankIndex = 0, banks,
    payMethod, payDate, payRef, slipUrl, notes, quotationId, refNo, onOpenRef,
  } = props
  const co = props.company || FALLBACK_COMPANY
  const sellerAddress = [co.address, co.province, co.postalCode].filter(Boolean).join(' ')

  const sub = items.reduce((s, i) => s + i.qty * i.price, 0)
  const afterDiscount = sub - (discount || 0)
  const vat = vatEnabled ? afterDiscount * 0.07 : 0
  const total = afterDiscount + vat
  const sc = statusConfig[status] || statusConfig.draft
  const bankList = banks?.length ? banks : FALLBACK_BANKS
  const bank = bankList[bankIndex || 0] || bankList[0]
  const isReceipt = type === 'receipt'
  const isTaxInvoice = type === 'taxinvoice'

  const tc = typeConfig[type as DocTypeKey] || typeConfig.invoice
  const headTh = tc.label
  const headEn = tc.labelEn
  const dueLabel = isReceipt ? 'วันที่รับชำระ / Paid Date' : isTaxInvoice ? 'วันที่ / Date' : 'ครบกำหนด / Due Date'
  const sigLeftTh = isReceipt ? 'ผู้รับเงิน' : isTaxInvoice ? 'ผู้ออกเอกสาร' : 'ผู้วางบิล'
  const sigLeftEn = isReceipt ? '/ Received By' : isTaxInvoice ? '/ Issued By' : '/ Issued By'
  const sigRightTh = isReceipt ? 'ผู้จ่ายเงิน' : isTaxInvoice ? 'ผู้รับเอกสาร' : 'ผู้รับวางบิล'
  const sigRightEn = isReceipt ? '/ Paid By' : isTaxInvoice ? '/ Received By' : '/ Received By'
  const showBank = !isReceipt

  return (
    <>
      {/* 1. Top Row: Title + Wordmark */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 30 }}>
        <div>
          <div style={{ fontSize: 34, fontWeight: 700, color: '#3a4654', lineHeight: 1 }}>{headTh}</div>
          <div style={{ fontSize: 15, letterSpacing: 5, color: '#9aa7b2', fontWeight: 500, marginTop: 8 }}>{headEn}</div>
          {isReceipt && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 14, padding: '7px 16px', border: '2px solid #5f9b78', borderRadius: 8, transform: 'rotate(-3deg)' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#5f9b78' }}>verified</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#5f9b78', letterSpacing: 1 }}>ชำระเงินแล้ว / PAID</span>
            </div>
          )}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={co.logo || '/mewyou-wordmark.png'} alt={co.name} style={{ height: 82, width: 'auto', maxWidth: 220, objectFit: 'contain', display: 'block' }} />
      </div>

      {/* 2. Info Section: Customer + Metadata */}
      <div style={{ display: 'flex', gap: 34, flexWrap: 'wrap', marginBottom: 34 }}>
        {/* Customer info box */}
        <div style={{ flex: '1.15 1 300px' }}>
          <div style={{ background: '#eef1f4', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '13px 16px' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#8294a6', marginTop: 1 }}>person</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, color: '#8a97a2' }}>ลูกค้า / Client</div>
                <div style={{ fontSize: 13.5, color: '#3a4654', fontWeight: 600, marginTop: 2 }}>{clientName || '—'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '0 16px 13px' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#8294a6', marginTop: 1 }}>location_on</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, color: '#8a97a2' }}>ที่อยู่ / Address</div>
                <div style={{ fontSize: 13, color: '#4a5763', marginTop: 2, lineHeight: 1.5 }}>{clientAddress || '—'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '0 16px 14px' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#8294a6', marginTop: 1 }}>badge</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, color: '#8a97a2' }}>เลขประจำตัวผู้เสียภาษี</div>
                <div style={{ fontSize: 13.5, color: '#3a4654', fontWeight: 600, marginTop: 2, fontFamily: "'IBM Plex Sans', monospace" }}>{clientTaxId || '—'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 16px', background: '#dde4ea' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#6e8295' }}>contact_page</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, color: '#7e8b96' }}>ผู้ติดต่อ / Attention</div>
                <div style={{ fontSize: 14, color: '#3a4654', fontWeight: 700, marginTop: 1 }}>{clientContact || '—'}</div>
              </div>
            </div>
          </div>
          {clientPhone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 16px 0' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#8294a6' }}>call</span>
              <span style={{ fontSize: 12.5, color: '#8a97a2' }}>โทร / Tel :</span>
              <span style={{ fontSize: 13.5, color: '#3a4654', fontWeight: 600, fontFamily: "'IBM Plex Sans', monospace" }}>{clientPhone}</span>
            </div>
          )}
        </div>

        {/* Metadata list */}
        <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 13, paddingTop: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#8294a6' }}>tag</span>
            <span style={{ flex: 1, fontSize: 13, color: '#6a7884' }}>เลขที่ / No.</span>
            <span style={{ color: '#b8c2cb' }}>:</span>
            <span style={{ fontSize: 13.5, color: '#3a4654', fontWeight: 600, fontFamily: "'IBM Plex Sans', monospace", minWidth: 120, textAlign: 'right' }}>{no}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#8294a6' }}>event</span>
            <span style={{ flex: 1, fontSize: 13, color: '#6a7884' }}>วันที่ออก / Issue Date</span>
            <span style={{ color: '#b8c2cb' }}>:</span>
            <span style={{ fontSize: 13.5, color: '#3a4654', fontWeight: 600, fontFamily: "'IBM Plex Sans', monospace", minWidth: 120, textAlign: 'right' }}>{issueDate}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#8294a6' }}>event_available</span>
            <span style={{ flex: 1, fontSize: 13, color: '#6a7884' }}>{dueLabel}</span>
            <span style={{ color: '#b8c2cb' }}>:</span>
            <span style={{ fontSize: 13.5, color: '#3a4654', fontWeight: 600, fontFamily: "'IBM Plex Sans', monospace", minWidth: 120, textAlign: 'right' }}>{dueDate || '-'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#8294a6' }}>description</span>
            <span style={{ flex: 1, fontSize: 13, color: '#6a7884' }}>อ้างอิง / Ref</span>
            <span style={{ color: '#b8c2cb' }}>:</span>
            {refNo ? (
              onOpenRef && quotationId ? (
                <span
                  onClick={onOpenRef}
                  style={{ fontSize: 13.5, color: '#5f7d99', fontWeight: 700, fontFamily: "'IBM Plex Sans', monospace", minWidth: 120, textAlign: 'right', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}
                >{refNo}</span>
              ) : (
                <span style={{ fontSize: 13.5, color: '#3a4654', fontWeight: 600, fontFamily: "'IBM Plex Sans', monospace", minWidth: 120, textAlign: 'right' }}>{refNo}</span>
              )
            ) : (
              <span style={{ fontSize: 13, color: '#9aa7b2', fontWeight: 500, minWidth: 120, textAlign: 'right' }}>ไม่มีเอกสารอ้างอิง</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#8294a6' }}>verified</span>
            <span style={{ flex: 1, fontSize: 13, color: '#6a7884' }}>สถานะ / Status</span>
            <span style={{ color: '#b8c2cb' }}>:</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 20, fontSize: 12.5, fontWeight: 600, background: sc.bg, color: sc.color }}>{sc.label}</span>
          </div>
        </div>
      </div>

      {/* 3. Seller + Contact */}
      <div style={{ display: 'flex', gap: 34, flexWrap: 'wrap', marginBottom: 30 }}>
        {/* Seller info */}
        <div style={{ flex: '1.15 1 300px', display: 'flex', gap: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={co.logo || '/mewyou-monogram.png'} alt="logo" style={{ width: 96, height: 96, borderRadius: 7, flexShrink: 0, display: 'block', objectFit: 'contain', background: '#fff' }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'inline-block', fontSize: 13, fontWeight: 600, color: '#5a6772', background: '#eef1f4', padding: '4px 12px', borderRadius: 6, marginBottom: 8 }}>
              ผู้ออกเอกสาร / <span style={{ color: '#8a97a2', fontWeight: 500 }}>Issued By</span>
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#3a4654' }}>{co.name}{co.branch ? ` (${co.branch})` : ''}</div>
            {sellerAddress && (
              <div style={{ fontSize: 12, color: '#6a7884', marginTop: 3, lineHeight: 1.55 }}>{sellerAddress}</div>
            )}
            {co.taxId && (
              <div style={{ fontSize: 12.5, color: '#3a4654', fontWeight: 600, marginTop: 6 }}>
                เลขประจำตัวผู้เสียภาษี : <span style={{ fontFamily: "'IBM Plex Sans', monospace" }}>{co.taxId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Contact */}
        <div style={{ flex: '1 1 280px' }}>
          <div style={{ display: 'inline-block', fontSize: 13, fontWeight: 600, color: '#5a6772', background: '#eef1f4', padding: '4px 12px', borderRadius: 6, marginBottom: 11 }}>
            ติดต่อเรา / <span style={{ color: '#8a97a2', fontWeight: 500 }}>Contact Us</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {co.contactName && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, fontSize: 13, color: '#4a5763' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#8294a6' }}>person</span>{co.contactName}
              </div>
            )}
            {co.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, fontSize: 13, color: '#4a5763' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#8294a6' }}>call</span>
                <span style={{ fontFamily: "'IBM Plex Sans', monospace" }}>{co.phone}</span>
              </div>
            )}
            {co.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, fontSize: 13, color: '#4a5763' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#8294a6' }}>mail</span>{co.email}
              </div>
            )}
            {co.website && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, fontSize: 13, color: '#4a5763' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#8294a6' }}>chat</span>{co.website}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Items Table */}
      <div style={{ border: '1px solid #dde3e8', borderRadius: 7, overflow: 'hidden' }}>
        {/* Table Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '54px 1fr 84px 74px 116px 116px',
          background: '#aebfcd', color: '#33414e', fontSize: 12, fontWeight: 600,
        }}>
          <div style={{ padding: '9px 8px', textAlign: 'center', borderRight: '1px solid #c2cfda' }}>
            ลำดับ<div style={{ fontSize: 10.5, fontWeight: 400, color: '#5a6776' }}>No.</div>
          </div>
          <div style={{ padding: '9px 12px', borderRight: '1px solid #c2cfda' }}>
            รายละเอียด / <span style={{ fontWeight: 400 }}>Description</span>
          </div>
          <div style={{ padding: '9px 8px', textAlign: 'center', borderRight: '1px solid #c2cfda' }}>
            จำนวน<div style={{ fontSize: 10.5, fontWeight: 400, color: '#5a6776' }}>Quantity</div>
          </div>
          <div style={{ padding: '9px 8px', textAlign: 'center', borderRight: '1px solid #c2cfda' }}>
            หน่วย<div style={{ fontSize: 10.5, fontWeight: 400, color: '#5a6776' }}>Unit</div>
          </div>
          <div style={{ padding: '9px 8px', textAlign: 'right', borderRight: '1px solid #c2cfda' }}>
            ราคาต่อหน่วย<div style={{ fontSize: 10.5, fontWeight: 400, color: '#5a6776' }}>Unit Price</div>
          </div>
          <div style={{ padding: '9px 8px', textAlign: 'right' }}>
            จำนวนเงิน<div style={{ fontSize: 10.5, fontWeight: 400, color: '#5a6776' }}>Amount</div>
          </div>
        </div>

        {/* Item Rows */}
        {items.map((item, idx) => (
          <div key={idx} style={{
            display: 'grid', gridTemplateColumns: '54px 1fr 84px 74px 116px 116px',
            fontSize: 13, color: '#3a4654', borderBottom: '1px solid #eef1f4',
          }}>
            <div style={{ padding: '13px 8px', textAlign: 'center', borderRight: '1px solid #f0f2f5' }}>{idx + 1}</div>
            <div style={{ padding: '13px 12px', borderRight: '1px solid #f0f2f5' }}>
              <div>{item.name}</div>
              {item.detail && <div style={{ fontSize: 12, color: '#9aa7b2', marginTop: 3 }}>{item.detail}</div>}
            </div>
            <div style={{ padding: '13px 8px', textAlign: 'center', borderRight: '1px solid #f0f2f5', fontFamily: "'IBM Plex Sans', monospace" }}>{item.qty}</div>
            <div style={{ padding: '13px 8px', textAlign: 'center', borderRight: '1px solid #f0f2f5' }}>{item.unit}</div>
            <div style={{ padding: '13px 8px', textAlign: 'right', borderRight: '1px solid #f0f2f5', fontFamily: "'IBM Plex Sans', monospace" }}>฿{fmt(item.price)}</div>
            <div style={{ padding: '13px 8px', textAlign: 'right', fontFamily: "'IBM Plex Sans', monospace" }}>฿{fmt(item.qty * item.price)}</div>
          </div>
        ))}

        {/* Empty lined area */}
        <div style={{
          minHeight: 80,
          background: 'repeating-linear-gradient(#ffffff,#ffffff 43px,#f4f6f8 43px,#f4f6f8 44px)',
        }} />

        {/* Remark footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderTop: '1px solid #e8ebee', background: '#fbfcfd' }}>
          <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#8294a6' }}>chat</span>
          <span style={{ fontSize: 12.5, color: '#7a8893', fontWeight: 600 }}>หมายเหตุ / Remark</span>
          <span style={{ fontSize: 12.5, color: '#5a6772' }}>{notes || ''}</span>
        </div>
      </div>

      {/* 5. Summary */}
      <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap', marginTop: 28 }}>
        <div style={{ flex: '1.05 1 300px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#3a4654', marginBottom: 14 }}>
            สรุป <span style={{ color: '#9aa7b2', fontWeight: 500, fontSize: 13 }}>/ Summary</span>
          </div>
          {(discount || 0) > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', fontSize: 13, color: '#5a6772', marginBottom: 8 }}>
                <span>ราคารวมก่อนหักส่วนลด</span>
                <span style={{ fontFamily: "'IBM Plex Sans', monospace", whiteSpace: 'nowrap' }}>{fmt(sub)} บาท</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', fontSize: 13, color: '#c4593f', fontWeight: 600, marginBottom: 11 }}>
                <span>ส่วนลด / Discount</span>
                <span style={{ fontFamily: "'IBM Plex Sans', monospace", whiteSpace: 'nowrap' }}>-{fmt(discount || 0)} บาท</span>
              </div>
            </>
          )}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', fontSize: 13, color: '#5a6772', marginBottom: 11 }}>
            <span>มูลค่ารายการ (หลังหักส่วนลด)</span>
            <span style={{ fontFamily: "'IBM Plex Sans', monospace", whiteSpace: 'nowrap' }}>{fmt(afterDiscount)} บาท</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: '#3a4654' }}>จำนวนเงินทั้งสิ้น</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#6e8aa6', fontFamily: "'IBM Plex Sans', monospace" }}>{fmt(total)} บาท</span>
          </div>
          <div style={{ fontSize: 12.5, color: '#7a8893', fontWeight: 600 }}>({bahtText(total)})</div>
        </div>
        <div style={{ flex: '1 1 280px' }}>
          <div style={{ background: '#eef1f4', borderRadius: '9px 9px 0 0', padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', fontSize: 13, color: '#5a6772', marginBottom: 10 }}>
              <span>มูลค่าก่อนภาษี</span>
              <span style={{ fontFamily: "'IBM Plex Sans', monospace" }}>{fmt(afterDiscount)} บาท</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', fontSize: 13, color: '#5a6772' }}>
              <span>ภาษีมูลค่าเพิ่ม 7%</span>
              <span style={{ fontFamily: "'IBM Plex Sans', monospace" }}>{fmt(vat)} บาท</span>
            </div>
          </div>
          <div style={{ background: '#8294a6', borderRadius: '0 0 9px 9px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ fontSize: 12.5, color: '#e8edf2', fontWeight: 500 }}>จำนวนเงินทั้งสิ้น (รวมภาษี)</span>
            <span style={{ fontSize: 21, fontWeight: 700, color: '#fff', fontFamily: "'IBM Plex Sans', monospace", whiteSpace: 'nowrap' }}>{fmt(total)} บาท</span>
          </div>
        </div>
      </div>

      {/* 6. Payment Information (invoice & taxinvoice) */}
      {showBank && (
        <div style={{ marginTop: 26, paddingTop: 22, borderTop: '1px solid #eef1f4', maxWidth: 380 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#3a4654', marginBottom: 13 }}>
            ชำระเงิน <span style={{ color: '#9aa7b2', fontWeight: 500, fontSize: 12.5 }}>/ Payment Information</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <div style={{ width: 40, height: 40, borderRadius: 9, background: '#fff', border: '1px solid #e4e8ec', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: bank.brand, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 15, color: '#fff' }}>{bank.icon}</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: '#5a6772' }}>{bank.name}{bank.type ? <span style={{ color: '#9aa7b2' }}> · {bank.type}</span> : null}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#3a4654', fontFamily: "'IBM Plex Sans', monospace", letterSpacing: '.5px' }}>{bank.no}</div>
              <div style={{ fontSize: 11.5, color: '#8a97a2' }}>{bank.holder}</div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Receipt Payment Box */}
      {isReceipt && (
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 26, background: '#f1f7f3', border: '1px solid #d6e7dd', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 200px' }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: '#e0efe7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 22, color: '#3d8a64' }}>account_balance_wallet</span>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#6a8478' }}>วิธีชำระเงิน / Payment Method</div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: '#2f5a45' }}>{payMethod || '—'}</div>
            </div>
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <div style={{ fontSize: 12, color: '#6a8478' }}>วันที่รับชำระ / Payment Date</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#2f5a45', fontFamily: "'IBM Plex Sans', monospace", marginTop: 2 }}>{payDate || '—'}</div>
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <div style={{ fontSize: 12, color: '#6a8478' }}>อ้างอิงการชำระ / Payment Ref</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#2f5a45', fontFamily: "'IBM Plex Sans', monospace", marginTop: 2 }}>{payRef || '—'}</div>
          </div>
          {slipUrl && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={slipUrl} alt="slip" style={{ width: 64, height: 'auto', borderRadius: 8, display: 'block' }} />
              <span style={{ fontSize: 10, color: '#6a8478' }}>สลิปการโอน</span>
            </div>
          )}
        </div>
      )}

      {/* 8. Signatures */}
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 38 }}>
        <div style={{ flex: '1 1 150px', textAlign: 'center' }}>
          <div style={{ fontSize: 11.5, color: '#6a7884', textAlign: 'left', marginBottom: 30 }}>{sigLeftTh} <span style={{ color: '#a3aeb8' }}>{sigLeftEn}</span></div>
          <div style={{ borderBottom: '1px solid #c4cdd5', marginBottom: 8 }} />
          <div style={{ fontSize: 12.5, color: '#3a4654', fontWeight: 600 }}>{co.name}</div>
          <div style={{ fontSize: 11.5, color: '#9aa7b2', fontFamily: "'IBM Plex Sans', monospace" }}>{issueDate}</div>
        </div>
        <div style={{ flex: '1 1 150px', textAlign: 'center' }}>
          <div style={{ fontSize: 11.5, color: '#6a7884', textAlign: 'left', marginBottom: 30 }}>{sigRightTh} <span style={{ color: '#a3aeb8' }}>{sigRightEn}</span></div>
          <div style={{ borderBottom: '1px solid #c4cdd5', marginBottom: 8 }} />
          <div style={{ fontSize: 12.5, color: '#c4cdd5' }}>&nbsp;</div>
          <div style={{ fontSize: 11.5, color: '#9aa7b2', fontFamily: "'IBM Plex Sans', monospace" }}>{issueDate}</div>
        </div>
      </div>
    </>
  )
}

'use client'

import { CompanyInfo, FALLBACK_COMPANY } from '@/lib/company'

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

// Default Terms & Conditions lines (editable per quotation).
export const DEFAULT_TERMS = [
  'ระยะเวลาออกแบบ 7-10 วัน ( ไม่รวมพิมพ์ )',
  'การแก้ไข : แก้ไขได้ไม่จำกัดครั้ง',
  'เป็นเพียงข้อเสนอราคาเท่านั้น',
]

interface QuotationDocItem {
  name: string
  detail?: string
  qty: number
  unit: string
  price: number
}

interface QuotationDocProps {
  no: string
  status: string
  issueDate: string
  expiry?: string | null
  clientName?: string
  clientAddress?: string
  clientTaxId?: string
  clientContact?: string
  clientPhone?: string
  items: QuotationDocItem[]
  discount?: number
  vatEnabled?: boolean
  paymentTerm?: string
  bankIndex?: number
  banks?: BankView[]
  notes?: string
  terms?: string[]
  projectName?: string
  ownerName?: string
  company?: CompanyInfo
}

export default function QuotationDoc(props: QuotationDocProps) {
  const co = props.company || FALLBACK_COMPANY
  const sellerAddress = [co.address, co.province, co.postalCode].filter(Boolean).join(' ')
  const items = props.items || []
  const sub = items.reduce((s, i) => s + i.qty * i.price, 0)
  const afterDiscount = sub - (props.discount || 0)
  const vat = props.vatEnabled ? afterDiscount * 0.07 : 0
  const total = afterDiscount + vat

  const customerName = props.clientName || '—'

  const bankList = props.banks?.length ? props.banks : FALLBACK_BANKS
  const bank = bankList[props.bankIndex || 0] || bankList[0]
  const term = (props.paymentTerm || '').toLowerCase()
  const isDeposit = term.includes('deposit') || (props.paymentTerm || '').includes('มัดจำ')
  const payTermNote = isDeposit ? 'มัดจำ 50% ก่อนเริ่มงาน · ส่วนที่เหลือชำระเมื่อส่งมอบงาน' : 'ชำระเต็มจำนวนก่อนเริ่มงาน'
  const payTermLine = isDeposit ? 'การชำระเงิน : มัดจำ 50% ก่อนเริ่มงาน ที่เหลือชำระเมื่อส่งมอบ' : 'การชำระเงิน : ชำระเต็มจำนวนก่อนเริ่มงาน'
  const depositAmt = total * 0.5
  const balanceAmt = total - depositAmt
  const signDate = props.issueDate || ''
  const termsList = props.terms && props.terms.length ? props.terms : DEFAULT_TERMS

  return (
    <>
      {/* 1. Top Row: Title + Logo */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 27, fontWeight: 700, color: '#3a4654', lineHeight: 1 }}>ใบเสนอราคา</div>
          <div style={{ fontSize: 13, letterSpacing: 6, color: '#9aa7b2', fontWeight: 500, marginTop: 5 }}>QUOTATION</div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={co.logo || '/mewyou-wordmark.png'} alt={co.name} style={{ height: 58, width: 'auto', maxWidth: 180, objectFit: 'contain', display: 'block', flexShrink: 0 }} />
      </div>

      {/* 2. Info Section: Customer + Metadata */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
        {/* Customer info box */}
        <div style={{ flex: '1.15 1 300px' }}>
          <div style={{ background: '#eef1f4', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '9px 14px' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 17, color: '#8294a6', marginTop: 1 }}>person</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#8a97a2' }}>ลูกค้า / Client</div>
                <div style={{ fontSize: 12.5, color: '#3a4654', fontWeight: 600, marginTop: 1 }}>{customerName}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '0 14px 8px' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 17, color: '#8294a6', marginTop: 1 }}>location_on</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#8a97a2' }}>ที่อยู่ / Address</div>
                <div style={{ fontSize: 12, color: '#4a5763', marginTop: 1, lineHeight: 1.45 }}>
                  {props.clientAddress || '—'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '0 14px 9px' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 17, color: '#8294a6', marginTop: 1 }}>badge</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#8a97a2' }}>เลขประจำตัวผู้เสียภาษี</div>
                <div style={{ fontSize: 12.5, color: '#3a4654', fontWeight: 600, marginTop: 1, fontFamily: "'IBM Plex Sans', monospace" }}>
                  {props.clientTaxId || '—'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 14px', background: '#dde4ea' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 17, color: '#6e8295' }}>contact_page</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#7e8b96' }}>ผู้ติดต่อ / Attention</div>
                <div style={{ fontSize: 13, color: '#3a4654', fontWeight: 700, marginTop: 1 }}>
                  {props.clientContact || '—'}
                </div>
              </div>
            </div>
          </div>
          {props.clientPhone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 14px 0' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 17, color: '#8294a6' }}>call</span>
              <span style={{ fontSize: 11.5, color: '#8a97a2' }}>โทร / Tel :</span>
              <span style={{ fontSize: 12.5, color: '#3a4654', fontWeight: 600, fontFamily: "'IBM Plex Sans', monospace" }}>{props.clientPhone}</span>
            </div>
          )}
        </div>

        {/* Metadata list */}
        <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 9, paddingTop: 1 }}>
          {[
            { icon: 'tag', label: 'เลขที่เอกสาร', value: props.no },
            { icon: 'calendar_today', label: 'วันที่ออก', value: props.issueDate },
            { icon: 'event_available', label: 'วันหมดอายุ', value: props.expiry || '—' },
            { icon: 'folder_open', label: 'โปรเจกต์', value: props.projectName || '—' },
            { icon: 'person', label: 'ผู้รับผิดชอบ', value: props.ownerName || '—' },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#8294a6' }}>{row.icon}</span>
              <span style={{ flex: 1, fontSize: 12, color: '#6a7884' }}>{row.label}</span>
              <span style={{ color: '#b8c2cb' }}>:</span>
              <span style={{ fontSize: 12.5, color: '#3a4654', fontWeight: 600, fontFamily: "'IBM Plex Sans', monospace", minWidth: 110, textAlign: 'right' }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Seller + Contact */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
        {/* Seller info */}
        <div style={{ flex: '1.15 1 300px', display: 'flex', gap: 13 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={co.logo || '/mewyou-monogram.png'} alt="logo" style={{ width: 66, height: 66, borderRadius: 7, flexShrink: 0, display: 'block', objectFit: 'contain', background: '#fff' }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 600, color: '#5a6772', background: '#eef1f4', padding: '3px 10px', borderRadius: 6, marginBottom: 5 }}>
              ผู้ขอเสนอราคา / <span style={{ color: '#8a97a2', fontWeight: 500 }}>Quotation From</span>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#3a4654' }}>{co.name}{co.branch ? ` (${co.branch})` : ''}</div>
            {sellerAddress && (
              <div style={{ fontSize: 11, color: '#6a7884', marginTop: 2, lineHeight: 1.45 }}>{sellerAddress}</div>
            )}
            {co.taxId && (
              <div style={{ fontSize: 11.5, color: '#3a4654', fontWeight: 600, marginTop: 4 }}>
                เลขประจำตัวผู้เสียภาษี : <span style={{ fontFamily: "'IBM Plex Sans', monospace" }}>{co.taxId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Contact */}
        <div style={{ flex: '1 1 280px' }}>
          <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 600, color: '#5a6772', background: '#eef1f4', padding: '3px 10px', borderRadius: 6, marginBottom: 8 }}>
            ติดต่อเรา / <span style={{ color: '#8a97a2', fontWeight: 500 }}>Contact Us</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[
              co.contactName ? { icon: 'person', text: co.contactName } : null,
              co.phone ? { icon: 'call', text: co.phone, mono: true } : null,
              co.email ? { icon: 'mail', text: co.email } : null,
              co.website ? { icon: 'chat', text: co.website } : null,
            ].filter((r): r is { icon: string; text: string; mono?: boolean } => !!r).map(row => (
              <div key={row.icon + row.text} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#4a5763' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#8294a6' }}>{row.icon}</span>
                <span style={row.mono ? { fontFamily: "'IBM Plex Sans', monospace" } : {}}>{row.text}</span>
              </div>
            ))}
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
          <div style={{ padding: '7px 8px', textAlign: 'center', borderRight: '1px solid #c2cfda' }}>
            ลำดับ<div style={{ fontSize: 10.5, fontWeight: 400, color: '#5a6776' }}>No.</div>
          </div>
          <div style={{ padding: '7px 12px', borderRight: '1px solid #c2cfda' }}>
            รายละเอียด / <span style={{ fontWeight: 400 }}>Description</span>
          </div>
          <div style={{ padding: '7px 8px', textAlign: 'center', borderRight: '1px solid #c2cfda' }}>
            จำนวน<div style={{ fontSize: 10.5, fontWeight: 400, color: '#5a6776' }}>Quantity</div>
          </div>
          <div style={{ padding: '7px 8px', textAlign: 'center', borderRight: '1px solid #c2cfda' }}>
            หน่วย<div style={{ fontSize: 10.5, fontWeight: 400, color: '#5a6776' }}>Unit</div>
          </div>
          <div style={{ padding: '7px 8px', textAlign: 'right', borderRight: '1px solid #c2cfda' }}>
            ราคาต่อหน่วย<div style={{ fontSize: 10.5, fontWeight: 400, color: '#5a6776' }}>Unit Price</div>
          </div>
          <div style={{ padding: '7px 8px', textAlign: 'right' }}>
            จำนวนเงิน<div style={{ fontSize: 10.5, fontWeight: 400, color: '#5a6776' }}>Amount</div>
          </div>
        </div>

        {/* Item Rows */}
        {items.map((item, idx) => (
          <div key={idx} style={{
            display: 'grid', gridTemplateColumns: '54px 1fr 84px 74px 116px 116px',
            fontSize: 13, color: '#3a4654', borderBottom: '1px solid #eef1f4',
          }}>
            <div style={{ padding: '8px 8px', textAlign: 'center', borderRight: '1px solid #f0f2f5' }}>{idx + 1}</div>
            <div style={{ padding: '8px 12px', borderRight: '1px solid #f0f2f5' }}>
              <div>{item.name}</div>
              {item.detail && <div style={{ fontSize: 12, color: '#9aa7b2', marginTop: 3 }}>{item.detail}</div>}
            </div>
            <div style={{ padding: '8px 8px', textAlign: 'center', borderRight: '1px solid #f0f2f5', fontFamily: "'IBM Plex Sans', monospace" }}>{item.qty}</div>
            <div style={{ padding: '8px 8px', textAlign: 'center', borderRight: '1px solid #f0f2f5' }}>{item.unit}</div>
            <div style={{ padding: '8px 8px', textAlign: 'right', borderRight: '1px solid #f0f2f5', fontFamily: "'IBM Plex Sans', monospace" }}>฿{fmt(item.price)}</div>
            <div style={{ padding: '8px 8px', textAlign: 'right', fontFamily: "'IBM Plex Sans', monospace" }}>฿{fmt(item.qty * item.price)}</div>
          </div>
        ))}

        {/* Empty lined area */}
        <div className="doc-filler" style={{
          minHeight: 24,
          background: 'repeating-linear-gradient(#ffffff,#ffffff 43px,#f4f6f8 43px,#f4f6f8 44px)',
        }} />

        {/* Remark footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 13px', borderTop: '1px solid #e8ebee', background: '#fbfcfd' }}>
          <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#8294a6' }}>chat</span>
          <span style={{ fontSize: 12.5, color: '#7a8893', fontWeight: 600 }}>หมายเหตุ / Remark</span>
          <span style={{ fontSize: 12.5, color: '#5a6772' }}>{props.notes || ''}</span>
        </div>
      </div>

      {/* 5. Summary */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 16 }}>
        <div style={{ flex: '1.05 1 300px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#3a4654', marginBottom: 10 }}>
            สรุป <span style={{ color: '#9aa7b2', fontWeight: 500, fontSize: 13 }}>/ Summary</span>
          </div>
          {(props.discount || 0) > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', fontSize: 13, color: '#5a6772', marginBottom: 8 }}>
                <span>ราคารวมก่อนหักส่วนลด</span>
                <span style={{ fontFamily: "'IBM Plex Sans', monospace", whiteSpace: 'nowrap' }}>{fmt(sub)} บาท</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', fontSize: 13, color: '#c4593f', fontWeight: 600, marginBottom: 11 }}>
                <span>ส่วนลด / Discount</span>
                <span style={{ fontFamily: "'IBM Plex Sans', monospace", whiteSpace: 'nowrap' }}>-{fmt(props.discount || 0)} บาท</span>
              </div>
            </>
          )}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', fontSize: 13, color: '#5a6772', marginBottom: 11 }}>
            <span>มูลค่ารายการไม่รวมภาษี หรือยกเว้นภาษีมูลค่าเพิ่ม</span>
            <span style={{ fontFamily: "'IBM Plex Sans', monospace", whiteSpace: 'nowrap' }}>{fmt(afterDiscount)} บาท</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: '#3a4654' }}>จำนวนเงินทั้งสิ้น</span>
            <span style={{ fontSize: 15.5, fontWeight: 700, color: '#6e8aa6', fontFamily: "'IBM Plex Sans', monospace" }}>{fmt(total)} บาท</span>
          </div>
          <div style={{ fontSize: 12.5, color: '#7a8893', fontWeight: 600 }}>({bahtText(total)})</div>
        </div>
        <div style={{ flex: '1 1 280px' }}>
          <div style={{ background: '#eef1f4', borderRadius: '9px 9px 0 0', padding: '11px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', fontSize: 13, color: '#5a6772', marginBottom: 10 }}>
              <span>มูลค่าเพิ่ม 7%</span>
              <span style={{ fontFamily: "'IBM Plex Sans', monospace" }}>{fmt(vat)} บาท</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', fontSize: 13, color: '#5a6772' }}>
              <span>จำนวนเงินที่ต้องชำระ</span>
              <span style={{ fontFamily: "'IBM Plex Sans', monospace" }}>{fmt(afterDiscount)} บาท</span>
            </div>
          </div>
          <div style={{ background: '#8294a6', borderRadius: '0 0 9px 9px', padding: '11px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ fontSize: 12.5, color: '#e8edf2', fontWeight: 500 }}>จำนวนเงินทั้งสิ้น (รวมภาษีมูลค่าเพิ่ม)</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: "'IBM Plex Sans', monospace", whiteSpace: 'nowrap' }}>{fmt(total)} บาท</span>
          </div>
        </div>
      </div>

      {/* 6. Payment + Terms */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 16, paddingTop: 14, borderTop: '1px solid #eef1f4' }}>
        {/* Payment */}
        <div style={{ flex: '1 1 280px' }}>
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
          <div style={{ marginTop: 11, paddingTop: 10, borderTop: '1px solid #f0f2f5', fontSize: 13 }}>
            <span style={{ color: '#5a6772' }}>หมายเหตุ / Note : </span>
            <span style={{ color: '#6e8aa6', fontWeight: 600 }}>{payTermNote}</span>
          </div>
          {isDeposit && (
            <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, background: '#eef3f7', borderRadius: 10, padding: '11px 13px' }}>
                <div style={{ fontSize: 11, color: '#7e8b96' }}>มัดจำ 50% / Deposit</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#5f7d99', fontFamily: "'IBM Plex Sans', monospace", marginTop: 2 }}>{fmt(depositAmt)} บาท</div>
              </div>
              <div style={{ flex: 1, background: '#f5f7f9', borderRadius: 10, padding: '11px 13px' }}>
                <div style={{ fontSize: 11, color: '#9aa7b2' }}>คงเหลือ / Balance</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#7a8893', fontFamily: "'IBM Plex Sans', monospace", marginTop: 2 }}>{fmt(balanceAmt)} บาท</div>
              </div>
            </div>
          )}
        </div>
        {/* Terms */}
        <div style={{ flex: '1 1 280px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#3a4654', marginBottom: 13 }}>
            เงื่อนไข <span style={{ color: '#9aa7b2', fontWeight: 500, fontSize: 12.5 }}>/ Terms &amp; Conditions</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 12.5, color: '#5a6772', lineHeight: 1.5 }}>
            <div style={{ display: 'flex', gap: 8 }}><span style={{ color: '#8294a6' }}>•</span>{payTermLine}</div>
            {termsList.map((line, i) => {
              const last = i === termsList.length - 1
              return (
                <div key={i} style={{ display: 'flex', gap: 8, marginTop: last ? 4 : 0 }}>
                  <span style={{ color: last ? '#6e8aa6' : '#8294a6' }}>•</span>
                  <span style={last ? { color: '#6e8aa6', fontWeight: 600 } : undefined}>{line}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 7. Signatures */}
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 18 }}>
        <div style={{ flex: '1 1 150px', textAlign: 'center' }}>
          <div style={{ fontSize: 11.5, color: '#6a7884', textAlign: 'left', marginBottom: 18 }}>ผู้ออกเอกสาร <span style={{ color: '#a3aeb8' }}>/ Prepared By</span></div>
          <div style={{ borderBottom: '1px solid #c4cdd5', marginBottom: 8 }} />
          <div style={{ fontSize: 12.5, color: '#3a4654', fontWeight: 600 }}>{co.contactName || co.name}</div>
          <div style={{ fontSize: 11.5, color: '#9aa7b2', fontFamily: "'IBM Plex Sans', monospace" }}>{signDate}</div>
        </div>
        <div style={{ flex: '1 1 150px', textAlign: 'center' }}>
          <div style={{ fontSize: 11.5, color: '#6a7884', textAlign: 'left', marginBottom: 6 }}>ตราประทับ <span style={{ color: '#a3aeb8' }}>/ Company Stamp</span></div>
          <div style={{ height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={co.logo || '/mewyou-wordmark.png'} alt="stamp" style={{ height: 30, maxWidth: 120, objectFit: 'contain', opacity: 0.4 }} />
          </div>
          <div style={{ borderBottom: '1px solid #c4cdd5', marginBottom: 8 }} />
          <div style={{ fontSize: 12.5, color: '#3a4654', fontWeight: 600 }}>{co.name}</div>
          <div style={{ fontSize: 11.5, color: '#9aa7b2', fontFamily: "'IBM Plex Sans', monospace" }}>{signDate}</div>
        </div>
        <div style={{ flex: '1 1 150px', textAlign: 'center' }}>
          <div style={{ fontSize: 11.5, color: '#6a7884', textAlign: 'left', marginBottom: 18 }}>ผู้รับใบเสนอราคา <span style={{ color: '#a3aeb8' }}>/ Receiver</span></div>
          <div style={{ borderBottom: '1px solid #c4cdd5', marginBottom: 8 }} />
          <div style={{ fontSize: 12.5, color: '#c4cdd5' }}>&nbsp;</div>
          <div style={{ fontSize: 11.5, color: '#9aa7b2', fontFamily: "'IBM Plex Sans', monospace" }}>{signDate}</div>
        </div>
        <div style={{ flex: '1 1 150px', textAlign: 'center' }}>
          <div style={{ fontSize: 11.5, color: '#6a7884', textAlign: 'left', marginBottom: 18 }}>ตราประทับ <span style={{ color: '#a3aeb8' }}>/ Company Stamp</span></div>
          <div style={{ borderBottom: '1px solid #c4cdd5', marginBottom: 8 }} />
          <div style={{ fontSize: 12.5, color: '#c4cdd5' }}>&nbsp;</div>
          <div style={{ fontSize: 11.5, color: '#9aa7b2', fontFamily: "'IBM Plex Sans', monospace" }}>{signDate}</div>
        </div>
      </div>
    </>
  )
}

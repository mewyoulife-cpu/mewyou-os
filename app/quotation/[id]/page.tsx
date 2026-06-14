'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { printDocNode } from '@/lib/printDoc'

interface Item {
  name: string
  detail: string
  qty: number
  unit: string
  price: number
}

interface Quotation {
  id: string
  no: string
  status: 'draft' | 'sent' | 'approved' | 'rejected'
  issueDate: string
  expiry?: string
  clientName?: string
  clientAddress?: string
  clientTaxId?: string
  clientContact?: string
  clientPhone?: string
  items: string
  discount: number
  vatEnabled: boolean
  paymentTerm: string
  bankIndex: number
  notes?: string
  projectName?: string
  ownerName?: string
  customer?: { name: string; company?: string; email?: string }
}

const statusMap: Record<string, { label: string; bg: string; color: string }> = {
  draft:    { label: 'ร่าง',        bg: '#e8eef4', color: '#5f7d99' },
  sent:     { label: 'ส่งแล้ว',     bg: '#fdf3e3', color: '#f4a431' },
  approved: { label: 'อนุมัติแล้ว', bg: '#e9f3ed', color: '#3d8a64' },
  rejected: { label: 'ปฏิเสธ',      bg: '#fceee8', color: '#e07b54' },
}

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

interface BankView { name: string; type: string; no: string; holder: string; brand: string; icon: string }

function bankBrand(name: string): { brand: string; icon: string } {
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

export default function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [quotation, setQuotation] = useState<Quotation | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [banks, setBanks] = useState<BankView[]>([])
  const docRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/quotations/${id}`)
      .then(r => r.json())
      .then(data => {
        setQuotation(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
    fetch('/api/banks').then(r => r.json()).then(d => {
      const list: { bank: string; accountNo: string; name: string }[] = Array.isArray(d) ? d : []
      if (!list.length) return
      setBanks(list.map(b => ({ name: b.bank, type: '', no: b.accountNo, holder: b.name, ...bankBrand(b.bank) })))
    }).catch(() => {})
  }, [id])

  async function handleSave() {
    if (!quotation) return
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: quotation.status,
          issueDate: quotation.issueDate,
          expiry: quotation.expiry ?? null,
          items: quotation.items,
          discount: quotation.discount,
          vatEnabled: quotation.vatEnabled,
          paymentTerm: quotation.paymentTerm,
          bankIndex: quotation.bankIndex,
          clientName: quotation.clientName ?? null,
          clientAddress: quotation.clientAddress ?? null,
          clientTaxId: quotation.clientTaxId ?? null,
          clientContact: quotation.clientContact ?? null,
          clientPhone: quotation.clientPhone ?? null,
          notes: quotation.notes ?? null,
        }),
      })
      const data = await res.json()
      setQuotation(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!quotation) return
    if (!confirm(`ต้องการลบใบเสนอราคา ${quotation.no} ใช่หรือไม่?`)) return
    setDeleting(true)
    try {
      await fetch(`/api/quotations/${id}`, { method: 'DELETE' })
      router.push('/quotation')
    } catch {
      setDeleting(false)
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่')
    }
  }

  function handleExportPdf() {
    if (!quotation) return
    setExporting(true)
    printDocNode(docRef.current, quotation.no)
    setTimeout(() => setExporting(false), 1000)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#9aa7b2', gap: 10 }}>
        <span className="material-symbols-rounded" style={{ fontSize: 32 }}>hourglass_empty</span>
        กำลังโหลด...
      </div>
    )
  }

  if (!quotation) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#7a8893' }}>
        <span className="material-symbols-rounded" style={{ fontSize: 48, display: 'block', marginBottom: 12, color: '#d0d8e0' }}>error</span>
        ไม่พบใบเสนอราคา
      </div>
    )
  }

  let items: Item[] = []
  try {
    items = typeof quotation.items === 'string' ? JSON.parse(quotation.items) : quotation.items
  } catch {}

  const sub = items.reduce((s, i) => s + i.qty * i.price, 0)
  const afterDiscount = sub - (quotation.discount || 0)
  const vat = quotation.vatEnabled ? afterDiscount * 0.07 : 0
  const total = afterDiscount + vat
  const st = statusMap[quotation.status] || statusMap.draft

  const customerName = quotation.clientName || quotation.customer?.company || quotation.customer?.name || '—'

  const bankList = banks.length ? banks : FALLBACK_BANKS
  const bank = bankList[quotation.bankIndex] || bankList[0]
  const term = (quotation.paymentTerm || '').toLowerCase()
  const isDeposit = term.includes('deposit') || (quotation.paymentTerm || '').includes('มัดจำ')
  const payTermNote = isDeposit ? 'มัดจำ 50% ก่อนเริ่มงาน · ส่วนที่เหลือชำระเมื่อส่งมอบงาน' : 'ชำระเต็มจำนวนก่อนเริ่มงาน'
  const payTermLine = isDeposit ? 'การชำระเงิน : มัดจำ 50% ก่อนเริ่มงาน ที่เหลือชำระเมื่อส่งมอบ' : 'การชำระเงิน : ชำระเต็มจำนวนก่อนเริ่มงาน'
  const depositAmt = total * 0.5
  const balanceAmt = total - depositAmt
  const signDate = quotation.issueDate || ''

  return (
    <div>
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          html, body { background: #fff !important; height: auto !important; overflow: visible !important; }
          .no-print { display: none !important; }
          body * { visibility: hidden !important; }
          .print-doc, .print-doc * { visibility: visible !important; }
          .print-doc {
            position: absolute !important;
            left: 0 !important; top: 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Breadcrumb */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#9aa7b2', margin: '16px 0 6px' }}>
        <Link href="/quotation" style={{ color: '#9aa7b2', textDecoration: 'none' }}>ใบเสนอราคา</Link>
        <span className="material-symbols-rounded" style={{ fontSize: 16 }}>chevron_right</span>
        <span style={{ color: '#5b6b77', fontWeight: 500, fontFamily: "'IBM Plex Sans', monospace" }}>{quotation.no}</span>
      </div>

      {/* Page Header */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, margin: '0 0 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 23, fontWeight: 700, color: '#2f3b45' }}>ใบเสนอราคา</div>
          <span style={{
            background: st.bg, color: st.color,
            borderRadius: 8, padding: '4px 12px', fontSize: 12.5, fontWeight: 600,
          }}>{st.label}</span>
        </div>
        <div style={{ display: 'flex', gap: 9 }}>
          <button
            onClick={handleExportPdf}
            disabled={exporting}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, height: 40, padding: '0 16px',
              border: '1px solid #e4e8ec', borderRadius: 10, fontSize: 13.5, color: '#5b6b77',
              fontWeight: 500, cursor: exporting ? 'wait' : 'pointer', background: '#fff',
              opacity: exporting ? 0.7 : 1,
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>picture_as_pdf</span>
            {exporting ? 'กำลังสร้าง...' : 'Export PDF'}
          </button>
          <button
            onClick={() => router.push(`/quotation/${id}/edit`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, height: 40, padding: '0 16px',
              border: '1px solid #e4e8ec', borderRadius: 10, fontSize: 13.5, color: '#5b6b77',
              fontWeight: 500, cursor: 'pointer', background: '#fff',
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>edit</span>
            แก้ไข
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, height: 40, padding: '0 18px',
              borderRadius: 10, background: saved ? '#3d8a64' : '#5f7d99', color: '#fff',
              fontSize: 13.5, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
              border: 'none', opacity: saving ? 0.7 : 1,
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>{saved ? 'check_circle' : 'save'}</span>
            {saving ? 'กำลังบันทึก...' : saved ? 'บันทึกแล้ว' : 'บันทึกข้อมูลใบเสนอราคา'}
          </button>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              style={{
                width: 40, height: 40, border: '1px solid #e4e8ec', borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', background: menuOpen ? '#f5f7f9' : '#fff',
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#5b6b77' }}>more_horiz</span>
            </button>
            {menuOpen && (
              <>
                <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 41,
                  background: '#fff', borderRadius: 12, border: '1px solid #edf0f3',
                  boxShadow: '0 8px 24px rgba(30,45,60,.14)', overflow: 'hidden', minWidth: 160,
                }}>
                  <button
                    onClick={() => { setMenuOpen(false); handleDelete() }}
                    disabled={deleting}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9, width: '100%',
                      padding: '11px 16px', border: 'none', background: '#fff',
                      fontSize: 13.5, fontWeight: 500, color: '#c4593f', cursor: 'pointer',
                      fontFamily: 'inherit', textAlign: 'left',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#fbe9e5'}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#fff'}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 19 }}>delete</span>
                    {deleting ? 'กำลังลบ...' : 'ลบใบเสนอราคา'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Document Card */}
      <div ref={docRef} className="print-doc" style={{
        background: '#ffffff', borderRadius: 14, border: '1px solid #edf0f3',
        padding: '46px 48px', maxWidth: 860, margin: '0 auto',
      }}>

        {/* 1. Top Row: Title + Logo */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 30 }}>
          <div>
            <div style={{ fontSize: 34, fontWeight: 700, color: '#3a4654', lineHeight: 1 }}>ใบเสนอราคา</div>
            <div style={{ fontSize: 15, letterSpacing: 7, color: '#9aa7b2', fontWeight: 500, marginTop: 8 }}>QUOTATION</div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mewyou-wordmark.png" alt="mew.you" style={{ height: 82, width: 'auto', display: 'block', flexShrink: 0 }} />
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
                  <div style={{ fontSize: 13.5, color: '#3a4654', fontWeight: 600, marginTop: 2 }}>{customerName}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '0 16px 13px' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#8294a6', marginTop: 1 }}>location_on</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, color: '#8a97a2' }}>ที่อยู่ / Address</div>
                  <div style={{ fontSize: 13, color: '#4a5763', marginTop: 2, lineHeight: 1.5 }}>
                    {quotation.clientAddress || '—'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '0 16px 14px' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#8294a6', marginTop: 1 }}>badge</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, color: '#8a97a2' }}>เลขประจำตัวผู้เสียภาษี</div>
                  <div style={{ fontSize: 13.5, color: '#3a4654', fontWeight: 600, marginTop: 2, fontFamily: "'IBM Plex Sans', monospace" }}>
                    {quotation.clientTaxId || '—'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 16px', background: '#dde4ea' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#6e8295' }}>contact_page</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, color: '#7e8b96' }}>ผู้ติดต่อ / Attention</div>
                  <div style={{ fontSize: 14, color: '#3a4654', fontWeight: 700, marginTop: 1 }}>
                    {quotation.clientContact || '—'}
                  </div>
                </div>
              </div>
            </div>
            {quotation.clientPhone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 16px 0' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#8294a6' }}>call</span>
                <span style={{ fontSize: 12.5, color: '#8a97a2' }}>โทร / Tel :</span>
                <span style={{ fontSize: 13.5, color: '#3a4654', fontWeight: 600, fontFamily: "'IBM Plex Sans', monospace" }}>{quotation.clientPhone}</span>
              </div>
            )}
          </div>

          {/* Metadata list */}
          <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 13, paddingTop: 2 }}>
            {[
              { icon: 'tag', label: 'เลขที่เอกสาร', value: quotation.no },
              { icon: 'calendar_today', label: 'วันที่ออก', value: quotation.issueDate },
              { icon: 'event_available', label: 'วันหมดอายุ', value: quotation.expiry || '—' },
              { icon: 'folder_open', label: 'โปรเจกต์', value: quotation.projectName || '—' },
              { icon: 'person', label: 'ผู้รับผิดชอบ', value: quotation.ownerName || '—' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#8294a6' }}>{row.icon}</span>
                <span style={{ flex: 1, fontSize: 13, color: '#6a7884' }}>{row.label}</span>
                <span style={{ color: '#b8c2cb' }}>:</span>
                <span style={{ fontSize: 13.5, color: '#3a4654', fontWeight: 600, fontFamily: "'IBM Plex Sans', monospace", minWidth: 120, textAlign: 'right' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Seller + Contact */}
        <div style={{ display: 'flex', gap: 34, flexWrap: 'wrap', marginBottom: 30 }}>
          {/* Seller info */}
          <div style={{ flex: '1.15 1 300px', display: 'flex', gap: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mewyou-monogram.png" alt="m" style={{ width: 96, height: 96, borderRadius: 7, flexShrink: 0, display: 'block', objectFit: 'cover' }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'inline-block', fontSize: 13, fontWeight: 600, color: '#5a6772', background: '#eef1f4', padding: '4px 12px', borderRadius: 6, marginBottom: 8 }}>
                ผู้ขอเสนอราคา / <span style={{ color: '#8a97a2', fontWeight: 500 }}>Quotation From</span>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#3a4654' }}>MEWYOU PACKAGING DESIGN</div>
              <div style={{ fontSize: 12, color: '#6a7884', marginTop: 3, lineHeight: 1.55 }}>
                สำนักงานขายใหญ่ บริษัท มิวอี้ ดีไซน์ ดิจิตอลเน็ตเวิร์ค จำกัด<br />
                111/159 ซอย ฉลองกรุง 53 แขวง ลาดกระบัง เขตลาดกระบัง กรุงเทพมหานคร 10520
              </div>
              <div style={{ fontSize: 12.5, color: '#3a4654', fontWeight: 600, marginTop: 6 }}>
                เลขประจำตัวผู้เสียภาษี : <span style={{ fontFamily: "'IBM Plex Sans', monospace" }}>0105560143099</span>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div style={{ flex: '1 1 280px' }}>
            <div style={{ display: 'inline-block', fontSize: 13, fontWeight: 600, color: '#5a6772', background: '#eef1f4', padding: '4px 12px', borderRadius: 6, marginBottom: 11 }}>
              ติดต่อเรา / <span style={{ color: '#8a97a2', fontWeight: 500 }}>Contact Us</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {[
                { icon: 'person', text: 'คุณ มิว' },
                { icon: 'call', text: '099-669-6959', mono: true },
                { icon: 'mail', text: 'mewyoulife@gmail.com' },
                { icon: 'chat', text: '@mewyou.design' },
              ].map(row => (
                <div key={row.icon + row.text} style={{ display: 'flex', alignItems: 'center', gap: 11, fontSize: 13, color: '#4a5763' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#8294a6' }}>{row.icon}</span>
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
            minHeight: 120,
            background: 'repeating-linear-gradient(#ffffff,#ffffff 43px,#f4f6f8 43px,#f4f6f8 44px)',
          }} />

          {/* Remark footer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderTop: '1px solid #e8ebee', background: '#fbfcfd' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#8294a6' }}>chat</span>
            <span style={{ fontSize: 12.5, color: '#7a8893', fontWeight: 600 }}>หมายเหตุ / Remark</span>
            <span style={{ fontSize: 12.5, color: '#5a6772' }}>{quotation.notes || ''}</span>
          </div>
        </div>

        {/* 5. Summary */}
        <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap', marginTop: 28 }}>
          <div style={{ flex: '1.05 1 300px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#3a4654', marginBottom: 14 }}>
              สรุป <span style={{ color: '#9aa7b2', fontWeight: 500, fontSize: 13 }}>/ Summary</span>
            </div>
            {(quotation.discount || 0) > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', fontSize: 13, color: '#5a6772', marginBottom: 8 }}>
                  <span>ราคารวมก่อนหักส่วนลด</span>
                  <span style={{ fontFamily: "'IBM Plex Sans', monospace", whiteSpace: 'nowrap' }}>{fmt(sub)} บาท</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', fontSize: 13, color: '#c4593f', fontWeight: 600, marginBottom: 11 }}>
                  <span>ส่วนลด / Discount</span>
                  <span style={{ fontFamily: "'IBM Plex Sans', monospace", whiteSpace: 'nowrap' }}>-{fmt(quotation.discount || 0)} บาท</span>
                </div>
              </>
            )}
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', fontSize: 13, color: '#5a6772', marginBottom: 11 }}>
              <span>มูลค่ารายการไม่รวมภาษี หรือยกเว้นภาษีมูลค่าเพิ่ม</span>
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
                <span>มูลค่าเพิ่ม 7%</span>
                <span style={{ fontFamily: "'IBM Plex Sans', monospace" }}>{fmt(vat)} บาท</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', fontSize: 13, color: '#5a6772' }}>
                <span>จำนวนเงินที่ต้องชำระ</span>
                <span style={{ fontFamily: "'IBM Plex Sans', monospace" }}>{fmt(afterDiscount)} บาท</span>
              </div>
            </div>
            <div style={{ background: '#8294a6', borderRadius: '0 0 9px 9px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontSize: 12.5, color: '#e8edf2', fontWeight: 500 }}>จำนวนเงินทั้งสิ้น (รวมภาษีมูลค่าเพิ่ม)</span>
              <span style={{ fontSize: 21, fontWeight: 700, color: '#fff', fontFamily: "'IBM Plex Sans', monospace", whiteSpace: 'nowrap' }}>{fmt(total)} บาท</span>
            </div>
          </div>
        </div>

        {/* 6. Payment + Terms */}
        <div style={{ display: 'flex', gap: 34, flexWrap: 'wrap', marginTop: 34, paddingTop: 26, borderTop: '1px solid #eef1f4' }}>
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
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f0f2f5', fontSize: 13 }}>
              <span style={{ color: '#5a6772' }}>หมายเหตุ / Note : </span>
              <span style={{ color: '#6e8aa6', fontWeight: 600 }}>{payTermNote}</span>
            </div>
            {isDeposit && (
              <div style={{ marginTop: 13, display: 'flex', gap: 10 }}>
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
              <div style={{ display: 'flex', gap: 8 }}><span style={{ color: '#8294a6' }}>•</span>ระยะเวลาออกแบบ 7-10 วัน ( ไม่รวมพิมพ์ )</div>
              <div style={{ display: 'flex', gap: 8 }}><span style={{ color: '#8294a6' }}>•</span>การแก้ไข : แก้ไขได้ไม่จำกัดครั้ง</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}><span style={{ color: '#6e8aa6' }}>•</span><span style={{ color: '#6e8aa6', fontWeight: 600 }}>เป็นเพียงข้อเสนอราคาเท่านั้น</span></div>
            </div>
          </div>
        </div>

        {/* 7. Signatures */}
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 38 }}>
          <div style={{ flex: '1 1 150px', textAlign: 'center' }}>
            <div style={{ fontSize: 11.5, color: '#6a7884', textAlign: 'left', marginBottom: 30 }}>ผู้ออกเอกสาร <span style={{ color: '#a3aeb8' }}>/ Prepared By</span></div>
            <div style={{ borderBottom: '1px solid #c4cdd5', marginBottom: 8 }} />
            <div style={{ fontSize: 12.5, color: '#3a4654', fontWeight: 600 }}>จิรันต์เวธ ทับทิมแดง</div>
            <div style={{ fontSize: 11.5, color: '#9aa7b2', fontFamily: "'IBM Plex Sans', monospace" }}>{signDate}</div>
          </div>
          <div style={{ flex: '1 1 150px', textAlign: 'center' }}>
            <div style={{ fontSize: 11.5, color: '#6a7884', textAlign: 'left', marginBottom: 6 }}>ตราประทับ <span style={{ color: '#a3aeb8' }}>/ Company Stamp</span></div>
            <div style={{ height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/mewyou-wordmark.png" alt="stamp" style={{ height: 30, opacity: 0.4 }} />
            </div>
            <div style={{ borderBottom: '1px solid #c4cdd5', marginBottom: 8 }} />
            <div style={{ fontSize: 12.5, color: '#3a4654', fontWeight: 600 }}>Mew you packaging</div>
            <div style={{ fontSize: 11.5, color: '#9aa7b2', fontFamily: "'IBM Plex Sans', monospace" }}>{signDate}</div>
          </div>
          <div style={{ flex: '1 1 150px', textAlign: 'center' }}>
            <div style={{ fontSize: 11.5, color: '#6a7884', textAlign: 'left', marginBottom: 30 }}>ผู้รับใบเสนอราคา <span style={{ color: '#a3aeb8' }}>/ Receiver</span></div>
            <div style={{ borderBottom: '1px solid #c4cdd5', marginBottom: 8 }} />
            <div style={{ fontSize: 12.5, color: '#c4cdd5' }}>&nbsp;</div>
            <div style={{ fontSize: 11.5, color: '#9aa7b2', fontFamily: "'IBM Plex Sans', monospace" }}>{signDate}</div>
          </div>
          <div style={{ flex: '1 1 150px', textAlign: 'center' }}>
            <div style={{ fontSize: 11.5, color: '#6a7884', textAlign: 'left', marginBottom: 30 }}>ตราประทับ <span style={{ color: '#a3aeb8' }}>/ Company Stamp</span></div>
            <div style={{ borderBottom: '1px solid #c4cdd5', marginBottom: 8 }} />
            <div style={{ fontSize: 12.5, color: '#c4cdd5' }}>&nbsp;</div>
            <div style={{ fontSize: 11.5, color: '#9aa7b2', fontFamily: "'IBM Plex Sans', monospace" }}>{signDate}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

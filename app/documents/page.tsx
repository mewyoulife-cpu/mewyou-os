'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Document {
  id: string
  no: string
  type: 'invoice' | 'receipt' | 'taxinvoice'
  status: string
  issueDate: string
  clientName?: string
  items: string
  discount: number
  vatEnabled: boolean
  delivery?: string
  payMethod?: string
  payDate?: string
  payRef?: string
}

const typeConfig = {
  invoice: { label: 'ใบแจ้งหนี้', labelEn: 'INVOICE', icon: 'receipt_long', color: '#6b96c2', bg: '#e8f1f9' },
  receipt: { label: 'ใบเสร็จ', labelEn: 'RECEIPT', icon: 'check_circle', color: '#3d8a64', bg: '#e9f3ed' },
  taxinvoice: { label: 'ใบกำกับภาษี', labelEn: 'TAX INVOICE', icon: 'gavel', color: '#9c7c5a', bg: '#f5ece3' },
}

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  draft: { label: 'ร่าง', bg: '#f0f2f5', color: '#8a97a2' },
  sent: { label: 'ส่งแล้ว', bg: '#e8f1f9', color: '#6b96c2' },
  paid: { label: 'ชำระแล้ว', bg: '#e9f3ed', color: '#3d8a64' },
  overdue: { label: 'เกินกำหนด', bg: '#fceee8', color: '#e07b54' },
}

const TABS = ['เอกสารทั้งหมด', 'ใบแจ้งหนี้', 'ใบเสร็จ', 'ใบกำกับภาษี', 'ติดตามการส่ง']
const TAB_TYPES = [null, 'invoice', 'receipt', 'taxinvoice', 'tracking']

function calcTotal(doc: Document): number {
  try {
    const items = typeof doc.items === 'string' ? JSON.parse(doc.items) : doc.items
    const sub = items.reduce((s: number, i: { qty: number; price: number }) => s + i.qty * i.price, 0)
    const afterDiscount = sub - (doc.discount || 0)
    return doc.vatEnabled ? afterDiscount * 1.07 : afterDiscount
  } catch {
    return 0
  }
}

function fmt(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

type DocTypeKey = keyof typeof typeConfig

export default function DocumentsPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetch('/api/documents')
      .then(r => r.json())
      .then(data => {
        setDocuments(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const activeType = TAB_TYPES[activeTab]
  const filtered = activeType && activeType !== 'tracking'
    ? documents.filter(d => d.type === activeType)
    : documents

  const taxDocs = documents.filter(d => d.type === 'taxinvoice')

  return (
    <div>
      <style>{`
        .tab-btn:hover { background: #f0f2f5 !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#2f3b45', margin: 0 }}>เอกสาร</h1>
          <p style={{ fontSize: 14, color: '#7a8893', margin: '4px 0 0' }}>{documents.length} รายการ</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            background: '#5f7d99', color: '#fff', border: 'none', borderRadius: 10,
            padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>add</span>
          สร้างเอกสาร
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {(Object.entries(typeConfig) as [DocTypeKey, typeof typeConfig[DocTypeKey]][]).map(([key, cfg]) => {
          const count = documents.filter(d => d.type === key).length
          return (
            <div key={key} style={{
              background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 22,
              display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer',
            }}
              onClick={() => setActiveTab(TAB_TYPES.indexOf(key))}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 12, background: cfg.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 24, color: cfg.color }}>{cfg.icon}</span>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#2f3b45', lineHeight: 1 }}>{count}</div>
                <div style={{ fontSize: 13, color: '#7a8893', marginTop: 4 }}>{cfg.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {TABS.map((tab, idx) => (
          <button
            key={tab}
            className="tab-btn"
            onClick={() => setActiveTab(idx)}
            style={{
              padding: '8px 16px', border: 'none', borderRadius: 10, cursor: 'pointer',
              fontSize: 13, fontWeight: activeTab === idx ? 700 : 500,
              background: activeTab === idx ? '#5f7d99' : 'transparent',
              color: activeTab === idx ? '#fff' : '#7a8893',
              transition: 'all 0.15s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tracking Tab */}
      {activeTab === 4 ? (
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', overflow: 'hidden' }}>
          {taxDocs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#9aa7b2' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 48, display: 'block', marginBottom: 12, color: '#d0d8e0' }}>local_shipping</span>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#7a8893', marginBottom: 6 }}>ยังไม่มีใบกำกับภาษี</div>
              <div style={{ fontSize: 13 }}>ใบกำกับภาษีจะแสดงที่นี่</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #edf0f3' }}>
                  {['เลขที่', 'ลูกค้า', 'ส่งทางอีเมล', 'ส่งทางไปรษณีย์', 'ขนส่ง', 'เลข Tracking', 'วันที่ส่ง', 'สถานะ'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#9aa7b2', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {taxDocs.map((doc, idx) => {
                  const emailSent = !!doc.payRef
                  const postSent = !!doc.delivery
                  const statusLabel = !emailSent && !postSent ? 'ยังไม่ส่ง' : (emailSent && postSent ? 'ส่งครบแล้ว' : 'ส่งบางส่วน')
                  const statusStyle = statusLabel === 'ยังไม่ส่ง'
                    ? { bg: '#fceee8', color: '#e07b54' }
                    : statusLabel === 'ส่งบางส่วน'
                    ? { bg: '#fdf3e3', color: '#f4a431' }
                    : { bg: '#e9f3ed', color: '#3d8a64' }
                  return (
                    <tr key={doc.id} style={{ borderBottom: idx < taxDocs.length - 1 ? '1px solid #f5f7f9' : 'none' }}>
                      <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#5f7d99', cursor: 'pointer' }}
                        onClick={() => router.push(`/documents/${doc.id}`)}
                      >{doc.no}</td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: '#4a5a67' }}>{doc.clientName || '—'}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 18, color: emailSent ? '#3d8a64' : '#d0d8e0' }}>
                          {emailSent ? 'check_circle' : 'cancel'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 18, color: postSent ? '#3d8a64' : '#d0d8e0' }}>
                          {postSent ? 'check_circle' : 'cancel'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#7a8893' }}>{doc.delivery || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#7a8893' }}>{doc.payRef || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#7a8893' }}>{doc.payDate || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          background: statusStyle.bg, color: statusStyle.color,
                          borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 600,
                        }}>{statusLabel}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* Main Table */
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#9aa7b2', padding: 60 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>hourglass_empty</span>
              กำลังโหลด...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9aa7b2', padding: 60 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 48, display: 'block', marginBottom: 12, color: '#d0d8e0' }}>folder_open</span>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#7a8893', marginBottom: 6 }}>ยังไม่มีเอกสาร</div>
              <div style={{ fontSize: 13 }}>กดปุ่ม "สร้างเอกสาร" เพื่อเริ่มต้น</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #edf0f3' }}>
                  {['ประเภท', 'เลขที่', 'ลูกค้า', 'วันที่', 'มูลค่า', 'สถานะ', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '14px 18px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#9aa7b2', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc, idx) => {
                  const tc = typeConfig[doc.type as DocTypeKey] || typeConfig.invoice
                  const sc = statusConfig[doc.status] || statusConfig.draft
                  const total = calcTotal(doc)
                  return (
                    <tr
                      key={doc.id}
                      style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #f5f7f9' : 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#f9fafb'}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                      onClick={() => router.push(`/documents/${doc.id}`)}
                    >
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          background: tc.bg, color: tc.color,
                          borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 600,
                          display: 'inline-block',
                        }}>{tc.label}</span>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: 14, fontWeight: 600, color: '#2f3b45' }}>{doc.no}</td>
                      <td style={{ padding: '14px 18px', fontSize: 14, color: '#4a5a67' }}>{doc.clientName || '—'}</td>
                      <td style={{ padding: '14px 18px', fontSize: 13, color: '#7a8893' }}>{doc.issueDate}</td>
                      <td style={{ padding: '14px 18px', fontSize: 14, fontWeight: 600, color: '#2f3b45' }}>฿{fmt(total)}</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ background: sc.bg, color: sc.color, borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>{sc.label}</span>
                      </td>
                      <td style={{ padding: '14px 18px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            onClick={() => router.push(`/documents/${doc.id}`)}
                            style={{ background: '#f0f2f5', color: '#5f7d99', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>visibility</span>
                          </button>
                          <button
                            onClick={() => router.push(`/documents/${doc.id}`)}
                            style={{ background: '#e8f1f9', color: '#6b96c2', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowCreateModal(false) }}
        >
          <div style={{
            background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 560,
            boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#2f3b45' }}>สร้างเอกสาร</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: '#f0f2f5', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { ...typeConfig.invoice, href: '/documents/new?type=invoice' },
                { ...typeConfig.receipt, href: '/documents/new?type=receipt' },
                { ...typeConfig.taxinvoice, href: '/documents/new?type=taxinvoice' },
                { label: 'ใบเสนอราคา', labelEn: 'Quotation', icon: 'description', href: '/quotation/new', color: '#5f7d99', bg: '#e8eef4' },
              ].map(opt => (
                <Link key={opt.label} href={opt.href} style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      padding: 20, borderRadius: 14, border: '2px solid #edf0f3',
                      cursor: 'pointer', transition: 'all 0.15s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = opt.color
                      ;(e.currentTarget as HTMLDivElement).style.background = opt.bg
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = '#edf0f3'
                      ;(e.currentTarget as HTMLDivElement).style.background = '#fff'
                    }}
                    onClick={() => setShowCreateModal(false)}
                  >
                    <div style={{
                      width: 52, height: 52, borderRadius: 14, background: opt.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 28, color: opt.color }}>{opt.icon}</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#2f3b45' }}>{opt.label}</div>
                      <div style={{ fontSize: 12, color: '#9aa7b2', marginTop: 2 }}>{opt.labelEn}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

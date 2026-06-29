'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import QuotationDoc, { bankBrand, DEFAULT_TERMS, type BankView } from '@/components/QuotationDoc'
import type { CompanyInfo } from '@/lib/company'
import { printDocNode } from '@/lib/printDoc'

interface Item { name: string; detail?: string; qty: number; unit: string; price: number }

export default function SharedQuotationPage() {
  const { id } = useParams<{ id: string }>()
  const [quotation, setQuotation] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [banks, setBanks] = useState<BankView[]>([])
  const [company, setCompany] = useState<CompanyInfo | undefined>(undefined)
  const [downloading, setDownloading] = useState(false)
  const docRef = useRef<HTMLDivElement>(null)
  const pdfRef = useRef<HTMLDivElement>(null)

  async function handleDownload(docNo: string) {
    const node = pdfRef.current
    if (!node) return
    setDownloading(true)
    try {
      const html2pdf = (await import('html2pdf.js')).default
      await html2pdf().set({
        margin: 0,
        filename: `${docNo || 'quotation'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: node.scrollWidth },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      }).from(node).save()
    } catch {
      // Fall back to the print dialog if PDF generation fails.
      printDocNode(docRef.current, docNo)
    } finally {
      setDownloading(false)
    }
  }

  useEffect(() => {
    if (!id) return
    fetch(`/api/public/share/quotation/${id}`, { cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error('not found'); return r.json() })
      .then(data => {
        if (!data?.quotation) throw new Error('not found')
        setQuotation(data.quotation)
        if (data.company) setCompany(data.company as CompanyInfo)
        const list: { bank: string; accountNo: string; name: string }[] = Array.isArray(data.banks) ? data.banks : []
        setBanks(list.map(b => ({ name: b.bank, type: '', no: b.accountNo, holder: b.name, ...bankBrand(b.bank) })))
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [id])

  if (loading) {
    return <Centered icon="hourglass_empty" text="กำลังโหลดเอกสาร..." />
  }
  if (notFound || !quotation) {
    return <Centered icon="link_off" text="ไม่พบเอกสารนี้ หรือลิงก์อาจหมดอายุ" />
  }

  const q = quotation
  const str = (v: unknown) => (v == null ? undefined : String(v))
  const cust = q.customer as { name?: string; company?: string } | null | undefined
  const customerName = (q.clientName as string) || cust?.company || cust?.name || '—'

  let items: Item[] = []
  try {
    const raw = typeof q.items === 'string' ? JSON.parse(q.items as string) : q.items
    if (Array.isArray(raw)) items = raw
  } catch {}

  let terms: string[] | undefined
  try {
    const t = q.terms ? JSON.parse(q.terms as string) : null
    if (Array.isArray(t) && t.length) terms = t
  } catch {}

  const docNo = String(q.no || '')

  return (
    <div style={{ minHeight: '100vh', background: '#eef1f4', fontFamily: "'IBM Plex Sans Thai','IBM Plex Sans',sans-serif" }}>
      {/* Print rules: hide toolbar, sheet becomes a clean A4 page */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .share-bg { background: #fff !important; padding: 0 !important; }
          .share-sheet { box-shadow: none !important; border: none !important; border-radius: 0 !important; margin: 0 !important; max-width: none !important; }
          @page { size: A4; margin: 12mm; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print" style={{
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        padding: '12px 20px', background: '#ffffff', borderBottom: '1px solid #e7ebef',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span className="material-symbols-rounded" style={{ fontSize: 24, color: '#5f7d99' }}>request_quote</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: '#2f3b45', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              ใบเสนอราคา {docNo}
            </div>
            <div style={{ fontSize: 12, color: '#9aa7b2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {company?.name || ''}
            </div>
          </div>
        </div>
        <button
          onClick={() => handleDownload(docNo)}
          disabled={downloading}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, height: 42, padding: '0 18px',
            borderRadius: 11, background: '#5f7d99', color: '#fff', border: 'none',
            fontSize: 14, fontWeight: 600, cursor: downloading ? 'wait' : 'pointer', fontFamily: 'inherit',
            opacity: downloading ? 0.75 : 1,
          }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 20 }}>{downloading ? 'progress_activity' : 'download'}</span>
          {downloading ? 'กำลังสร้าง PDF...' : 'ดาวน์โหลด PDF'}
        </button>
      </div>

      {/* A4 sheet */}
      <div className="share-bg" style={{ padding: '26px 16px 56px' }}>
        <div
          ref={docRef}
          className="share-sheet print-doc"
          style={{
            background: '#fff', borderRadius: 14, border: '1px solid #e7ebef',
            boxShadow: '0 12px 40px rgba(30,45,60,.10)',
            maxWidth: 860, margin: '0 auto', overflow: 'hidden',
          }}
        >
          {/* Inner node captured for the PDF — clean white with padding as margins */}
          <div ref={pdfRef} style={{ background: '#fff', padding: '46px 48px' }}>
          <QuotationDoc
            no={docNo}
            status={String(q.status || 'draft')}
            issueDate={String(q.issueDate || '')}
            expiry={str(q.expiry) ?? null}
            clientName={customerName}
            clientAddress={str(q.clientAddress)}
            clientTaxId={str(q.clientTaxId)}
            clientContact={str(q.clientContact)}
            clientPhone={str(q.clientPhone)}
            items={items}
            discount={Number(q.discount) || 0}
            vatEnabled={q.vatEnabled === true}
            paymentTerm={str(q.paymentTerm)}
            bankIndex={Number(q.bankIndex) || 0}
            banks={banks}
            notes={str(q.notes)}
            terms={terms ?? DEFAULT_TERMS}
            company={company}
          />
          </div>
        </div>

        <div className="no-print" style={{ textAlign: 'center', marginTop: 22, fontSize: 12.5, color: '#9aa7b2' }}>
          กดปุ่ม &quot;ดาวน์โหลด PDF&quot; เพื่อบันทึกเอกสารเป็นไฟล์ PDF (ขนาด A4)
        </div>
      </div>
    </div>
  )
}

function Centered({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#eef1f4', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 12, color: '#9aa7b2',
      fontFamily: "'IBM Plex Sans Thai','IBM Plex Sans',sans-serif",
    }}>
      <span className="material-symbols-rounded" style={{ fontSize: 46 }}>{icon}</span>
      <div style={{ fontSize: 15 }}>{text}</div>
    </div>
  )
}

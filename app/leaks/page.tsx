'use client'

import { useEffect, useState } from 'react'

// ---- Types matching /api/leaks response ----------------------------------
type Breakdown = {
  unpaidInvoices: number
  sentQuotations: number
  expiredQuotations: number
  deliveredNotBilled: number
}

type PriorityItem = {
  type: string
  cust: string
  code: string
  amount: number
  days: number
  tier: 'urgent' | 'high' | 'normal'
  tierLabel: string
  action: string
  icon: string
  bar: number
}

type CountAmount = { count: number; amount: number }

type QuotationTracking = {
  awaitingReply: CountAmount
  nearExpiry: CountAmount
  expired: CountAmount
  totalValue: number
}

type AgingBucket = { bucket: string; amount: number }

type Debtor = { name: string; amount: number; oldestDays: number }

type Receivables = {
  aging: AgingBucket[]
  total: number
  topDebtors: Debtor[]
  overdueCount: number
  overdueAmount: number
}

type DeliveredItem = { code: string; name: string; cust: string; value: number }
type DeliveredNotBilled = { list: DeliveredItem[]; count: number; total: number }

type PartialItem = {
  no: string
  cust: string
  total: number
  received: number
  remaining: number
}
type PartialPayments = { list: PartialItem[]; count: number; totalRemaining: number }

type LeaksData = {
  totalAtRisk: number
  breakdown: Breakdown
  priority: PriorityItem[]
  quotationTracking: QuotationTracking
  receivables: Receivables
  deliveredNotBilled: DeliveredNotBilled
  partialPayments: PartialPayments
}

// ---- Formatting helpers ---------------------------------------------------
const baht = (n: number) => `฿${Math.round(n).toLocaleString('th-TH')}`
const num = (n: number) => Math.round(n).toLocaleString('th-TH')

const tierMap: Record<string, { bg: string; color: string }> = {
  urgent: { bg: '#fceee8', color: '#c4593f' },
  high: { bg: '#fdf3e3', color: '#f4a431' },
  normal: { bg: '#e8eef4', color: '#5f7d99' },
}

// Aging bucket display config (label + color) keyed by API bucket id.
const agingConfig: Record<string, { label: string; color: string }> = {
  '0-30': { label: 'ครบ 0-30 วัน', color: '#5f7d99' },
  '31-60': { label: '31-60 วัน', color: '#f4a431' },
  '61-90': { label: '61-90 วัน', color: '#d4841a' },
  '90+': { label: 'เกิน 90 วัน (เสี่ยงสูญ)', color: '#c4593f' },
}

export default function LeaksPage() {
  const [data, setData] = useState<LeaksData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    fetch('/api/leaks')
      .then(res => {
        if (!res.ok) throw new Error('failed')
        return res.json()
      })
      .then((d: LeaksData) => {
        if (alive) setData(d)
      })
      .catch(() => {
        if (alive) setError(true)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', color: '#9aa7b2', gap: 12 }}>
        <span className="material-symbols-rounded" style={{ fontSize: 34, color: '#c4593f', animation: 'spin 1s linear infinite' }}>progress_activity</span>
        <div style={{ fontSize: 14 }}>กำลังคำนวณจุดเงินรั่ว…</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', color: '#9aa7b2', gap: 10 }}>
        <span className="material-symbols-rounded" style={{ fontSize: 34, color: '#c4593f' }}>error</span>
        <div style={{ fontSize: 14 }}>โหลดข้อมูลไม่สำเร็จ ลองรีเฟรชอีกครั้ง</div>
      </div>
    )
  }

  const { totalAtRisk, breakdown, priority, quotationTracking, receivables, deliveredNotBilled, partialPayments } = data
  const top = priority[0]

  // KPI summary cards (from breakdown + quotation tracking).
  const leakSummary = [
    { icon: 'account_balance', iconWrap: { background: '#fceee8', color: '#c4593f' }, label: 'หนี้ค้างชำระ', value: baht(breakdown.unpaidInvoices), unit: '' },
    { icon: 'payments', iconWrap: { background: '#fdf3e3', color: '#f4a431' }, label: 'ส่งงานแล้วยังไม่วางบิล', value: baht(breakdown.deliveredNotBilled), unit: '' },
    { icon: 'description', iconWrap: { background: '#e8eef4', color: '#5f7d99' }, label: 'ใบเสนอราคาค้างตอบ', value: baht(breakdown.sentQuotations), unit: '' },
    { icon: 'event_busy', iconWrap: { background: '#f0eef8', color: '#7c6fab' }, label: 'ใบเสนอราคาหมดอายุ', value: String(quotationTracking.expired.count), unit: 'ใบ' },
  ]

  // Max aging amount for relative bar widths.
  const agingMax = receivables.aging.reduce((m, a) => Math.max(m, a.amount), 0)

  return (
    <div style={{ color: '#2f3b45' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, margin: '14px 0 18px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 26, color: '#c4593f' }}>crisis_alert</span>
            <div style={{ fontSize: 25, fontWeight: 700, color: '#2f3b45' }}>จุดเงินรั่ว</div>
          </div>
          <div style={{ fontSize: 14, color: '#7a8893', marginTop: 3 }}>เงินที่กำลังไหลออกเงียบๆ ที่คุณควรรีบจัดการ · คำนวณสดจากข้อมูลจริง</div>
        </div>
      </div>

      {/* At-risk summary card */}
      <div style={{
        background: 'linear-gradient(135deg,#fbe9e5,#fdf4f2)',
        border: '1px solid #f3d4cc',
        borderRadius: 18,
        padding: '22px 24px',
        marginBottom: 18,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        flexWrap: 'wrap',
      }}>
        <div style={{ width: 58, height: 58, borderRadius: 16, background: '#c4593f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span className="material-symbols-rounded" style={{ fontSize: 30, color: '#fff' }}>priority_high</span>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 13.5, color: '#9c5648', fontWeight: 600 }}>เงินที่กำลังเสี่ยงหลุดมือทั้งหมด</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
            <span style={{ fontSize: 36, fontWeight: 800, color: '#c4593f', fontFamily: "'IBM Plex Sans', sans-serif" }}>
              {totalAtRisk > 0 ? baht(totalAtRisk) : '฿0'}
            </span>
          </div>
          <div style={{ fontSize: 13, color: '#a06c60', marginTop: 2 }}>
            {totalAtRisk > 0
              ? 'รวมหนี้ค้าง + งานที่ยังไม่วางบิล + ใบเสนอราคาที่ค้างตอบ'
              : 'ไม่มีเงินที่เสี่ยงสูญหาย'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, height: 44, padding: '0 20px', borderRadius: 12, background: '#c4593f', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 14px rgba(196,89,63,.3)' }}>
          <span className="material-symbols-rounded" style={{ fontSize: 19 }}>checklist</span>
          จัดการทั้งหมด
        </div>
      </div>

      {/* Priority list */}
      <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 22, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 22, color: '#c4593f' }}>format_list_numbered</span>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#2f3b45' }}>
              ลำดับสิ่งที่ต้องทำก่อน <span style={{ fontSize: 12.5, color: '#9aa7b2', fontWeight: 400 }}>เรียงตามความเร่งด่วน</span>
            </div>
          </div>
        </div>
        <div style={{ fontSize: 12.5, color: '#9aa7b2', marginBottom: 16 }}>
          คำนวณจากจำนวนเงิน × ความเร่งด่วน (อายุหนี้ / ประเภทปัญหา) · {priority.length} รายการ
        </div>

        {priority.length === 0 ? (
          <div style={{ padding: '28px 16px', textAlign: 'center', color: '#9aa7b2', fontSize: 13.5 }}>
            ไม่มีรายการที่ต้องจัดการ
          </div>
        ) : (
          <>
            {/* Top alert */}
            {top && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, background: '#fbe9e5', borderRadius: 13, padding: '14px 16px', marginBottom: 16 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 22, color: '#c4593f' }}>priority_high</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#9c2f1c' }}>ทำก่อนเลย: {top.type} · {top.cust}</div>
                  <div style={{ fontSize: 12.5, color: '#9c5648', marginTop: 1 }}>{top.code} · ค้างมา {top.days} วัน → <b>{top.action}</b></div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#c4593f', fontFamily: "'IBM Plex Sans', sans-serif", whiteSpace: 'nowrap' }}>{baht(top.amount)}</div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {priority.map((p, i) => {
                const rank = i + 1
                const tier = tierMap[p.tier] || tierMap.normal
                return (
                  <div key={`${p.code}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 14px', borderRadius: 12, border: '1px solid #f0f2f5' }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: rank <= 3 ? '#fceee8' : '#f5f7f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 700, color: rank <= 3 ? '#c4593f' : '#7a8893', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                      {rank}
                    </div>
                    <span className="material-symbols-rounded" style={{ fontSize: 20, color: tier.color, flexShrink: 0 }}>{p.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: '#2f3b45' }}>{p.cust}</span>
                        <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: tier.bg, color: tier.color }}>{p.tierLabel}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#8a97a2', marginTop: 2 }}>{p.code} — {p.type} · ค้างมา {p.days} วัน</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#5f7d99', marginTop: 4 }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 15 }}>bolt</span>
                        {p.action}
                      </div>
                    </div>
                    <div style={{ width: 90, flexShrink: 0, textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>{baht(p.amount)}</div>
                      <div style={{ height: 5, borderRadius: 4, background: '#f0f2f5', overflow: 'hidden', marginTop: 5 }}>
                        <div style={{ height: '100%', background: tier.color, width: `${p.bar}%`, borderRadius: 4 }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* 4 Summary KPIs */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
        {leakSummary.map((k, i) => (
          <div key={i} style={{ flex: '1 1 200px', minWidth: 180, background: '#fff', borderRadius: 16, padding: '17px 19px', border: '1px solid #edf0f3', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: k.iconWrap.background, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 21, color: k.iconWrap.color }}>{k.icon}</span>
            </div>
            <div>
              <div style={{ fontSize: 12.5, color: '#7a8893' }}>{k.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 23, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>{k.value}</span>
                {k.unit && <span style={{ fontSize: 12, color: '#9aa7b2' }}>{k.unit}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Leak Cards — fed by C/D/E/F */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(380px,1fr))', gap: 16, marginBottom: 18 }}>

        {/* C1) หนี้ค้างเกินกำหนด — top debtors (D) */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13, marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: '#fceee8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 23, color: '#c4593f' }}>account_balance</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#2f3b45' }}>ลูกหนี้ค้างชำระ (Top 5)</div>
              <div style={{ fontSize: 12.5, color: '#9aa7b2', marginTop: 2 }}>ลูกค้าที่ยังค้างยอดมากที่สุด</div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#c4593f', fontFamily: "'IBM Plex Sans', sans-serif", flexShrink: 0 }}>{baht(receivables.total)}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {receivables.topDebtors.length === 0 ? (
              <EmptyRow text="ไม่มีลูกหนี้ค้างชำระ" />
            ) : (
              receivables.topDebtors.map((dbt, ri) => (
                <div key={ri} style={rowStyle}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#2f3b45' }}>{dbt.name}</div>
                    <div style={{ fontSize: 12, color: '#8a97a2', marginTop: 1 }}>ค้างนานสุด {dbt.oldestDays} วัน</div>
                  </div>
                  <span style={{ ...badgeStyle, background: '#fceee8', color: '#c4593f' }}>{dbt.oldestDays} วัน</span>
                  <div style={amountStyle}>{baht(dbt.amount)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* E) ส่งงานแล้วยังไม่วางบิล */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13, marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: '#fdf3e3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 23, color: '#f4a431' }}>receipt_long</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#2f3b45' }}>ส่งงานแล้วยังไม่วางบิล</div>
              <div style={{ fontSize: 12.5, color: '#9aa7b2', marginTop: 2 }}>โปรเจกต์สถานะส่งงาน · {deliveredNotBilled.count} งาน</div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f4a431', fontFamily: "'IBM Plex Sans', sans-serif", flexShrink: 0 }}>{baht(deliveredNotBilled.total)}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {deliveredNotBilled.list.length === 0 ? (
              <EmptyRow text="ไม่มีงานที่รอวางบิล" />
            ) : (
              deliveredNotBilled.list.map((j, ri) => (
                <div key={ri} style={rowStyle}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: '#2f3b45' }}>{j.cust}</span>
                      <span style={{ fontSize: 11, color: '#9aa7b2', fontFamily: "'IBM Plex Sans', sans-serif" }}>{j.code}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#8a97a2', marginTop: 1 }}>{j.name}</div>
                  </div>
                  <span style={{ ...badgeStyle, background: '#fdf3e3', color: '#f4a431' }}>รอวางบิล</span>
                  <div style={amountStyle}>{baht(j.value)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* C) ใบเสนอราคา — tracking */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13, marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: '#e8eef4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 23, color: '#5f7d99' }}>description</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#2f3b45' }}>ใบเสนอราคาค้างตอบ</div>
              <div style={{ fontSize: 12.5, color: '#9aa7b2', marginTop: 2 }}>ส่งแล้วแต่ลูกค้ายังไม่ตอบกลับ</div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#5f7d99', fontFamily: "'IBM Plex Sans', sans-serif", flexShrink: 0 }}>{baht(quotationTracking.totalValue)}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <TrackRow label="รอตอบกลับ" sub="ยังไม่หมดอายุ" badgeBg="#e8eef4" badgeColor="#5f7d99" badgeText={`${quotationTracking.awaitingReply.count} ใบ`} amount={baht(quotationTracking.awaitingReply.amount)} />
            <TrackRow label="ใกล้หมดอายุ" sub="ภายใน 7 วัน" badgeBg="#fdf3e3" badgeColor="#f4a431" badgeText={`${quotationTracking.nearExpiry.count} ใบ`} amount={baht(quotationTracking.nearExpiry.amount)} />
            <TrackRow label="หมดอายุแล้ว" sub="เลยวันหมดอายุ" badgeBg="#fceee8" badgeColor="#c4593f" badgeText={`${quotationTracking.expired.count} ใบ`} amount={baht(quotationTracking.expired.amount)} />
          </div>
        </div>

        {/* F) รับเงินไม่ครบ */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13, marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: '#f0eef8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 23, color: '#7c6fab' }}>payments</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#2f3b45' }}>รับเงินไม่ครบ</div>
              <div style={{ fontSize: 12.5, color: '#9aa7b2', marginTop: 2 }}>จ่ายมัดจำแล้วแต่ยังค้างยอด · {partialPayments.count} ใบ</div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#7c6fab', fontFamily: "'IBM Plex Sans', sans-serif", flexShrink: 0 }}>{baht(partialPayments.totalRemaining)}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {partialPayments.list.length === 0 ? (
              <EmptyRow text="ไม่มีรายการรับเงินไม่ครบ" />
            ) : (
              partialPayments.list.map((p, ri) => (
                <div key={ri} style={rowStyle}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: '#2f3b45' }}>{p.cust}</span>
                      <span style={{ fontSize: 11, color: '#9aa7b2', fontFamily: "'IBM Plex Sans', sans-serif" }}>{p.no}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#8a97a2', marginTop: 1 }}>รับแล้ว {baht(p.received)} จาก {baht(p.total)}</div>
                  </div>
                  <span style={{ ...badgeStyle, background: '#f0eef8', color: '#7c6fab' }}>ค้าง</span>
                  <div style={amountStyle}>{baht(p.remaining)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Aging + Debtor table */}
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        {/* Aging */}
        <div style={{ flex: '1 1 340px', background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 22 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#2f3b45', marginBottom: 4 }}>ลูกหนี้แยกตามอายุหนี้</div>
          <div style={{ fontSize: 12.5, color: '#9aa7b2', marginBottom: 18 }}>ยิ่งหนี้เก่า ยิ่งมีโอกาสกลายเป็นหนี้สูญ</div>
          {receivables.total <= 0 ? (
            <div style={{ padding: '24px 8px', textAlign: 'center', color: '#9aa7b2', fontSize: 13.5 }}>ไม่มีลูกหนี้ค้างชำระ</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              {receivables.aging.map((a, i) => {
                const cfg = agingConfig[a.bucket] || { label: a.bucket, color: '#5f7d99' }
                const pct = agingMax > 0 ? Math.round((a.amount / agingMax) * 100) : 0
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: '#5b6b77' }}>{cfg.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: cfg.color, fontFamily: "'IBM Plex Sans', sans-serif" }}>{baht(a.amount)}</span>
                    </div>
                    <div style={{ height: 10, borderRadius: 5, background: '#f0f2f5', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 5, background: cfg.color, width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {receivables.overdueCount > 0 && (
            <div style={{ marginTop: 18, padding: '13px 15px', borderRadius: 12, background: '#fbe9e5', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#c4593f' }}>lightbulb</span>
              <span style={{ fontSize: 12, color: '#9c5648', lineHeight: 1.5 }}>มี <b>{receivables.overdueCount} รายการ</b> ค้างเกินกำหนด รวม <b>{baht(receivables.overdueAmount)}</b> — ควรเร่งติดตามก่อนกลายเป็นหนี้สูญ</span>
            </div>
          )}
        </div>

        {/* Debtor detail table */}
        <div style={{ flex: '1.3 1 420px', background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 6 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#2f3b45' }}>รายชื่อลูกหนี้ <span style={{ fontSize: 12.5, color: '#9aa7b2', fontWeight: 400 }}>Top Debtors</span></div>
          </div>
          <div style={{ fontSize: 12.5, color: '#9aa7b2', marginBottom: 16 }}>ยอดค้างชำระคงเหลือต่อลูกค้า เรียงจากมากไปน้อย</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
            <div style={{ flex: 1, minWidth: 120, background: '#f5f7f9', borderRadius: 12, padding: '13px 15px' }}>
              <div style={{ fontSize: 11.5, color: '#9aa7b2' }}>ยอดค้างรวม</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>{baht(receivables.total)}</div>
            </div>
            <div style={{ flex: 1, minWidth: 120, background: '#fbf3ec', borderRadius: 12, padding: '13px 15px' }}>
              <div style={{ fontSize: 11.5, color: '#a9762f' }}>เกินกำหนด</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#a9762f', fontFamily: "'IBM Plex Sans', sans-serif" }}>{baht(receivables.overdueAmount)}</div>
            </div>
            <div style={{ flex: 1, minWidth: 120, background: '#e9f3ed', borderRadius: 12, padding: '13px 15px' }}>
              <div style={{ fontSize: 11.5, color: '#3d8a64' }}>จำนวนลูกหนี้</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#3d8a64', fontFamily: "'IBM Plex Sans', sans-serif" }}>{num(receivables.topDebtors.length)}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr', gap: 8, fontSize: 11.5, color: '#9aa7b2', fontWeight: 500, padding: '0 4px 10px', borderBottom: '1px solid #f0f2f5' }}>
            {['ลูกค้า', 'ค้างนานสุด', 'ยอดค้าง'].map((h, i) => (
              <div key={h} style={i > 0 ? { textAlign: 'right' } : {}}>{h}</div>
            ))}
          </div>
          {receivables.topDebtors.length === 0 ? (
            <div style={{ padding: '24px 8px', textAlign: 'center', color: '#9aa7b2', fontSize: 13.5 }}>ไม่มีรายการ</div>
          ) : (
            receivables.topDebtors.map((dbt, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr', gap: 8, alignItems: 'center', padding: '11px 4px', borderBottom: '1px solid #f4f6f8' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#2f3b45' }}>{dbt.name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'inline-flex', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: dbt.oldestDays > 30 ? '#fceee8' : '#eef3f7', color: dbt.oldestDays > 30 ? '#c4593f' : '#5f7d99' }}>{dbt.oldestDays} วัน</span>
                </div>
                <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>{baht(dbt.amount)}</div>
              </div>
            ))
          )}
          <div style={{ marginTop: 16, padding: '13px 15px', borderRadius: 12, background: '#eef3f7', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#5f7d99' }}>insights</span>
            <span style={{ fontSize: 12, color: '#54697d', lineHeight: 1.5 }}>
              {receivables.topDebtors[0]
                ? <><b>{receivables.topDebtors[0].name}</b> ค้างยอดสูงสุด {baht(receivables.topDebtors[0].amount)} (นาน {receivables.topDebtors[0].oldestDays} วัน) · ควรติดตามเป็นลำดับแรก</>
                : 'ยังไม่มีลูกหนี้ค้างชำระในระบบ'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- Small reusable bits --------------------------------------------------
const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 11,
  padding: '11px 13px',
  borderRadius: 11,
  background: '#fafbfc',
  border: '1px solid #f2f4f6',
}

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  padding: '3px 9px',
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 600,
}

const amountStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: '#2f3b45',
  fontFamily: "'IBM Plex Sans', sans-serif",
  minWidth: 78,
  textAlign: 'right',
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div style={{ padding: '18px 12px', textAlign: 'center', color: '#9aa7b2', fontSize: 13 }}>{text}</div>
  )
}

function TrackRow({ label, sub, badgeBg, badgeColor, badgeText, amount }: {
  label: string
  sub: string
  badgeBg: string
  badgeColor: string
  badgeText: string
  amount: string
}) {
  return (
    <div style={rowStyle}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#2f3b45' }}>{label}</div>
        <div style={{ fontSize: 12, color: '#8a97a2', marginTop: 1 }}>{sub}</div>
      </div>
      <span style={{ ...badgeStyle, background: badgeBg, color: badgeColor }}>{badgeText}</span>
      <div style={amountStyle}>{amount}</div>
    </div>
  )
}

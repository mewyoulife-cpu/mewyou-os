'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import DashboardCharts from './DashboardCharts'
import DateRangeFilter, { type RangeState } from '@/components/DateRangeFilter'
import { resolveRange } from '@/lib/dateRanges'
import { useTheme } from '@/components/ThemeContext'

const STORAGE_KEY = 'mewyou_dash_range'

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  lead:      { label: 'Lead',      bg: '#eef2f5', color: '#8fa7bc' },
  brief:     { label: 'Brief',     bg: '#e8f1f9', color: '#6b96c2' },
  quotation: { label: 'Quotation', bg: '#f0eaf9', color: '#9575cd' },
  payment:   { label: 'Payment',   bg: '#fdf3e3', color: '#f4a431' },
  design:    { label: 'ออกแบบ',   bg: '#e8eef4', color: '#5f7d99' },
  revision:  { label: 'Revision',  bg: '#fceee8', color: '#e07b54' },
  approved:  { label: 'รออนุมัติ', bg: '#e9f3ed', color: '#3d8a64' },
  deliver:   { label: 'รอส่งมอบ', bg: '#e3f2fd', color: '#2196f3' },
  completed: { label: 'เสร็จสิ้น', bg: '#e8f5e9', color: '#4caf50' },
}

const STATUS_PROGRESS: Record<string, number> = {
  lead: 5, brief: 15, quotation: 25, payment: 35,
  design: 55, revision: 70, approved: 82, deliver: 92, completed: 100,
}

function fmtShort(n: number) {
  return '฿' + n.toLocaleString('th-TH')
}

function fmt(n: number) {
  return '฿' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function getThaiBuddhistDate(date: Date): string {
  const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
  const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
  return `วัน${days[date.getDay()]}ที่ ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear() + 543}`
}

function getWeekDays(today: Date) {
  const dow = today.getDay()
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)
  const labels = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา']
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return { label: labels[i], date: d.getDate(), isToday: d.toDateString() === today.toDateString() }
  })
}

function relativeTime(from: Date, now: Date): string {
  const diffMs = now.getTime() - from.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'เมื่อสักครู่'
  if (mins < 60) return `${mins} นาทีที่แล้ว`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`
  const days = Math.floor(hours / 24)
  return `${days} วันก่อน`
}

interface Kpi { value: number; up: boolean; pct: string }
interface DashboardData {
  kpis: { projects: Kpi; waitingDesign: Kpi; completed: Kpi; sales: Kpi; outstanding: Kpi }
  donut: { design: number; deliver: number; revision: number; approved: number; completed: number }
  salesChart: { labels: string[]; data: number[] }
  recentProjects: { id: string; code: string; customerName: string; customerLogo: string | null; type: string; status: string; dueDate: string | null; value: number }[]
  leaks: { type: string; tier: string; tierBg: string; tierColor: string; icon: string; iconColor: string; cust: string; action: string; amount: number }[]
  tasks: { label: string; count: number; countColor: string; countBg: string }[]
  schedule: { title: string; sub: string }[]
  pendingSend: { total: number; docs: { no: string; clientName: string; issueDate: string; total: number }[] }
  activities: { icon: string; iconBg: string; iconColor: string; title: string; ts: string }[]
}

const card: React.CSSProperties = { background: '#fff', borderRadius: 18, border: '1px solid #edf0f3' }

const emptyState = (icon: string, text: string) => (
  <div style={{ padding: '24px 12px', textAlign: 'center', color: '#9aa7b2', fontSize: 13 }}>
    <span className="material-symbols-rounded" style={{ fontSize: 30, display: 'block', marginBottom: 6, color: '#cdd6df' }}>{icon}</span>
    {text}
  </div>
)

export default function DashboardPage() {
  const today = new Date()
  const todayStr = getThaiBuddhistDate(today)
  const weekDays = getWeekDays(today)

  const [range, setRange] = useState<RangeState>({ preset: 'this_month' })
  const [data, setData] = useState<DashboardData | null>(null)

  // Hydrate the persisted filter once on mount (avoids SSR mismatch).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from persisted storage
      if (raw) setRange(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [])

  const fetchData = useCallback(async () => {
    const { from, to } = resolveRange(range.preset, range.customFrom, range.customTo)
    try {
      const res = await fetch(`/api/dashboard?from=${from.toISOString()}&to=${to.toISOString()}`, { cache: 'no-store' })
      if (res.ok) setData(await res.json())
    } catch { /* keep last data */ }
  }, [range])

  // Refetch + persist whenever the filter changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch updates state after await, syncing the dashboard to the selected range
    fetchData()
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(range)) } catch { /* ignore */ }
  }, [range, fetchData])

  // Real-time: poll every 12s and refetch when the tab regains focus.
  useEffect(() => {
    const id = setInterval(fetchData, 12000)
    const onVis = () => { if (document.visibilityState === 'visible') fetchData() }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis) }
  }, [fetchData])

  const rangeLabel = resolveRange(range.preset, range.customFrom, range.customTo).label

  return (
    <div style={{ color: '#2f3b45' }}>
      {/* Greeting + Date Range Filter */}
      <div style={{ margin: '14px 0 22px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 25, fontWeight: 700, color: '#2f3b45' }}>สวัสดี, Mew 👋</div>
          <div style={{ fontSize: 14.5, color: '#7a8893', marginTop: 3 }}>
            ยินดีต้อนรับเข้าสู่ระบบ Mewyou Design OS · {todayStr}
          </div>
        </div>
        <DateRangeFilter value={range} onChange={setRange} />
      </div>

      {!data ? (
        <div style={{ ...card, padding: 60, textAlign: 'center', color: '#9aa7b2', fontSize: 14 }}>
          <span className="material-symbols-rounded" style={{ fontSize: 38, display: 'block', marginBottom: 10, color: '#cdd6df' }}>hourglass_top</span>
          กำลังโหลดข้อมูล...
        </div>
      ) : (
        <DashboardBody data={data} rangeLabel={rangeLabel} weekDays={weekDays} todayStr={todayStr} now={today} />
      )}
    </div>
  )
}

function DashboardBody({ data, rangeLabel, weekDays, todayStr, now }: {
  data: DashboardData
  rangeLabel: string
  weekDays: { label: string; date: number; isToday: boolean }[]
  todayStr: string
  now: Date
}) {
  const { theme } = useTheme()
  const glass = theme === 'glass'
  const k = data.kpis
  const kpis = [
    { icon: 'folder_open', label: 'โปรเจกต์ทั้งหมด', value: String(k.projects.value), unit: 'โปรเจกต์', up: k.projects.up, trend: k.projects.pct },
    { icon: 'draw', label: 'กำลังรอออกแบบ', value: String(k.waitingDesign.value), unit: 'โปรเจกต์', up: k.waitingDesign.up, trend: k.waitingDesign.pct },
    { icon: 'task_alt', label: 'งานเสร็จสิ้นแล้ว', value: String(k.completed.value), unit: 'โปรเจกต์', up: k.completed.up, trend: k.completed.pct },
    { icon: 'payments', label: 'ยอดขายรวม', value: k.sales.value > 0 ? fmtShort(k.sales.value) : '฿0', unit: '', up: k.sales.up, trend: k.sales.pct },
    { icon: 'receipt_long', label: 'ยอดค้างชำระ', value: k.outstanding.value > 0 ? fmtShort(k.outstanding.value) : '฿0', unit: '', up: k.outstanding.up, trend: k.outstanding.pct },
  ]

  const donutData = [
    { label: 'ออกแบบ',    value: data.donut.design,    color: '#2f3b45' },
    { label: 'ผลิต',      value: data.donut.deliver,   color: '#5f7d99' },
    { label: 'รออนุมัติ', value: data.donut.revision,  color: '#3d8a64' },
    { label: 'รอผลิต',    value: data.donut.approved,  color: '#b0bdc8' },
    { label: 'เสร็จสิ้น', value: data.donut.completed, color: '#c4a882' },
  ]

  return (
    <>
      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
        {kpis.map((kp) => (
          <div key={kp.label} className="glass-card" style={{ ...card, flex: '1 1 175px', minWidth: 168, padding: '17px 19px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#7a8893', fontSize: 13, fontWeight: 500, marginBottom: 13 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 26, color: glass ? '#ffffff' : '#9fb0bf' }}>{kp.icon}</span>
              {kp.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span style={{ fontSize: 29, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>{kp.value}</span>
              {kp.unit && <span style={{ fontSize: 12.5, color: '#8a97a2' }}>{kp.unit}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12.5, color: kp.up ? '#3d8a64' : '#c4593f', marginTop: 6 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 15 }}>{kp.up ? 'trending_up' : 'trending_down'}</span>
              {kp.trend}
              <span style={{ color: '#9aa7b2', marginLeft: 2 }}>จากช่วงก่อนหน้า</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main 2-col layout */}
      <div style={{ display: 'flex', gap: 18 }}>
        {/* LEFT column */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Charts row */}
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            {/* Donut */}
            <div className="glass-card" style={{ ...card, flex: '1 1 260px', padding: 22 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#2f3b45', marginBottom: 6 }}>ภาพรวมโปรเจกต์</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                <DashboardCharts donutData={donutData} salesData={data.salesChart.data} salesMonths={data.salesChart.labels} mode="donut" />
              </div>
            </div>
            {/* Line chart */}
            <div className="glass-card" style={{ ...card, flex: '1 1 320px', padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#2f3b45' }}>
                  ยอดขาย <span style={{ fontSize: 13, color: '#9aa7b2', fontWeight: 400 }}>({rangeLabel})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: '#5b6b77', border: '1px solid #e4e8ec', borderRadius: 9, padding: '5px 10px' }}>
                  บาท
                  <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#9aa7b2' }}>expand_more</span>
                </div>
              </div>
              <DashboardCharts donutData={donutData} salesData={data.salesChart.data} salesMonths={data.salesChart.labels} mode="line" />
            </div>
          </div>

          {/* Recent Projects Table */}
          <div className="glass-card" style={{ ...card, padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#2f3b45' }}>โปรเจกต์ล่าสุด <span style={{ fontSize: 13, color: '#9aa7b2', fontWeight: 400 }}>({rangeLabel})</span></div>
              <Link href="/projects" style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 13.5, color: '#4f7bb0', fontWeight: 500, textDecoration: 'none' }}>
                ดูทั้งหมด
                <span className="material-symbols-rounded" style={{ fontSize: 17 }}>chevron_right</span>
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1.1fr 1.2fr 1fr 1.3fr 0.9fr 0.9fr', gap: 8, fontSize: 12, color: '#9aa7b2', fontWeight: 500, padding: '0 4px 11px', borderBottom: '1px solid #f0f2f5' }}>
              {['Logo', 'รหัสโปรเจกต์', 'ชื่อลูกค้า', 'ประเภท', 'สถานะ', 'ความคืบหน้า', 'กำหนดส่ง', 'มูลค่า'].map(h => (
                <div key={h} style={h === 'มูลค่า' ? { textAlign: 'right' } : {}}>{h}</div>
              ))}
            </div>
            {data.recentProjects.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#9aa7b2', fontSize: 13.5 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 36, display: 'block', marginBottom: 8, color: '#cdd6df' }}>folder_open</span>
                ไม่มีโปรเจกต์ในช่วงวันที่นี้
              </div>
            ) : data.recentProjects.map(p => {
              const s = STATUS_MAP[p.status] || { label: p.status, bg: '#f0f2f5', color: '#8a97a2' }
              const pct = STATUS_PROGRESS[p.status] || 0
              return (
                <Link href={`/projects/${p.id}`} key={p.id} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1.1fr 1.2fr 1fr 1.3fr 0.9fr 0.9fr', gap: 8, alignItems: 'center', fontSize: 13.5, padding: '13px 4px', borderBottom: '1px solid #f4f6f8', cursor: 'pointer' }}>
                    {p.customerLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.customerLogo} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', border: '1px solid #eef1f4', background: '#f7f9fb' }} />
                    ) : (
                      <div style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #eef1f4', background: '#f7f9fb' }} />
                    )}
                    <div style={{ fontWeight: 600, color: '#54697d', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12.5 }}>{p.code}</div>
                    <div style={{ fontWeight: 600, color: '#2f3b45' }}>{p.customerName}</div>
                    <div style={{ color: '#7a8893', fontSize: 13 }}>{p.type}</div>
                    <div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', height: 24, padding: '0 9px', borderRadius: 7, fontSize: 11.5, fontWeight: 600, background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, borderRadius: 4, background: '#eef1f4', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: '#5f7d99', borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 12, color: '#7a8893', width: 30 }}>{pct}%</span>
                    </div>
                    <div style={{ color: '#7a8893', fontSize: 13 }}>{p.dueDate || '-'}</div>
                    <div style={{ textAlign: 'right', fontWeight: 600, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>{fmt(p.value)}</div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Priority leaks */}
          <div className="glass-card" style={{ ...card, padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 15 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fbe9e5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 21, color: '#c4593f' }}>priority_high</span>
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#2f3b45' }}>สิ่งที่ต้องทำก่อน · 5 อันดับด่วนสุด</div>
                  <div style={{ fontSize: 12.5, color: '#9aa7b2' }}>คำนวณจากเงินที่กำลังรั่ว × ความเร่งด่วน</div>
                </div>
              </div>
              <Link href="/leaks" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#c4593f', fontWeight: 600, textDecoration: 'none' }}>
                ดูทั้งหมด ({data.leaks.length})
                <span className="material-symbols-rounded" style={{ fontSize: 17 }}>chevron_right</span>
              </Link>
            </div>
            {data.leaks.length === 0 ? emptyState('task_alt', 'ไม่มีงานเร่งด่วน') : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.leaks.map((p, i) => (
                  <Link href="/leaks" key={i} style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 13px', borderRadius: 11, border: '1px solid #f0f2f5', cursor: 'pointer' }}>
                      <div style={{ width: 26, height: 26, borderRadius: 8, background: '#f5f7f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 700, color: '#7a8893', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                        {i + 1}
                      </div>
                      <span className="material-symbols-rounded" style={{ fontSize: 20, color: p.iconColor }}>{p.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: '#2f3b45' }}>{p.type}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: p.tierBg, color: p.tierColor }}>{p.tier}</span>
                          <span style={{ fontSize: 11.5, color: '#9aa7b2' }}>{p.cust}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#5f7d99', marginTop: 2 }}>
                          <span className="material-symbols-rounded" style={{ fontSize: 14 }}>bolt</span>
                          {p.action}
                        </div>
                      </div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif", flexShrink: 0 }}>
                        {fmtShort(Math.round(p.amount))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT column */}
        <div style={{ width: 312, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Tax invoices */}
          <div style={{ background: 'linear-gradient(135deg,#ecebf8,#f5f4fc)', borderRadius: 18, padding: 20, border: '1px solid #e3e1f3' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#6760a8' }}>article</span>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#2f3b45' }}>ใบกำกับภาษีรอส่ง</div>
              </div>
              <Link href="/documents" style={{ fontSize: 12.5, color: '#6760a8', fontWeight: 600, textDecoration: 'none' }}>ดูทั้งหมด</Link>
            </div>
            <div style={{ fontSize: 12, color: '#8a7fb5', marginBottom: 14 }}>
              ออกแล้วแต่ยังไม่ได้ส่งให้ลูกค้า · รวม ฿{data.pendingSend.total.toLocaleString('th-TH')}
            </div>
            {data.pendingSend.docs.length === 0 ? emptyState('article', 'ไม่มีเอกสารรอส่ง') : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.pendingSend.docs.map(doc => (
                  <div key={doc.no} style={{ display: 'flex', alignItems: 'center', gap: 11, background: '#fff', borderRadius: 11, padding: '11px 13px', cursor: 'pointer' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: '#ecebf8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#6760a8' }}>article</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#2f3b45' }}>{doc.clientName}</div>
                      <div style={{ fontSize: 11, color: '#9aa7b2', fontFamily: "'IBM Plex Sans', sans-serif" }}>{doc.no} · {doc.issueDate}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>฿{doc.total.toLocaleString('th-TH')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mini Calendar */}
          <div className="glass-card" style={{ ...card, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
              <div style={{ fontSize: 15.5, fontWeight: 600, color: '#2f3b45' }}>ปฏิทินงานวันนี้</div>
              <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#9aa7b2' }}>expand_more</span>
            </div>
            <div style={{ fontSize: 12.5, color: '#8a97a2', marginBottom: 14 }}>{todayStr}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 16 }}>
              {weekDays.map((d, i) => (
                <div key={i} style={{ textAlign: 'center', fontSize: 11, color: '#9aa7b2', paddingBottom: 4 }}>{d.label}</div>
              ))}
              {weekDays.map((d, i) => (
                <div key={i} style={{
                  width: 30, height: 30, borderRadius: '50%', margin: '0 auto',
                  background: d.isToday ? '#5f7d99' : 'transparent',
                  color: d.isToday ? '#fff' : '#2f3b45',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: d.isToday ? 700 : 400,
                }}>
                  {d.date}
                </div>
              ))}
            </div>
            {data.schedule.length === 0 ? emptyState('event_busy', 'ไม่มีนัดหมายวันนี้') : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.schedule.map((ev, i) => (
                  <div key={i} style={{ display: 'flex', gap: 11 }}>
                    <div style={{ borderLeft: '2px solid #cdd9e3', paddingLeft: 11, flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: '#2f3b45' }}>{ev.title}</div>
                      <div style={{ fontSize: 12, color: '#9aa7b2', marginTop: 1 }}>{ev.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tasks */}
          <div className="glass-card" style={{ ...card, padding: 20 }}>
            <div style={{ fontSize: 15.5, fontWeight: 600, color: '#2f3b45', marginBottom: 14 }}>ภารกิจที่ต้องทำ</div>
            {data.tasks.length === 0 ? emptyState('task_alt', 'ไม่มีงานเร่งด่วน') : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                {data.tasks.map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 21, color: '#c3cdd6' }}>check_box_outline_blank</span>
                    <span style={{ flex: 1, fontSize: 13.5, color: '#5b6b77' }}>{t.label}</span>
                    <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 6, fontSize: 11.5, fontWeight: 600, background: t.countBg, color: t.countColor }}>{`${t.count} รายการ`}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="glass-card" style={{ ...card, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 15.5, fontWeight: 600, color: '#2f3b45' }}>กิจกรรมล่าสุด</div>
              <div style={{ fontSize: 12.5, color: '#4f7bb0', fontWeight: 500, cursor: 'pointer' }}>ดูทั้งหมด</div>
            </div>
            {data.activities.length === 0 ? emptyState('history', 'ยังไม่มีกิจกรรม') : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                {data.activities.map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 11 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: a.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 17, color: a.iconColor }}>{a.icon}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: '#3b4954', lineHeight: 1.4 }}>{a.title}</div>
                      <div style={{ fontSize: 11.5, color: '#9aa7b2', marginTop: 2 }}>{relativeTime(new Date(a.ts), now)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

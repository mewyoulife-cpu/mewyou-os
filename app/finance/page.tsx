'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

interface Project {
  value: number
  cost: number
  type: string
  status: string
  createdAt: string
}

interface Expense {
  id?: string
  description: string
  amount: number
  category: string
  date: string
}

interface FinanceData {
  projects?: Project[]
  expenses?: Expense[]
}

const dpal = ['#3c4f5e', '#5f7d99', '#94b1c9', '#bcd0df', '#dfe7ed']

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
]
const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
]

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 18,
  border: '1px solid #edf0f3',
  padding: 22,
}

// Format with 2 decimals + thousands separators
function m2(n: number): string {
  const v = Number.isFinite(n) ? Math.floor(n * 100) / 100 : 0
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Compact "K" notation for donut center (e.g. 480000 -> "480K")
function compactK(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '0'
  if (Math.abs(n) >= 1000) {
    const k = n / 1000
    return `${Math.round(k * 10) / 10 === Math.round(k) ? Math.round(k) : Math.round(k * 10) / 10}K`
  }
  return String(Math.round(n))
}

// month key "YYYY-MM" from an ISO-ish date string
function monthKey(dateStr: string): string {
  return String(dateStr).slice(0, 7)
}

export default function FinancePage() {
  const [data, setData] = useState<FinanceData>({})
  const [selected, setSelected] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }) // "" = all, else "YYYY-MM"
  const [open, setOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  function loadFinance() {
    return fetch('/api/finance').then(r => r.json()).then((d: FinanceData) => setData(d)).catch(() => {})
  }

  useEffect(() => { loadFinance() }, [])

  const projects: Project[] = useMemo(() => data.projects || [], [data.projects])
  const expenses: Expense[] = useMemo(() => data.expenses || [], [data.expenses])

  // Build the list of months for the dropdown: last 12 months from current date
  const monthOptions = useMemo(() => {
    const opts: { key: string; label: string }[] = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = `${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`
      opts.push({ key, label })
    }
    return opts
  }, [])

  const selectedLabel = useMemo(() => {
    if (!selected) return 'ทุกเดือน / ทั้งหมด'
    const found = monthOptions.find(o => o.key === selected)
    if (found) return found.label
    const [y, mo] = selected.split('-')
    return `${THAI_MONTHS[Number(mo) - 1]} ${Number(y) + 543}`
  }, [selected, monthOptions])

  // ----- period-filtered figures -----
  const completedProjects = useMemo(
    () => projects.filter(p => p.status === 'completed'),
    [projects],
  )

  function revenueFor(key: string): number {
    return completedProjects
      .filter(p => (key ? monthKey(p.createdAt) === key : true))
      .reduce((s, p) => s + (p.value || 0), 0)
  }
  function expensesFor(key: string): number {
    return expenses
      .filter(e => (key ? monthKey(e.date) === key : true))
      .reduce((s, e) => s + (e.amount || 0), 0)
  }

  const revenue = revenueFor(selected)
  const expenseTotal = expensesFor(selected)
  const profit = revenue - expenseTotal
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0

  // previous month key (only meaningful when a specific month is selected)
  const prevKey = useMemo(() => {
    if (!selected) return ''
    const [y, mo] = selected.split('-').map(Number)
    const d = new Date(y, mo - 1 - 1, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }, [selected])

  const prevRevenue = selected ? revenueFor(prevKey) : 0
  const prevExpense = selected ? expensesFor(prevKey) : 0
  const prevProfit = prevRevenue - prevExpense
  const prevMargin = prevRevenue > 0 ? (prevProfit / prevRevenue) * 100 : 0

  function trend(curr: number, prev: number): { pct: string; up: boolean } {
    if (!Number.isFinite(prev) || prev === 0) return { pct: '0%', up: true }
    const change = ((curr - prev) / Math.abs(prev)) * 100
    return { pct: `${Math.abs(Math.round(change * 10) / 10)}%`, up: change >= 0 }
  }

  const kpis = [
    {
      icon: 'account_balance_wallet',
      label: 'รายรับ',
      value: m2(revenue),
      unit: 'บาท',
      ...trend(revenue, prevRevenue),
    },
    {
      icon: 'shopping_cart',
      label: 'ค่าใช้จ่าย',
      value: m2(expenseTotal),
      unit: 'บาท',
      ...trend(expenseTotal, prevExpense),
    },
    {
      icon: 'savings',
      label: 'กำไรสุทธิ',
      value: m2(profit),
      unit: 'บาท',
      ...trend(profit, prevProfit),
    },
    {
      icon: 'percent',
      label: 'อัตรากำไร',
      value: (Math.round(margin * 10) / 10).toFixed(1),
      unit: '%',
      ...trend(margin, prevMargin),
    },
  ]

  // ----- bar chart: last 6 months ending at selected (or current if all) -----
  const barData = useMemo(() => {
    const anchor = selected ? new Date(Number(selected.split('-')[0]), Number(selected.split('-')[1]) - 1, 1) : new Date()
    const rows: { month: string; income: number; expense: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      rows.push({
        month: THAI_MONTHS_SHORT[d.getMonth()],
        income: revenueFor(key),
        expense: expensesFor(key),
      })
    }
    return rows
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, completedProjects, expenses])

  // ----- income by project type (top 4) for selected period -----
  const incomeByType = useMemo(() => {
    const map = new Map<string, number>()
    completedProjects
      .filter(p => (selected ? monthKey(p.createdAt) === selected : true))
      .forEach(p => {
        map.set(p.type, (map.get(p.type) || 0) + (p.value || 0))
      })
    const sorted = Array.from(map.entries())
      .map(([type, value]) => ({ type, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4)
    const total = sorted.reduce((s, r) => s + r.value, 0)
    return sorted.map((r, i) => ({
      label: r.type,
      value: r.value,
      color: dpal[i],
      pct: total > 0 ? `${Math.round((r.value / total) * 100)}%` : '0%',
    }))
  }, [completedProjects, selected])

  const incomeTypeTotal = incomeByType.reduce((s, r) => s + r.value, 0)
  const donutData = incomeByType.length > 0
    ? incomeByType.map(r => ({ value: r.value, color: r.color }))
    : [{ value: 1, color: '#eef1f4' }]

  // ----- expenses by category for selected period -----
  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>()
    expenses
      .filter(e => (selected ? monthKey(e.date) === selected : true))
      .forEach(e => {
        map.set(e.category, (map.get(e.category) || 0) + (e.amount || 0))
      })
    return Array.from(map.entries())
      .map(([label, amount]) => ({ label, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [expenses, selected])

  return (
    <div style={{ fontFamily: "'IBM Plex Sans Thai', 'IBM Plex Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, margin: '16px 0 18px' }}>
        <div>
          <div style={{ fontSize: 23, fontWeight: 700, color: '#2f3b45' }}>การเงิน</div>
          <div style={{ fontSize: 13.5, color: '#7a8893', marginTop: 2 }}>ภาพรวมรายรับ-รายจ่ายของสตูดิโอ</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          onClick={() => setAddOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px', borderRadius: 10, background: '#5f7d99', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(95,125,153,.3)' }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 19 }}>add</span>เพิ่มรายจ่าย
        </div>
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 15px', border: '1px solid #e4e8ec', borderRadius: 10, fontSize: 13.5, color: '#5b6b77', fontWeight: 500, cursor: 'pointer', background: '#fff' }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#9aa7b2' }}>calendar_month</span>
            {selectedLabel}
            <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#9aa7b2' }}>expand_more</span>
          </div>
          {open && (
            <div style={{ position: 'absolute', top: 46, right: 0, zIndex: 20, background: '#fff', border: '1px solid #e4e8ec', borderRadius: 10, boxShadow: '0 8px 24px rgba(47,59,69,0.12)', minWidth: 200, maxHeight: 320, overflowY: 'auto', padding: 6 }}>
              {[{ key: '', label: 'ทุกเดือน / ทั้งหมด' }, ...monthOptions].map(o => (
                <div
                  key={o.key || 'all'}
                  onClick={() => { setSelected(o.key); setOpen(false) }}
                  style={{
                    padding: '9px 12px',
                    borderRadius: 8,
                    fontSize: 13.5,
                    cursor: 'pointer',
                    color: o.key === selected ? '#3f5366' : '#5b6b77',
                    fontWeight: o.key === selected ? 600 : 500,
                    background: o.key === selected ? '#eef3f7' : 'transparent',
                  }}
                >
                  {o.label}
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ flex: '1 1 200px', minWidth: 190, background: '#ffffff', borderRadius: 16, padding: '18px 20px', border: '1px solid #edf0f3' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#7a8893', fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#9fb0bf' }}>{k.icon}</span>
              {k.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span style={{ fontSize: 27, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>{k.value}</span>
              <span style={{ fontSize: 12.5, color: '#8a97a2' }}>{k.unit}</span>
            </div>
            <div style={{ marginTop: 9, fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 2, color: k.up ? '#3d8a64' : '#c4593f' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 15 }}>{k.up ? 'arrow_upward' : 'arrow_downward'}</span>
              {k.pct}
              <span style={{ color: '#9aa7b2', marginLeft: 2 }}>จากเดือนที่แล้ว</span>
            </div>
          </div>
        ))}
      </div>

      {/* Row 1 */}
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 18 }}>
        {/* Bar chart */}
        <div style={{ flex: '1.4 1 420px', ...cardStyle }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#2f3b45' }}>รายรับ vs ค่าใช้จ่าย</div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#7a8893' }}>
                <span style={{ width: 11, height: 11, borderRadius: 3, background: '#5f7d99', display: 'inline-block' }}></span>
                รายรับ
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#7a8893' }}>
                <span style={{ width: 11, height: 11, borderRadius: 3, background: '#e0a96d', display: 'inline-block' }}></span>
                ค่าใช้จ่าย
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={barData} barGap={4} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#edf0f3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#7a8893' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9aa7b2' }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}K`} />
              <Tooltip
                formatter={(value, name) => [
                  `฿${Number(value).toLocaleString()}`,
                  name === 'income' ? 'รายรับ' : 'ค่าใช้จ่าย',
                ]}
                contentStyle={{ borderRadius: 10, border: '1px solid #edf0f3', fontSize: 12.5 }}
              />
              <Bar dataKey="income" fill="#5f7d99" radius={[5, 5, 0, 0]} />
              <Bar dataKey="expense" fill="#e0a96d" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary */}
        <div style={{ flex: '1 1 280px', ...cardStyle }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#2f3b45', marginBottom: 16 }}>สรุปการเงิน</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13.5, color: '#5b6b77' }}>รายรับทั้งหมด</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#3d8a64', fontFamily: "'IBM Plex Sans', sans-serif" }}>+{m2(revenue)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13.5, color: '#5b6b77' }}>หัก ค่าใช้จ่ายทั้งหมด</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#c4593f', fontFamily: "'IBM Plex Sans', sans-serif" }}>-{m2(expenseTotal)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingTop: 16, borderTop: '1.5px solid #eef1f4' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#2f3b45' }}>กำไรสุทธิ</span>
              <span style={{ fontSize: 21, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>฿{m2(profit)}</span>
            </div>
            <div style={{ background: '#eef3f7', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#54697d' }}>อัตรากำไร</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#5f7d99', fontFamily: "'IBM Plex Sans', sans-serif" }}>{(Math.round(margin * 10) / 10).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        {/* Income by type donut */}
        <div style={{ flex: '1 1 360px', ...cardStyle }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#2f3b45', marginBottom: 6 }}>รายรับแยกตามประเภทงาน</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: 172, height: 172, flexShrink: 0 }}>
              <PieChart width={172} height={172}>
                <Pie
                  data={donutData}
                  cx={86}
                  cy={86}
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {donutData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>{compactK(incomeTypeTotal)}</div>
                <div style={{ fontSize: 11, color: '#8a97a2' }}>รวม</div>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 170, display: 'flex', flexDirection: 'column', gap: 13 }}>
              {incomeByType.length === 0 ? (
                <div style={{ fontSize: 13.5, color: '#9aa7b2' }}>ยังไม่มีข้อมูล</div>
              ) : incomeByType.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
                  <span style={{ width: 11, height: 11, borderRadius: 3, background: r.color, flexShrink: 0, display: 'inline-block' }}></span>
                  <span style={{ flex: 1, color: '#5b6b77' }}>{r.label}</span>
                  <span style={{ color: '#9aa7b2', fontSize: 12.5 }}>{r.pct}</span>
                  <span style={{ fontWeight: 600, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif", width: 60, textAlign: 'right' }}>{m2(r.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expense by category */}
        <div style={{ flex: '1 1 300px', ...cardStyle }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#2f3b45', marginBottom: 16 }}>รายจ่ายแยกประเภท</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {expenseByCategory.map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13.5 }}>
                <span style={{ color: '#5b6b77' }}>{e.label}</span>
                <span style={{ fontWeight: 600, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>{m2(e.amount)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1.5px solid #eef1f4' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#2f3b45' }}>รวมรายจ่าย</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>฿{m2(expenseTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {addOpen && <ExpenseModal onClose={() => setAddOpen(false)} onSaved={() => { setAddOpen(false); loadFinance() }} />}
    </div>
  )
}

const EXPENSE_CATEGORIES = [
  'ค่าวัตถุดิบ', 'ค่าแพ็กเกจจิ้ง', 'ค่าโฆษณา', 'ค่าขนส่ง', 'ค่าแรง',
  'ค่าจ้าง Outsource', 'ค่าเช่า', 'ค่าสาธารณูปโภค', 'ค่า Software / SaaS', 'ค่าใช้จ่ายสำนักงาน', 'อื่น ๆ',
]
const PAY_METHODS = ['โอนเงิน', 'เงินสด', 'บัตรเครดิต', 'เช็ค', 'หักบัญชี']

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new window.Image()
      img.onload = () => {
        const maxW = 900
        const scale = Math.min(1, maxW / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve(reader.result as string); return }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function ExpenseModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [banks, setBanks] = useState<{ bank: string; accountNo: string }[]>([])
  const [saving, setSaving] = useState(false)
  const today = new Date().toISOString().slice(0, 10)
  const [f, setF] = useState({
    date: today, description: '', category: 'ค่าวัตถุดิบ', amount: '', supplier: '',
    refNo: '', payMethod: 'โอนเงิน', bankAccount: '', note: '', receiptUrl: '',
  })

  useEffect(() => {
    fetch('/api/banks').then(r => r.json()).then(d => setBanks(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  function set(k: string, v: string) { setF(s => ({ ...s, [k]: v })) }

  async function handleReceipt(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try { set('receiptUrl', await compressImage(file)) } catch {}
  }

  async function save() {
    if (!f.description.trim() || !(Number(f.amount) > 0)) { alert('กรอกรายการและจำนวนเงินก่อน'); return }
    setSaving(true)
    try {
      await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, amount: Number(f.amount) || 0 }),
      })
      onSaved()
    } catch {
      setSaving(false)
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่')
    }
  }

  const inp: React.CSSProperties = { width: '100%', height: 40, border: '1px solid #e4e8ec', borderRadius: 10, padding: '0 12px', fontSize: 14, color: '#2f3b45', background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }
  const lbl: React.CSSProperties = { fontSize: 12.5, color: '#7a8893', marginBottom: 6 }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(40,55,70,.4)', zIndex: 60, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 560, maxWidth: '100%', background: '#fff', borderRadius: 18, boxShadow: '0 24px 60px rgba(30,45,60,.28)', overflow: 'hidden', margin: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #f0f2f5' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#2f3b45' }}>เพิ่มรายจ่าย</div>
          <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#9aa7b2' }}>close</span>
          </div>
        </div>
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '70vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}><div style={lbl}>วันที่</div><input type="date" value={f.date} onChange={e => set('date', e.target.value)} style={inp} /></div>
            <div style={{ flex: 1, minWidth: 180 }}><div style={lbl}>จำนวนเงิน (บาท) <span style={{ color: '#c4593f' }}>*</span></div><input type="number" value={f.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" style={{ ...inp, textAlign: 'right', fontFamily: "'IBM Plex Sans', sans-serif" }} /></div>
          </div>
          <div><div style={lbl}>รายการ <span style={{ color: '#c4593f' }}>*</span></div><input value={f.description} onChange={e => set('description', e.target.value)} placeholder="เช่น ค่าพิมพ์กล่อง, ค่าฟรีแลนซ์" style={inp} /></div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}><div style={lbl}>หมวดหมู่รายจ่าย</div><select value={f.category} onChange={e => set('category', e.target.value)} style={inp}>{EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div style={{ flex: 1, minWidth: 180 }}><div style={lbl}>ผู้ขาย / Supplier</div><input value={f.supplier} onChange={e => set('supplier', e.target.value)} placeholder="ชื่อร้าน/ผู้ขาย" style={inp} /></div>
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}><div style={lbl}>เลขที่เอกสารอ้างอิง</div><input value={f.refNo} onChange={e => set('refNo', e.target.value)} placeholder="เลขที่ใบเสร็จ/ใบกำกับ" style={inp} /></div>
            <div style={{ flex: 1, minWidth: 180 }}><div style={lbl}>วิธีชำระเงิน</div><select value={f.payMethod} onChange={e => set('payMethod', e.target.value)} style={inp}>{PAY_METHODS.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
          </div>
          <div><div style={lbl}>บัญชีธนาคารที่ใช้จ่าย</div><select value={f.bankAccount} onChange={e => set('bankAccount', e.target.value)} style={inp}><option value="">— ไม่ระบุ —</option>{banks.map((b, i) => <option key={i} value={`${b.bank} · ${b.accountNo}`}>{b.bank} · {b.accountNo}</option>)}</select></div>
          <div><div style={lbl}>หมายเหตุ</div><textarea value={f.note} onChange={e => set('note', e.target.value)} placeholder="รายละเอียดเพิ่มเติม" style={{ ...inp, height: 'auto', minHeight: 60, padding: '10px 12px', resize: 'vertical', lineHeight: 1.5 }} /></div>
          <div>
            <div style={lbl}>แนบไฟล์ใบเสร็จ / ใบกำกับภาษี</div>
            {f.receiptUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 11, border: '1px solid #d6e7dd', borderRadius: 11, background: '#f7faf8' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.receiptUrl} alt="receipt" style={{ width: 46, height: 46, borderRadius: 8, objectFit: 'cover' }} />
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#3d8a64', fontWeight: 600 }}><span className="material-symbols-rounded" style={{ fontSize: 17 }}>check_circle</span>แนบไฟล์แล้ว</div>
                <div onClick={() => set('receiptUrl', '')} style={{ cursor: 'pointer' }}><span className="material-symbols-rounded" style={{ fontSize: 19, color: '#c3cdd6' }}>delete</span></div>
              </div>
            ) : (
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 13, border: '1.5px dashed #c9d7cf', borderRadius: 11, cursor: 'pointer', background: '#f7faf8' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 23, color: '#5f9b78' }}>add_photo_alternate</span>
                <span style={{ fontSize: 13, color: '#3d6a52', fontWeight: 600 }}>แนบรูปใบเสร็จ / ใบกำกับภาษี</span>
                <input type="file" accept="image/*" onChange={handleReceipt} style={{ display: 'none' }} />
              </label>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 9, padding: '16px 22px', borderTop: '1px solid #f0f2f5' }}>
          <div onClick={onClose} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, border: '1px solid #e4e8ec', borderRadius: 11, fontSize: 14, color: '#5b6b77', fontWeight: 500, cursor: 'pointer' }}>ยกเลิก</div>
          <button onClick={save} disabled={saving} style={{ flex: 1.4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 44, borderRadius: 11, background: '#5f7d99', color: '#fff', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', border: 'none', fontFamily: 'inherit' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 19 }}>save</span>{saving ? 'กำลังบันทึก...' : 'บันทึกรายจ่าย'}
          </button>
        </div>
      </div>
    </div>
  )
}

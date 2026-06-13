'use client'

import { useEffect, useState } from 'react'

interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: string
}

interface FinanceData {
  totalRevenue?: number
  totalExpenses?: number
  netProfit?: number
  profitMargin?: number
  expenses?: Expense[]
}

function formatMoney(n: number) {
  return '฿' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const monthlyData = [
  { month: 'ม.ค.', value: 65000 },
  { month: 'ก.พ.', value: 78000 },
  { month: 'มี.ค.', value: 72000 },
  { month: 'เม.ย.', value: 85000 },
  { month: 'พ.ค.', value: 92000 },
  { month: 'มิ.ย.', value: 88000 },
]

const donutData = [
  { label: 'บรรจุภัณฑ์', pct: 35, color: '#5f7d99' },
  { label: 'โลโก้', pct: 25, color: '#3d8a64' },
  { label: 'Label', pct: 20, color: '#f4a431' },
  { label: 'อื่นๆ', pct: 20, color: '#7c6fab' },
]

const expenseCategories = ['วัสดุ', 'ซอฟต์แวร์', 'การตลาด', 'สาธารณูปโภค', 'อุปกรณ์', 'อื่นๆ']

const CHART_W = 480
const CHART_H = 160
const BAR_W = 44
const GAP = (CHART_W - BAR_W * monthlyData.length) / (monthlyData.length + 1)
const maxVal = Math.max(...monthlyData.map(d => d.value))

function BarChart() {
  return (
    <svg width="100%" viewBox={`0 0 ${CHART_W} ${CHART_H + 40}`} style={{ display: 'block' }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
        const y = CHART_H * (1 - pct)
        return (
          <g key={i}>
            <line x1={0} y1={y} x2={CHART_W} y2={y} stroke="#edf0f3" strokeWidth={1} />
            <text x={0} y={y - 3} fontSize={9} fill="#9aa7b2" textAnchor="start">
              {formatMoney(maxVal * pct)}
            </text>
          </g>
        )
      })}
      {/* Bars */}
      {monthlyData.map((d, i) => {
        const barH = (d.value / maxVal) * CHART_H
        const x = GAP + i * (BAR_W + GAP)
        const y = CHART_H - barH
        return (
          <g key={i}>
            <rect x={x} y={y} width={BAR_W} height={barH} rx={6} fill="#5f7d99" opacity={0.85} />
            <text x={x + BAR_W / 2} y={CHART_H + 16} fontSize={11} fill="#7a8893" textAnchor="middle">{d.month}</text>
            <text x={x + BAR_W / 2} y={y - 5} fontSize={10} fill="#5f7d99" textAnchor="middle" fontWeight="600">
              {(d.value / 1000).toFixed(0)}K
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function DonutChart() {
  const r = 70
  const cx = 90
  const cy = 90
  const circum = 2 * Math.PI * r
  let offset = 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <svg width={180} height={180} style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#edf0f3" strokeWidth={22} />
        {donutData.map((d, i) => {
          const dash = (d.pct / 100) * circum
          const gap = circum - dash
          const el = (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={22}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
            />
          )
          offset += dash
          return el
        })}
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize={13} fill="#7a8893">รายรับ</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={13} fill="#7a8893">ตามประเภท</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {donutData.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: d.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#7a8893' }}>{d.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#2f3b45', marginLeft: 4 }}>{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #edf0f3',
  borderRadius: 10,
  fontSize: 14,
  color: '#2f3b45',
  background: '#f9fafb',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

export default function FinancePage() {
  const [data, setData] = useState<FinanceData>({})
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: 'วัสดุ',
    date: new Date().toISOString().slice(0, 10),
  })

  const load = () => {
    fetch('/api/finance')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
  }

  useEffect(() => { load() }, [])

  const totalRevenue = data.totalRevenue ?? 480000
  const totalExpenses = data.totalExpenses ?? 168000
  const netProfit = data.netProfit ?? (totalRevenue - totalExpenses)
  const profitMargin = data.profitMargin ?? Math.round((netProfit / totalRevenue) * 100)
  const expenses: Expense[] = data.expenses || []

  async function handleAddExpense() {
    if (!expenseForm.description || !expenseForm.amount) return
    setSaving(true)
    try {
      await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...expenseForm,
          amount: parseFloat(expenseForm.amount),
        }),
      })
      setExpenseForm({ description: '', amount: '', category: 'วัสดุ', date: new Date().toISOString().slice(0, 10) })
      setShowForm(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  const kpis = [
    { label: 'รายรับรวม', value: formatMoney(totalRevenue), icon: 'trending_up', color: '#3d8a64', bg: '#e9f3ed', change: '+12%' },
    { label: 'รายจ่ายรวม', value: formatMoney(totalExpenses), icon: 'trending_down', color: '#f4a431', bg: '#fdf3e3', change: '+5%' },
    { label: 'กำไรสุทธิ', value: formatMoney(netProfit), icon: 'account_balance', color: '#5f7d99', bg: '#e8eef4', change: '+18%' },
    { label: 'อัตรากำไร', value: `${profitMargin}%`, icon: 'percent', color: '#7c6fab', bg: '#f0eef8', change: '' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#2f3b45', margin: 0 }}>รายงานการเงิน</h1>
        <p style={{ fontSize: 14, color: '#7a8893', margin: '4px 0 0' }}>สรุปรายรับ รายจ่าย และกำไร</p>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
        {kpis.map((kpi, i) => (
          <div key={i} style={{
            background: '#fff',
            borderRadius: 18,
            border: '1px solid #edf0f3',
            padding: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: '#7a8893' }}>{kpi.label}</span>
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: kpi.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 20, color: kpi.color }}>{kpi.icon}</span>
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#2f3b45', marginBottom: 4 }}>{kpi.value}</div>
            {kpi.change && (
              <div style={{ fontSize: 12, color: '#3d8a64', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 14 }}>arrow_upward</span>
                {kpi.change} จากเดือนที่แล้ว
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, marginBottom: 20 }}>
        {/* Bar chart */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 22 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2f3b45', margin: '0 0 18px' }}>
            รายรับรายเดือน (6 เดือนล่าสุด)
          </h3>
          <BarChart />
        </div>

        {/* Donut chart */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 22 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2f3b45', margin: '0 0 18px' }}>
            รายรับตามประเภท
          </h3>
          <DonutChart />
        </div>
      </div>

      {/* Expenses table */}
      <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2f3b45', margin: 0 }}>รายการรายจ่าย</h3>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              background: '#5f7d99', color: '#fff', border: 'none', borderRadius: 10,
              padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>add</span>
            บันทึกรายจ่าย
          </button>
        </div>

        {/* Add expense form */}
        {showForm && (
          <div style={{
            background: '#f9fafb',
            borderRadius: 14,
            border: '1px solid #edf0f3',
            padding: 18,
            marginBottom: 18,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#7a8893', display: 'block', marginBottom: 6 }}>รายการ</label>
                <input
                  style={inputStyle}
                  placeholder="รายการรายจ่าย"
                  value={expenseForm.description}
                  onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#7a8893', display: 'block', marginBottom: 6 }}>จำนวน (฿)</label>
                <input
                  style={inputStyle}
                  type="number"
                  placeholder="0.00"
                  value={expenseForm.amount}
                  onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#7a8893', display: 'block', marginBottom: 6 }}>หมวด</label>
                <select
                  style={inputStyle}
                  value={expenseForm.category}
                  onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value }))}
                >
                  {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#7a8893', display: 'block', marginBottom: 6 }}>วันที่</label>
                <input
                  style={inputStyle}
                  type="date"
                  value={expenseForm.date}
                  onChange={e => setExpenseForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>
              <button
                onClick={handleAddExpense}
                disabled={saving}
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: 10,
                  background: '#5f7d99',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                {saving ? 'บันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #edf0f3' }}>
                {['วันที่', 'รายการ', 'หมวด', 'จำนวน'].map(h => (
                  <th key={h} style={{
                    padding: '10px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#9aa7b2',
                    textAlign: h === 'จำนวน' ? 'right' : 'left',
                    letterSpacing: '0.04em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: 32, color: '#9aa7b2', fontSize: 13 }}>
                    ยังไม่มีรายการรายจ่าย
                  </td>
                </tr>
              ) : expenses.map((exp, i) => (
                <tr key={exp.id} style={{
                  borderBottom: i < expenses.length - 1 ? '1px solid #edf0f3' : 'none',
                }}>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: '#7a8893' }}>{exp.date}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: '#2f3b45', fontWeight: 500 }}>{exp.description}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      background: '#e8eef4', color: '#5f7d99',
                      borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600,
                    }}>{exp.category}</span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#c4593f', textAlign: 'right' }}>
                    {formatMoney(exp.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

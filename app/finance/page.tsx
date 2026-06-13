'use client'

import { useEffect, useState } from 'react'
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

const barData = [
  { month: 'ม.ค.', income: 320000, expense: 28000 },
  { month: 'ก.พ.', income: 360000, expense: 31000 },
  { month: 'มี.ค.', income: 410000, expense: 29500 },
  { month: 'เม.ย.', income: 395000, expense: 33000 },
  { month: 'พ.ค.', income: 480000, expense: 35000 },
  { month: 'มิ.ย.', income: 445000, expense: 30000 },
]

const incomeByType = [
  { label: 'บรรจุภัณฑ์', pct: '42%', amt: '฿201,600', color: '#5f7d99' },
  { label: 'โลโก้/CI', pct: '28%', amt: '฿134,400', color: '#3d8a64' },
  { label: 'Label Design', pct: '18%', amt: '฿86,400', color: '#e0a96d' },
  { label: 'อื่นๆ', pct: '12%', amt: '฿57,600', color: '#a98fd4' },
]

const donutData = [
  { value: 42, color: '#5f7d99' },
  { value: 28, color: '#3d8a64' },
  { value: 18, color: '#e0a96d' },
  { value: 12, color: '#a98fd4' },
]

const expenseList = [
  { label: 'ค่าซอฟต์แวร์', amt: '฿12,000' },
  { label: 'ค่าฟรีแลนซ์/ผู้ช่วย', amt: '฿10,000' },
  { label: 'ค่าพิมพ์ตัวอย่าง', amt: '฿8,500' },
  { label: 'ค่าสาธารณูปโภค', amt: '฿4,500' },
]

const expenseCategories = ['วัสดุ', 'ซอฟต์แวร์', 'การตลาด', 'สาธารณูปโภค', 'อุปกรณ์', 'อื่นๆ']

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 18,
  border: '1px solid #edf0f3',
  padding: 22,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #e4e8ec',
  borderRadius: 10,
  fontSize: 13.5,
  color: '#2f3b45',
  background: '#fff',
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

  const expenses: Expense[] = data.expenses || []

  async function handleAddExpense() {
    if (!expenseForm.description || !expenseForm.amount) return
    setSaving(true)
    try {
      await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...expenseForm, amount: parseFloat(expenseForm.amount) }),
      })
      setExpenseForm({ description: '', amount: '', category: 'วัสดุ', date: new Date().toISOString().slice(0, 10) })
      setShowForm(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ fontFamily: "'IBM Plex Sans Thai', 'IBM Plex Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, margin: '16px 0 18px' }}>
        <div>
          <div style={{ fontSize: 23, fontWeight: 700, color: '#2f3b45' }}>การเงิน</div>
          <div style={{ fontSize: 13.5, color: '#7a8893', marginTop: 2 }}>ภาพรวมรายรับ-รายจ่ายของสตูดิโอ</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 15px', border: '1px solid #e4e8ec', borderRadius: 10, fontSize: 13.5, color: '#5b6b77', fontWeight: 500, cursor: 'pointer', background: '#fff' }}>
          <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#9aa7b2' }}>calendar_month</span>
          พฤษภาคม 2567
          <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#9aa7b2' }}>expand_more</span>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
        {[
          { icon: 'trending_up', label: 'รายรับรวม', value: '฿480,000', unit: '', trend: '+12%', trendUp: true },
          { icon: 'trending_down', label: 'รายจ่ายรวม', value: '฿35,000', unit: '', trend: '+5%', trendUp: false },
          { icon: 'account_balance_wallet', label: 'กำไรสุทธิ', value: '฿445,000', unit: '', trend: '+18%', trendUp: true },
          { icon: 'percent', label: 'อัตรากำไร', value: '92.7', unit: '%', trend: '', trendUp: true },
        ].map((k, i) => (
          <div key={i} style={{ flex: '1 1 200px', minWidth: 190, background: '#ffffff', borderRadius: 16, padding: '18px 20px', border: '1px solid #edf0f3' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#7a8893', fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#9fb0bf' }}>{k.icon}</span>
              {k.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span style={{ fontSize: 27, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>{k.value}</span>
              <span style={{ fontSize: 12.5, color: '#8a97a2' }}>{k.unit}</span>
            </div>
            {k.trend && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12.5, marginTop: 6, color: k.trendUp ? '#3d8a64' : '#c4593f' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 15 }}>{k.trendUp ? 'arrow_upward' : 'arrow_downward'}</span>
                {k.trend}
                <span style={{ color: '#9aa7b2', marginLeft: 2 }}>จากเดือนที่แล้ว</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts row */}
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
          <ResponsiveContainer width="100%" height={200}>
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

        {/* Summary card */}
        <div style={{ flex: '1 1 280px', ...cardStyle }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#2f3b45', marginBottom: 16 }}>สรุปการเงิน</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13.5, color: '#5b6b77' }}>รายรับทั้งหมด</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#3d8a64', fontFamily: "'IBM Plex Sans', sans-serif" }}>+480,000.00</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13.5, color: '#5b6b77' }}>หัก ค่าใช้จ่ายทั้งหมด</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#c4593f', fontFamily: "'IBM Plex Sans', sans-serif" }}>-35,000.00</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingTop: 16, borderTop: '1.5px solid #eef1f4' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#2f3b45' }}>กำไรสุทธิ</span>
              <span style={{ fontSize: 21, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>฿445,000.00</span>
            </div>
            <div style={{ background: '#eef3f7', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#54697d' }}>อัตรากำไร</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#5f7d99', fontFamily: "'IBM Plex Sans', sans-serif" }}>92.7%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 18 }}>
        {/* Donut + legend */}
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
                  dataKey="value"
                  strokeWidth={0}
                >
                  {donutData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>480K</div>
                <div style={{ fontSize: 11, color: '#8a97a2' }}>รวม</div>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 170, display: 'flex', flexDirection: 'column', gap: 13 }}>
              {incomeByType.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: r.color, flexShrink: 0, display: 'inline-block' }}></span>
                  <span style={{ flex: 1, color: '#5b6b77' }}>{r.label}</span>
                  <span style={{ color: '#9aa7b2', fontSize: 12.5 }}>{r.pct}</span>
                  <span style={{ fontWeight: 600, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif", width: 70, textAlign: 'right' }}>{r.amt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expense breakdown */}
        <div style={{ flex: '1 1 300px', ...cardStyle }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#2f3b45', marginBottom: 16 }}>รายจ่ายแยกประเภท</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {expenseList.map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13.5 }}>
                <span style={{ color: '#5b6b77' }}>{e.label}</span>
                <span style={{ fontWeight: 600, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>{e.amt}</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1.5px solid #eef1f4' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#2f3b45' }}>รวมรายจ่าย</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>฿35,000.00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expense log table */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#2f3b45' }}>รายการรายจ่าย</div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{ background: '#5f7d99', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>add</span>
            บันทึกรายจ่าย
          </button>
        </div>

        {showForm && (
          <div style={{ background: '#f9fafb', borderRadius: 14, border: '1px solid #edf0f3', padding: 18, marginBottom: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#7a8893', display: 'block', marginBottom: 6 }}>รายการ</label>
                <input style={inputStyle} placeholder="รายการรายจ่าย" value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#7a8893', display: 'block', marginBottom: 6 }}>จำนวน (฿)</label>
                <input style={inputStyle} type="number" placeholder="0.00" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#7a8893', display: 'block', marginBottom: 6 }}>หมวด</label>
                <select style={inputStyle} value={expenseForm.category} onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value }))}>
                  {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#7a8893', display: 'block', marginBottom: 6 }}>วันที่</label>
                <input style={inputStyle} type="date" value={expenseForm.date} onChange={e => setExpenseForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <button
                onClick={handleAddExpense}
                disabled={saving}
                style={{ padding: '10px 16px', border: 'none', borderRadius: 10, background: '#5f7d99', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
              >
                {saving ? 'บันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #edf0f3' }}>
                {['วันที่', 'รายการ', 'หมวด', 'จำนวน'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, color: '#9aa7b2', textAlign: h === 'จำนวน' ? 'right' : 'left', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: 32, color: '#9aa7b2', fontSize: 13 }}>ยังไม่มีรายการรายจ่าย</td>
                </tr>
              ) : expenses.map((exp, i) => (
                <tr key={exp.id} style={{ borderBottom: i < expenses.length - 1 ? '1px solid #edf0f3' : 'none' }}>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: '#7a8893' }}>{exp.date}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: '#2f3b45', fontWeight: 500 }}>{exp.description}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ background: '#e8eef4', color: '#5f7d99', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600 }}>{exp.category}</span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#c4593f', textAlign: 'right', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                    ฿{exp.amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
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

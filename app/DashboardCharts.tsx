'use client'

import {
  PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

interface DonutItem {
  label: string
  value: number
  color: string
}

interface Props {
  donutData: DonutItem[]
  salesData: number[]
  salesMonths: string[]
  mode: 'donut' | 'line'
}

function formatYAxis(value: number) {
  if (value === 0) return '0'
  return (value / 1000).toFixed(0) + 'K'
}

export default function DashboardCharts({ donutData, salesData, salesMonths, mode }: Props) {
  if (mode === 'donut') {
    const total = donutData.reduce((s, d) => s + d.value, 0)
    const displayData = donutData.map(d => ({ ...d, value: d.value === 0 ? 0.001 : d.value }))

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        {/* Donut */}
        <div style={{ position: 'relative', width: 184, height: 184, flexShrink: 0 }}>
          <PieChart width={184} height={184}>
            <Pie
              data={displayData}
              cx={92}
              cy={92}
              innerRadius={58}
              outerRadius={84}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              strokeWidth={2}
              stroke="#fff"
            >
              {displayData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
          {/* Center text */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>{total}</div>
            <div style={{ fontSize: 12, color: '#8a97a2' }}>โปรเจกต์</div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ flex: 1, minWidth: 130, display: 'flex', flexDirection: 'column', gap: 11 }}>
          {donutData.map((d) => (
            <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5 }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
              <span style={{ flex: 1, color: '#5b6b77' }}>{d.label}</span>
              <span style={{ fontWeight: 600, color: '#2f3b45' }}>{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Line chart mode
  const lineData = salesData.map((value, i) => ({ month: salesMonths[i], value }))

  const CustomDot = (props: { cx?: number; cy?: number; index?: number }) => {
    const { cx, cy, index } = props
    if (index === salesData.length - 1) {
      return <circle cx={cx} cy={cy} r={5} fill="#5f7d99" stroke="#fff" strokeWidth={2} />
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={lineData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#edf0f3" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#7a8893' }} axisLine={false} tickLine={false} />
        <YAxis
          tickFormatter={formatYAxis}
          tick={{ fontSize: 11, fill: '#7a8893' }}
          axisLine={false}
          tickLine={false}
          ticks={[0, 100000, 200000, 300000, 400000, 500000]}
          domain={[0, 500000]}
          width={40}
        />
        <Tooltip
          formatter={(value) => ['฿' + Number(value).toLocaleString('th-TH'), 'ยอดขาย']}
          labelStyle={{ color: '#2f3b45', fontSize: 12 }}
          contentStyle={{ borderRadius: 8, border: '1px solid #edf0f3', fontSize: 12 }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#5f7d99"
          strokeWidth={2.5}
          dot={<CustomDot />}
          activeDot={{ r: 5, fill: '#5f7d99', stroke: '#fff', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

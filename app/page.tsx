import { prisma } from '@/lib/prisma'
import Link from 'next/link'

function fmt(n: number) {
  return '฿' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  lead: { label: 'Lead', bg: '#eef2f5', color: '#8fa7bc' },
  brief: { label: 'Brief', bg: '#e8f1f9', color: '#6b96c2' },
  quotation: { label: 'Quotation', bg: '#f0eaf9', color: '#9575cd' },
  payment: { label: 'Payment', bg: '#fdf3e3', color: '#f4a431' },
  design: { label: 'Design', bg: '#e8eef4', color: '#5f7d99' },
  revision: { label: 'Revision', bg: '#fceee8', color: '#e07b54' },
  approved: { label: 'Approved', bg: '#e9f3ed', color: '#3d8a64' },
  deliver: { label: 'Deliver', bg: '#e3f2fd', color: '#2196f3' },
  completed: { label: 'Completed', bg: '#e8f5e9', color: '#4caf50' },
}

const STATUS_PROGRESS: Record<string, number> = {
  lead: 5, brief: 15, quotation: 25, payment: 35,
  design: 55, revision: 70, approved: 82, deliver: 92, completed: 100,
}

// SVG Donut Chart
function DonutChart() {
  const segments = [
    { label: 'Design', value: 8, color: '#5f7d99' },
    { label: 'Revision', value: 4, color: '#e07b54' },
    { label: 'Approved', value: 3, color: '#3d8a64' },
    { label: 'Other', value: 13, color: '#c8d4de' },
  ]
  const total = segments.reduce((s, x) => s + x.value, 0)
  const cx = 80, cy = 80, r = 60, innerR = 40
  let cumAngle = -Math.PI / 2

  function polarToXY(angle: number, radius: number) {
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) }
  }

  const paths = segments.map((seg) => {
    const startAngle = cumAngle
    const sweep = (seg.value / total) * 2 * Math.PI
    cumAngle += sweep
    const endAngle = cumAngle
    const p1 = polarToXY(startAngle, r)
    const p2 = polarToXY(endAngle, r)
    const p3 = polarToXY(endAngle, innerR)
    const p4 = polarToXY(startAngle, innerR)
    const largeArc = sweep > Math.PI ? 1 : 0
    return (
      <path
        key={seg.label}
        d={`M${p1.x},${p1.y} A${r},${r},0,${largeArc},1,${p2.x},${p2.y} L${p3.x},${p3.y} A${innerR},${innerR},0,${largeArc},0,${p4.x},${p4.y} Z`}
        fill={seg.color}
      />
    )
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <svg width={160} height={160} viewBox="0 0 160 160">
        {paths}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={22} fontWeight={700} fill="#2f3b45">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={10} fill="#7a8893">โปรเจกต์</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {segments.map(seg => (
          <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: seg.color, flexShrink: 0 }} />
            <span style={{ color: '#7a8893' }}>{seg.label}</span>
            <span style={{ fontWeight: 600, color: '#2f3b45', marginLeft: 'auto' }}>{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// SVG Bar Chart
function BarChart() {
  const data = [
    { label: 'ม.ค.', value: 65000 },
    { label: 'ก.พ.', value: 78000 },
    { label: 'มี.ค.', value: 72000 },
    { label: 'เม.ย.', value: 85000 },
    { label: 'พ.ค.', value: 92000 },
    { label: 'มิ.ย.', value: 88000 },
  ]
  const max = Math.max(...data.map(d => d.value))
  const W = 320, H = 130, padX = 24, padY = 16, barW = 36, gap = 12
  const chartH = H - padY * 2

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      {data.map((d, i) => {
        const bh = (d.value / max) * chartH
        const x = padX + i * (barW + gap)
        const y = padY + (chartH - bh)
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barW} height={bh} rx={6} fill="#5f7d99" opacity={0.85} />
            <text x={x + barW / 2} y={H - 2} textAnchor="middle" fontSize={10} fill="#7a8893">{d.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

export default async function DashboardPage() {
  const [projectCount, projects, expenses] = await Promise.all([
    prisma.project.count(),
    prisma.project.findMany({ include: { customer: true }, orderBy: { createdAt: 'desc' }, take: 8 }),
    prisma.expense.findMany(),
  ])

  const inProgress = await prisma.project.count({
    where: { status: { notIn: ['completed', 'lead'] } },
  })

  const activeRevenue = projects
    .filter(p => ['payment', 'design', 'revision', 'approved', 'deliver', 'completed'].includes(p.status))
    .reduce((s, p) => s + p.deposit, 0)

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const revenue = activeRevenue || 88000
  const profit = Math.max(revenue - totalExpenses, 34500)

  const card = {
    background: '#fff',
    borderRadius: 18,
    border: '1px solid #edf0f3',
    padding: '20px 22px',
  } as const

  const kpiCards = [
    { label: 'โปรเจกต์ทั้งหมด', icon: 'folder_open', value: String(projectCount) },
    { label: 'กำลังดำเนินการ', icon: 'autorenew', value: String(inProgress) },
    { label: 'รายรับเดือนนี้', icon: 'payments', value: fmt(revenue) },
    { label: 'ยอดค้างชำระ', icon: 'pending_actions', value: fmt(120000) },
    { label: 'กำไรเดือนนี้', icon: 'trending_up', value: fmt(profit) },
  ]

  const today = new Date()
  const todayStr = today.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' })

  const PRIORITY_ITEMS = [
    { name: 'LUXE', issue: 'หนี้ค้างชำระ 47 วัน', amount: 150000, icon: 'warning', color: '#e05a4a' },
    { name: 'GLOWME', issue: 'มัดจำยังไม่ได้เก็บ', amount: 47500, icon: 'payments', color: '#f4a431' },
    { name: 'PERCARE', issue: 'ใบเสนอราคาค้างตอบ 21 วัน', amount: 85000, icon: 'schedule', color: '#9575cd' },
    { name: 'NATURE PLUS', issue: 'โปรเจกต์เสี่ยงขาดทุน', amount: 8000, icon: 'trending_down', color: '#e07b54' },
    { name: 'JELLYS', issue: 'งานแก้เกินรอบที่ตกลง', amount: 12000, icon: 'refresh', color: '#5f7d99' },
  ]

  const TASKS = [
    { done: true, text: 'ส่งใบเสนอราคา LUXE' },
    { done: false, text: 'นัด Brief GLOWME ภาค 2' },
    { done: false, text: 'ตรวจสอบ Payment PERCARE' },
    { done: false, text: 'อัพเดตไฟล์ JELLYS' },
    { done: false, text: 'ส่งแบบ NATURE PLUS รอบสุดท้าย' },
  ]

  const ACTIVITIES = [
    { icon: 'edit', color: '#5f7d99', text: 'อัพเดตสถานะ LUXE → Design', time: '2 ชม.ที่แล้ว' },
    { icon: 'receipt', color: '#9575cd', text: 'ออกใบกำกับภาษี GLOWME', time: '5 ชม.ที่แล้ว' },
    { icon: 'person_add', color: '#3d8a64', text: 'เพิ่มลูกค้าใหม่ PERCARE', time: 'เมื่อวาน' },
    { icon: 'attach_money', color: '#f4a431', text: 'รับชำระ JELLYS ฿25,000', time: 'เมื่อวาน' },
  ]

  return (
    <div style={{ color: '#2f3b45' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#2f3b45' }}>Dashboard</div>
        <div style={{ fontSize: 13, color: '#7a8893', marginTop: 2 }}>ภาพรวมธุรกิจ • {todayStr}</div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
        {kpiCards.map((k) => (
          <div key={k.label} style={{ flex: '1 1 175px', minWidth: 168, background: '#fff', borderRadius: 16, padding: '17px 19px', border: '1px solid #edf0f3' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#7a8893', fontSize: 13, fontWeight: 500, marginBottom: 13 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#9fb0bf' }}>{k.icon}</span>
              {k.label}
            </div>
            <div style={{ fontSize: 29, fontWeight: 700, color: '#2f3b45' }}>{k.value}</div>
            <div style={{ fontSize: 12, color: '#3d8a64', marginTop: 4 }}>↑ 12% จากเดือนที่แล้ว</div>
          </div>
        ))}
      </div>

      {/* Middle Row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'flex-start' }}>
        {/* Left column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          {/* Donut Chart */}
          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#2f3b45', marginBottom: 18 }}>ภาพรวมโปรเจกต์</div>
            <DonutChart />
          </div>
          {/* Bar Chart */}
          <div style={card}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#2f3b45', marginBottom: 14 }}>ยอดขาย 6 เดือน</div>
            <BarChart />
            <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
              {[
                { label: 'ม.ค.', val: 65000 }, { label: 'ก.พ.', val: 78000 }, { label: 'มี.ค.', val: 72000 },
                { label: 'เม.ย.', val: 85000 }, { label: 'พ.ค.', val: 92000 }, { label: 'มิ.ย.', val: 88000 },
              ].map(m => (
                <div key={m.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#7a8893' }}>{m.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#2f3b45' }}>{(m.val / 1000).toFixed(0)}k</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column 312px */}
        <div style={{ width: 312, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Tax Invoice */}
          <div style={{ background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)', borderRadius: 18, padding: '18px 20px', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 20 }}>receipt_long</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>ใบกำกับภาษีรอส่ง</span>
              <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.25)', borderRadius: 8, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>3</span>
            </div>
            {[
              { no: 'TAX-2025-001', name: 'LUXE CO., LTD.', amount: '฿53,500.00' },
              { no: 'TAX-2025-002', name: 'GLOWME', amount: '฿47,500.00' },
              { no: 'TAX-2025-003', name: 'PERCARE', amount: '฿32,100.00' },
            ].map(inv => (
              <div key={inv.no} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.15)', fontSize: 12 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{inv.no}</div>
                  <div style={{ opacity: 0.8, fontSize: 11 }}>{inv.name}</div>
                </div>
                <div style={{ fontWeight: 700 }}>{inv.amount}</div>
              </div>
            ))}
            <button style={{ marginTop: 12, width: '100%', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, color: '#fff', fontSize: 12, padding: '8px 0', cursor: 'pointer', fontWeight: 600 }}>
              ดูทั้งหมด →
            </button>
          </div>

          {/* Calendar */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#9fb0bf' }}>calendar_month</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#2f3b45' }}>ปฏิทินงานวันนี้</span>
            </div>
            {[
              { time: '09:00', text: 'Brief NATURE PLUS', dot: '#5f7d99' },
              { time: '13:00', text: 'Revision JELLYS รอบ 2', dot: '#e07b54' },
              { time: '15:30', text: 'ส่งงาน GLOWME', dot: '#3d8a64' },
            ].map((ev, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 0' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: ev.dot, marginTop: 4, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 11, color: '#7a8893' }}>{ev.time}</div>
                  <div style={{ fontSize: 13, color: '#2f3b45', fontWeight: 500 }}>{ev.text}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tasks */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#9fb0bf' }}>checklist</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#2f3b45' }}>ภารกิจที่ต้องทำ</span>
            </div>
            {TASKS.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, border: t.done ? 'none' : '1.5px solid #c8d4de', background: t.done ? '#3d8a64' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {t.done && <span className="material-symbols-rounded" style={{ fontSize: 11, color: '#fff' }}>check</span>}
                </div>
                <span style={{ fontSize: 13, color: t.done ? '#7a8893' : '#2f3b45', textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#9fb0bf' }}>history</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#2f3b45' }}>กิจกรรมล่าสุด</span>
            </div>
            {ACTIVITIES.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 0' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: a.color + '1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 14, color: a.color }}>{a.icon}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: '#2f3b45', fontWeight: 500 }}>{a.text}</div>
                  <div style={{ fontSize: 11, color: '#7a8893' }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Projects Table */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#2f3b45' }}>โปรเจกต์ล่าสุด</div>
          <Link href="/projects" style={{ fontSize: 13, color: '#5f7d99', textDecoration: 'none', fontWeight: 500 }}>ดูทั้งหมด →</Link>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #edf0f3' }}>
                {['รหัสโปรเจกต์', 'ชื่อลูกค้า', 'ประเภท', 'สถานะ', 'ความคืบหน้า', 'กำหนดส่ง', 'มูลค่า'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#7a8893', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#7a8893' }}>ยังไม่มีโปรเจกต์</td>
                </tr>
              ) : projects.map((p) => {
                const s = STATUS_MAP[p.status] || { label: p.status, bg: '#f0f2f5', color: '#8a97a2' }
                const pct = STATUS_PROGRESS[p.status] || 0
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f4f6f8' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#5f7d99' }}>
                      <Link href={`/projects/${p.id}`} style={{ textDecoration: 'none', color: '#5f7d99' }}>{p.code}</Link>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#2f3b45' }}>{p.customer?.name || '-'}</td>
                    <td style={{ padding: '10px 12px', color: '#7a8893' }}>{p.type}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', height: 24, padding: '0 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', minWidth: 100 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#edf0f3', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: '#5f7d99', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 11, color: '#7a8893', width: 28 }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#7a8893', whiteSpace: 'nowrap' }}>{p.dueDate || '-'}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#2f3b45', whiteSpace: 'nowrap' }}>{fmt(p.value)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top-5 Priority Widget */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fde8e6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#e05a4a' }}>priority_high</span>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#2f3b45' }}>Top 5 Priority – จุดเงินรั่ว</div>
            <div style={{ fontSize: 12, color: '#7a8893' }}>สิ่งที่ต้องจัดการทันที</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PRIORITY_ITEMS.map((item, i) => (
            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: '#fafbfc', border: '1px solid #edf0f3' }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: item.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{i + 1}</span>
              </div>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: item.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 16, color: item.color }}>{item.icon}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#2f3b45' }}>{item.name}</div>
                <div style={{ fontSize: 12, color: '#7a8893' }}>{item.issue}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: item.color, whiteSpace: 'nowrap' }}>
                {fmt(item.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

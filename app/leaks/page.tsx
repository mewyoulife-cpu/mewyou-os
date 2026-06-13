'use client'

function formatMoney(n: number) {
  return '฿' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const tierMap: Record<string, { label: string; bg: string; color: string }> = {
  urgent: { label: 'ด่วนที่สุด', bg: '#fceee8', color: '#c4593f' },
  high: { label: 'ด่วนมาก', bg: '#fdf3e3', color: '#f4a431' },
  medium: { label: 'ควรทำเร็ว', bg: '#e8eef4', color: '#5f7d99' },
  watch: { label: 'เฝ้าระวัง', bg: '#e9f3ed', color: '#3d8a64' },
}

const priorityList = [
  { rank: 1, tier: 'urgent', icon: 'phone_in_talk', customer: 'LUXE', reason: 'หนี้ค้างชำระ 47 วัน', action: 'โทรทวงทันที', amount: 150000 },
  { rank: 2, tier: 'urgent', icon: 'receipt_long', customer: 'GLOWME', reason: 'มัดจำค้างเก็บ 30 วัน', action: 'ส่ง Invoice ด่วน', amount: 47500 },
  { rank: 3, tier: 'urgent', icon: 'receipt_long', customer: 'NATURE PLUS', reason: 'มัดจำค้างเก็บ 25 วัน', action: 'ส่ง Invoice ด่วน', amount: 47500 },
  { rank: 4, tier: 'high', icon: 'mark_email_unread', customer: 'PERCARE', reason: 'QT-001 เงียบหายมา 21 วัน', action: 'ติดตาม Follow-up', amount: 85000 },
  { rank: 5, tier: 'high', icon: 'mark_email_unread', customer: 'BELLA CARE', reason: 'ใบเสนอราคาค้างตอบ 18 วัน', action: 'โทรถาม', amount: 120000 },
  { rank: 6, tier: 'high', icon: 'mark_email_unread', customer: 'HERBAL+', reason: 'ใบเสนอราคาค้างตอบ 14 วัน', action: 'ส่ง Email ติดตาม', amount: 200000 },
  { rank: 7, tier: 'medium', icon: 'loop', customer: 'JELLYS', reason: 'งานแก้เกิน 8 รอบ ไม่อนุมัติ', action: 'นัดประชุมปิดงาน', amount: 12000 },
  { rank: 8, tier: 'medium', icon: 'trending_down', customer: 'NATURE PLUS', reason: 'Box Design ใกล้ขาดทุน', action: 'ตรวจสอบต้นทุน', amount: 8000 },
  { rank: 9, tier: 'watch', icon: 'schedule', customer: 'FRESHLY', reason: 'โปรเจกต์ล่าช้ากว่ากำหนด', action: 'อัปเดตไทม์ไลน์', amount: 20000 },
]

const agingData = [
  { label: 'ยังไม่ครบกำหนด', value: 45000, color: '#5f7d99', bg: '#e8eef4' },
  { label: 'ครบ 1-30 วัน', value: 65000, color: '#f4a431', bg: '#fdf3e3' },
  { label: '31-60 วัน', value: 85000, color: '#d4841a', bg: '#fdf0d8' },
  { label: 'เกิน 60 วัน', value: 150000, color: '#c4593f', bg: '#fceee8' },
]

const jobCosting = [
  { customer: 'LUXE', type: 'Label', value: 80000, cost: 32000, profit: 48000, margin: 60 },
  { customer: 'GLOWME', type: 'Packaging', value: 95000, cost: 41000, profit: 54000, margin: 57 },
  { customer: 'PERCARE', type: 'Logo', value: 28000, cost: 8000, profit: 20000, margin: 71 },
  { customer: 'JELLYS', type: 'Label', value: 35000, cost: 18000, profit: 17000, margin: 49 },
  { customer: 'NATURE PLUS', type: 'Box Design', value: 45000, cost: 53000, profit: -8000, margin: -18 },
]

const maxAging = Math.max(...agingData.map(d => d.value))

export default function LeaksPage() {
  return (
    <div>
      {/* Hero banner */}
      <div style={{
        background: 'linear-gradient(135deg, #8b2315 0%, #c4593f 50%, #d4703a 100%)',
        borderRadius: 18,
        padding: '28px 32px',
        marginBottom: 20,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -20, right: 120, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 28, color: '#fff' }}>warning</span>
            </div>
            <div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 4, fontWeight: 500 }}>
                เงินที่กำลังเสี่ยงหลุดมือทั้งหมด
              </div>
              <div style={{ fontSize: 38, fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 8 }}>
                {formatMoney(690500)}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
                รวมหนี้ค้าง + มัดจำที่ลืมเก็บ + ใบเสนอราคาที่ค้างตอบ
              </div>
            </div>
          </div>

          <button style={{
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
            border: '1.5px solid rgba(255,255,255,0.3)',
            color: '#fff',
            borderRadius: 12,
            padding: '11px 22px',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}>
            จัดการทั้งหมด
          </button>
        </div>
      </div>

      {/* Alert box */}
      <div style={{
        background: '#fceee8',
        border: '1.5px solid #f4b8a8',
        borderLeft: '4px solid #c4593f',
        borderRadius: 14,
        padding: '14px 18px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}>
        <span className="material-symbols-rounded" style={{ fontSize: 24, color: '#c4593f', flexShrink: 0 }}>alarm</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#c4593f' }}>ทำก่อนเลย!</div>
          <div style={{ fontSize: 13, color: '#7a3025', marginTop: 2 }}>
            LUXE มีหนี้ค้างชำระ 47 วัน — โทรทวงทันที ก่อนเกิน 60 วัน (มูลค่า {formatMoney(150000)})
          </div>
        </div>
        <button style={{
          marginLeft: 'auto',
          background: '#c4593f', color: '#fff',
          border: 'none', borderRadius: 10,
          padding: '8px 16px', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
        }}>
          โทรทวง
        </button>
      </div>

      {/* Priority list */}
      <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 22, marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#2f3b45', margin: '0 0 18px' }}>
          รายการจัดลำดับความสำคัญ
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {priorityList.map(item => {
            const tier = tierMap[item.tier]
            return (
              <div key={item.rank} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 16px',
                background: item.rank === 1 ? '#fceee8' : '#f9fafb',
                borderRadius: 12,
                border: item.rank === 1 ? '1px solid #f4b8a8' : '1px solid #edf0f3',
              }}>
                {/* Rank */}
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: item.rank <= 3 ? '#fceee8' : '#f0f4f8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800,
                  color: item.rank <= 3 ? '#c4593f' : '#7a8893',
                  flexShrink: 0,
                }}>
                  #{item.rank}
                </div>

                {/* Tier badge */}
                <span style={{
                  background: tier.bg, color: tier.color,
                  borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {tier.label}
                </span>

                {/* Icon */}
                <span className="material-symbols-rounded" style={{ fontSize: 20, color: tier.color, flexShrink: 0 }}>
                  {item.icon}
                </span>

                {/* Customer + reason */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#2f3b45' }}>{item.customer}</div>
                  <div style={{ fontSize: 12, color: '#7a8893', marginTop: 1 }}>{item.reason}</div>
                </div>

                {/* Action */}
                <div style={{ fontSize: 12, color: '#5f7d99', fontWeight: 600, flexShrink: 0 }}>
                  → {item.action}
                </div>

                {/* Amount */}
                <div style={{
                  fontSize: 14, fontWeight: 700,
                  color: item.tier === 'urgent' ? '#c4593f' : '#2f3b45',
                  flexShrink: 0,
                }}>
                  {formatMoney(item.amount)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* KPI summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'หนี้ค้างเกินกำหนด', value: '฿150,000', icon: 'account_balance', color: '#c4593f', bg: '#fceee8' },
          { label: 'มัดจำลืมเก็บ', value: '฿95,000', icon: 'payments', color: '#f4a431', bg: '#fdf3e3' },
          { label: 'ใบเสนอราคาค้างตอบ', value: '฿405,000', icon: 'description', color: '#5f7d99', bg: '#e8eef4' },
          { label: 'งานแก้เกินรอบ', value: '-', icon: 'loop', color: '#7c6fab', bg: '#f0eef8' },
        ].map((k, i) => (
          <div key={i} style={{
            background: '#fff', borderRadius: 16, border: '1px solid #edf0f3', padding: '18px 18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18, color: k.color }}>{k.icon}</span>
              </div>
              <span style={{ fontSize: 12, color: '#7a8893', fontWeight: 500 }}>{k.label}</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* 5 Leak cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 20 }}>
        {/* 1. หนี้ค้าง */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf0f3', padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fceee8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#c4593f' }}>account_balance</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#2f3b45' }}>หนี้ค้างเกินกำหนด</div>
              <div style={{ fontSize: 11, color: '#c4593f' }}>ต้องดำเนินการด่วน</div>
            </div>
          </div>
          <div style={{ background: '#fceee8', borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ fontSize: 12, color: '#7a8893' }}>LUXE</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#c4593f' }}>{formatMoney(150000)}</div>
            <div style={{ fontSize: 11, color: '#9aa7b2', marginTop: 2 }}>ค้างมา 47 วัน</div>
          </div>
        </div>

        {/* 2. มัดจำ */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf0f3', padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fdf3e3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#f4a431' }}>payments</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#2f3b45' }}>มัดจำที่ยังไม่ได้เก็บ</div>
              <div style={{ fontSize: 11, color: '#f4a431' }}>ลืมเรียกเก็บ</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[{ name: 'GLOWME', amount: 47500 }, { name: 'NATURE PLUS', amount: 47500 }].map((c, i) => (
              <div key={i} style={{ background: '#fdf3e3', borderRadius: 10, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#7a8893' }}>{c.name}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#f4a431' }}>{formatMoney(c.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. ใบเสนอราคาเงียบหาย */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf0f3', padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#e8eef4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#5f7d99' }}>description</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#2f3b45' }}>ใบเสนอราคาเงียบหาย</div>
              <div style={{ fontSize: 11, color: '#5f7d99' }}>ค้างตอบนาน</div>
            </div>
          </div>
          <div style={{ background: '#e8eef4', borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ fontSize: 12, color: '#7a8893' }}>PERCARE — QT-001</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#5f7d99' }}>{formatMoney(85000)}</div>
            <div style={{ fontSize: 11, color: '#9aa7b2', marginTop: 2 }}>ไม่มีการตอบกลับ 21 วัน</div>
          </div>
        </div>

        {/* 4. งานแก้เกินรอบ */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf0f3', padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0eef8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#7c6fab' }}>loop</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#2f3b45' }}>งานแก้เกินรอบ</div>
              <div style={{ fontSize: 11, color: '#7c6fab' }}>เสียเวลาทำงาน</div>
            </div>
          </div>
          <div style={{ background: '#f0eef8', borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ fontSize: 12, color: '#7a8893' }}>JELLYS</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#7c6fab' }}>8</span>
              <span style={{ fontSize: 13, color: '#7c6fab' }}>รอบแก้</span>
            </div>
            <div style={{ fontSize: 11, color: '#9aa7b2', marginTop: 2 }}>ค่าเสียเวลา {formatMoney(12000)}</div>
          </div>
        </div>

        {/* 5. โปรเจกต์เสี่ยงขาดทุน */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf0f3', padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fceee8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#c4593f' }}>trending_down</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#2f3b45' }}>โปรเจกต์เสี่ยงขาดทุน</div>
              <div style={{ fontSize: 11, color: '#c4593f' }}>ต้นทุนเกิน</div>
            </div>
          </div>
          <div style={{ background: '#fceee8', borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ fontSize: 12, color: '#7a8893' }}>NATURE PLUS — Box Design</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#c4593f' }}>-{formatMoney(8000)}</div>
            <div style={{ fontSize: 11, color: '#9aa7b2', marginTop: 2 }}>ต้นทุนเกินมูลค่า {formatMoney(8000)}</div>
          </div>
        </div>
      </div>

      {/* Aging chart + Job costing */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Aging chart */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 22 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2f3b45', margin: '0 0 20px' }}>การวิเคราะห์อายุหนี้</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {agingData.map((d, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: '#7a8893' }}>{d.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: d.color }}>{formatMoney(d.value)}</span>
                </div>
                <div style={{ height: 10, borderRadius: 5, background: '#f0f4f8', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    borderRadius: 5,
                    background: d.color,
                    width: `${(d.value / maxAging) * 100}%`,
                    transition: 'width 0.4s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Job costing table */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 22 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2f3b45', margin: '0 0 16px' }}>Job Costing</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #edf0f3' }}>
                  {['ลูกค้า', 'ประเภท', 'มูลค่า', 'ต้นทุน', 'กำไร', 'มาร์จิน'].map(h => (
                    <th key={h} style={{
                      padding: '8px 10px',
                      fontSize: 11, fontWeight: 700, color: '#9aa7b2',
                      textAlign: h === 'ลูกค้า' || h === 'ประเภท' ? 'left' : 'right',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobCosting.map((row, i) => {
                  const isLoss = row.profit < 0
                  return (
                    <tr key={i} style={{
                      borderBottom: i < jobCosting.length - 1 ? '1px solid #edf0f3' : 'none',
                      background: isLoss ? '#fef9f8' : 'transparent',
                    }}>
                      <td style={{ padding: '10px 10px', fontSize: 12, fontWeight: 700, color: '#2f3b45' }}>{row.customer}</td>
                      <td style={{ padding: '10px 10px', fontSize: 12, color: '#7a8893' }}>{row.type}</td>
                      <td style={{ padding: '10px 10px', fontSize: 12, color: '#2f3b45', textAlign: 'right' }}>
                        {(row.value / 1000).toFixed(0)}K
                      </td>
                      <td style={{ padding: '10px 10px', fontSize: 12, color: '#7a8893', textAlign: 'right' }}>
                        {(row.cost / 1000).toFixed(0)}K
                      </td>
                      <td style={{ padding: '10px 10px', fontSize: 12, fontWeight: 700, color: isLoss ? '#c4593f' : '#3d8a64', textAlign: 'right' }}>
                        {isLoss ? '-' : ''}{formatMoney(Math.abs(row.profit))}
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'right' }}>
                        <span style={{
                          background: isLoss ? '#fceee8' : '#e9f3ed',
                          color: isLoss ? '#c4593f' : '#3d8a64',
                          borderRadius: 6, padding: '2px 7px',
                          fontSize: 11, fontWeight: 700,
                        }}>
                          {row.margin}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

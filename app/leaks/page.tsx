'use client'

const tierMap: Record<string, { label: string; bg: string; color: string }> = {
  urgent: { label: 'ด่วนที่สุด', bg: '#fceee8', color: '#c4593f' },
  high:   { label: 'ด่วนมาก',   bg: '#fdf3e3', color: '#f4a431' },
  medium: { label: 'ควรทำเร็ว', bg: '#e8eef4', color: '#5f7d99' },
  watch:  { label: 'เฝ้าระวัง', bg: '#e9f3ed', color: '#3d8a64' },
}

const priorityList = [
  { rank: 1, tier: 'urgent', icon: 'phone_in_talk', cust: 'LUXE', code: 'PRJ-001', reason: 'หนี้ค้างชำระ 47 วัน', action: 'โทรทวงทันที', amount: '฿150,000' },
  { rank: 2, tier: 'urgent', icon: 'receipt_long', cust: 'GLOWME', code: 'PRJ-003', reason: 'มัดจำค้างเก็บ 30 วัน', action: 'ส่ง Invoice ด่วน', amount: '฿47,500' },
  { rank: 3, tier: 'urgent', icon: 'receipt_long', cust: 'NATURE PLUS', code: 'PRJ-005', reason: 'มัดจำค้างเก็บ 25 วัน', action: 'ส่ง Invoice ด่วน', amount: '฿47,500' },
  { rank: 4, tier: 'high', icon: 'mark_email_unread', cust: 'PERCARE', code: 'QT-001', reason: 'ใบเสนอราคาเงียบหาย 21 วัน', action: 'ติดตาม Follow-up', amount: '฿85,000' },
  { rank: 5, tier: 'high', icon: 'mark_email_unread', cust: 'BELLA CARE', code: 'QT-003', reason: 'ใบเสนอราคาค้างตอบ 18 วัน', action: 'โทรถาม', amount: '฿120,000' },
  { rank: 6, tier: 'high', icon: 'mark_email_unread', cust: 'HERBAL+', code: 'QT-005', reason: 'ใบเสนอราคาค้างตอบ 14 วัน', action: 'ส่ง Email ติดตาม', amount: '฿200,000' },
  { rank: 7, tier: 'medium', icon: 'loop', cust: 'JELLYS', code: 'PRJ-008', reason: 'งานแก้เกิน 8 รอบ ไม่อนุมัติ', action: 'นัดประชุมปิดงาน', amount: '฿12,000' },
]

const leakSummary = [
  { icon: 'account_balance', iconWrap: { background: '#fceee8', color: '#c4593f' }, label: 'หนี้ค้างเกินกำหนด', value: '฿150,000', unit: '' },
  { icon: 'payments', iconWrap: { background: '#fdf3e3', color: '#f4a431' }, label: 'มัดจำที่ยังไม่ได้เก็บ', value: '฿95,000', unit: '' },
  { icon: 'description', iconWrap: { background: '#e8eef4', color: '#5f7d99' }, label: 'ใบเสนอราคาค้างตอบ', value: '฿405,000', unit: '' },
  { icon: 'loop', iconWrap: { background: '#f0eef8', color: '#7c6fab' }, label: 'งานแก้เกินรอบ', value: '2', unit: 'งาน' },
]

const leakCards = [
  {
    icon: 'account_balance', iconBg: '#fceee8', iconColor: '#c4593f',
    title: 'หนี้ค้างเกินกำหนด', sub: 'ลูกหนี้ที่ผ่านวันครบกำหนดชำระ',
    amount: '฿150,000', amountColor: '#c4593f',
    rows: [
      { cust: 'LUXE', code: 'PRJ-001', meta: 'ค้างมา 47 วัน · ออกใบแจ้งหนี้ 20/03/67', badge: { bg: '#fceee8', color: '#c4593f' }, badgeText: '47 วัน', amount: '฿150,000' },
    ],
  },
  {
    icon: 'payments', iconBg: '#fdf3e3', iconColor: '#f4a431',
    title: 'มัดจำที่ยังไม่ได้เก็บ', sub: 'งานที่เริ่มแล้วแต่ยังไม่ได้เรียกมัดจำ',
    amount: '฿95,000', amountColor: '#f4a431',
    rows: [
      { cust: 'GLOWME', code: 'PRJ-003', meta: 'มัดจำ 50% · ค้างเก็บมา 30 วัน', badge: { bg: '#fdf3e3', color: '#f4a431' }, badgeText: '30 วัน', amount: '฿47,500' },
      { cust: 'NATURE PLUS', code: 'PRJ-005', meta: 'มัดจำ 50% · ค้างเก็บมา 25 วัน', badge: { bg: '#fdf3e3', color: '#f4a431' }, badgeText: '25 วัน', amount: '฿47,500' },
    ],
  },
  {
    icon: 'description', iconBg: '#e8eef4', iconColor: '#5f7d99',
    title: 'ใบเสนอราคาเงียบหาย', sub: 'ส่งใบเสนอราคาแล้วแต่ลูกค้าไม่ตอบ',
    amount: '฿405,000', amountColor: '#5f7d99',
    rows: [
      { cust: 'PERCARE', code: 'QT-001', meta: 'ส่งเมื่อ 01/05/67 · ไม่มีการตอบกลับ 21 วัน', badge: { bg: '#e8eef4', color: '#5f7d99' }, badgeText: '21 วัน', amount: '฿85,000' },
      { cust: 'BELLA CARE', code: 'QT-003', meta: 'ส่งเมื่อ 04/05/67 · ไม่มีการตอบกลับ 18 วัน', badge: { bg: '#e8eef4', color: '#5f7d99' }, badgeText: '18 วัน', amount: '฿120,000' },
    ],
  },
  {
    icon: 'loop', iconBg: '#f0eef8', iconColor: '#7c6fab',
    title: 'งานแก้เกินรอบ', sub: 'แก้เกินที่กำหนด ทำให้เสียเวลาและต้นทุนเพิ่ม',
    amount: '฿12,000', amountColor: '#7c6fab',
    rows: [
      { cust: 'JELLYS', code: 'PRJ-008', meta: 'แก้ครั้งที่ 8 · มากกว่าที่ตกลง 5 รอบ', badge: { bg: '#f0eef8', color: '#7c6fab' }, badgeText: '8 รอบ', amount: '฿12,000' },
    ],
  },
  {
    icon: 'trending_down', iconBg: '#fceee8', iconColor: '#c4593f',
    title: 'โปรเจกต์เสี่ยงขาดทุน', sub: 'ต้นทุนตรงเกินมูลค่างาน',
    amount: '-฿8,000', amountColor: '#c4593f',
    rows: [
      { cust: 'NATURE PLUS', code: 'PRJ-005', meta: 'Box Design · ต้นทุน ฿53,000 — มูลค่า ฿45,000', badge: { bg: '#fceee8', color: '#c4593f' }, badgeText: 'ขาดทุน', amount: '-฿8,000' },
    ],
  },
]

const agingRows = [
  { label: 'ยังไม่ครบกำหนด', amount: '45,000', pct: 13, color: '#5f7d99' },
  { label: 'ครบ 1-30 วัน', amount: '65,000', pct: 19, color: '#f4a431' },
  { label: '31-60 วัน', amount: '85,000', pct: 25, color: '#d4841a' },
  { label: 'เกิน 60 วัน (เสี่ยงสูญ)', amount: '150,000', pct: 44, color: '#c4593f' },
]

const jobRows = [
  { cust: 'LUXE', type: 'Label Design', value: '฿80,000', cost: '฿32,000', profit: '+฿48,000', profitColor: '#3d8a64', margin: '60%', marginBg: '#e9f3ed', marginColor: '#3d8a64' },
  { cust: 'GLOWME', type: 'Packaging', value: '฿95,000', cost: '฿41,000', profit: '+฿54,000', profitColor: '#3d8a64', margin: '57%', marginBg: '#e9f3ed', marginColor: '#3d8a64' },
  { cust: 'PERCARE', type: 'Logo Design', value: '฿28,000', cost: '฿8,000', profit: '+฿20,000', profitColor: '#3d8a64', margin: '71%', marginBg: '#e9f3ed', marginColor: '#3d8a64' },
  { cust: 'JELLYS', type: 'Label Design', value: '฿35,000', cost: '฿18,000', profit: '+฿17,000', profitColor: '#3d8a64', margin: '49%', marginBg: '#fdf3e3', marginColor: '#f4a431' },
  { cust: 'NATURE PLUS', type: 'Box Design', value: '฿45,000', cost: '฿53,000', profit: '-฿8,000', profitColor: '#c4593f', margin: '-18%', marginBg: '#fceee8', marginColor: '#c4593f' },
]

export default function LeaksPage() {
  return (
    <div style={{ color: '#2f3b45' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, margin: '14px 0 18px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 26, color: '#c4593f' }}>crisis_alert</span>
            <div style={{ fontSize: 25, fontWeight: 700, color: '#2f3b45' }}>จุดเงินรั่ว</div>
          </div>
          <div style={{ fontSize: 14, color: '#7a8893', marginTop: 3 }}>เงินที่กำลังไหลออกเงียบๆ ที่คุณควรรีบจัดการ · อัปเดต 13 มิ.ย. 67</div>
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
            <span style={{ fontSize: 36, fontWeight: 800, color: '#c4593f', fontFamily: "'IBM Plex Sans', sans-serif" }}>฿690,500</span>
          </div>
          <div style={{ fontSize: 13, color: '#a06c60', marginTop: 2 }}>รวมหนี้ค้าง + มัดจำที่ลืมเก็บ + ใบเสนอราคาที่ค้างตอบ</div>
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
          คำนวณจากจำนวนเงิน × ความเร่งด่วน (อายุหนี้ / ประเภทปัญหา) · {priorityList.length} รายการ
        </div>
        {/* Top alert */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, background: '#fbe9e5', borderRadius: 13, padding: '14px 16px', marginBottom: 16 }}>
          <span className="material-symbols-rounded" style={{ fontSize: 22, color: '#c4593f' }}>priority_high</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#9c2f1c' }}>ทำก่อนเลย: หนี้ค้างชำระ · LUXE</div>
            <div style={{ fontSize: 12.5, color: '#9c5648', marginTop: 1 }}>ค้างชำระมา 47 วัน เสี่ยงกลายเป็นหนี้สูญ → <b>โทรทวงทันที</b></div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {priorityList.map(p => {
            const tier = tierMap[p.tier]
            return (
              <div key={p.rank} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 14px', borderRadius: 12, border: '1px solid #f0f2f5' }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: p.rank <= 3 ? '#fceee8' : '#f5f7f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 700, color: p.rank <= 3 ? '#c4593f' : '#7a8893', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  {p.rank}
                </div>
                <span className="material-symbols-rounded" style={{ fontSize: 20, color: tier.color, flexShrink: 0 }}>{p.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: '#2f3b45' }}>{p.cust}</span>
                    <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: tier.bg, color: tier.color }}>{tier.label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#8a97a2', marginTop: 2 }}>{p.code} — {p.reason}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#5f7d99', marginTop: 4 }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 15 }}>bolt</span>
                    {p.action}
                  </div>
                </div>
                <div style={{ width: 90, flexShrink: 0, textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>{p.amount}</div>
                  <div style={{ height: 5, borderRadius: 4, background: '#f0f2f5', overflow: 'hidden', marginTop: 5 }}>
                    <div style={{ height: '100%', background: tier.color, width: `${(8 - p.rank) / 7 * 100}%`, borderRadius: 4 }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
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

      {/* Leak Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(380px,1fr))', gap: 16, marginBottom: 18 }}>
        {leakCards.map((c, ci) => (
          <div key={ci} style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 23, color: c.iconColor }}>{c.icon}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#2f3b45' }}>{c.title}</div>
                <div style={{ fontSize: 12.5, color: '#9aa7b2', marginTop: 2 }}>{c.sub}</div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: c.amountColor, fontFamily: "'IBM Plex Sans', sans-serif", flexShrink: 0 }}>{c.amount}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {c.rows.map((r, ri) => (
                <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', borderRadius: 11, background: '#fafbfc', border: '1px solid #f2f4f6' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: '#2f3b45' }}>{r.cust}</span>
                      <span style={{ fontSize: 11, color: '#9aa7b2', fontFamily: "'IBM Plex Sans', sans-serif" }}>{r.code}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#8a97a2', marginTop: 1 }}>{r.meta}</div>
                  </div>
                  <span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: r.badge.bg, color: r.badge.color }}>{r.badgeText}</span>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif", minWidth: 64, textAlign: 'right' }}>{r.amount}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Aging + Job Costing */}
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        {/* Aging */}
        <div style={{ flex: '1 1 340px', background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 22 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#2f3b45', marginBottom: 4 }}>ลูกหนี้แยกตามอายุหนี้</div>
          <div style={{ fontSize: 12.5, color: '#9aa7b2', marginBottom: 18 }}>ยิ่งหนี้เก่า ยิ่งมีโอกาสกลายเป็นหนี้สูญ</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            {agingRows.map((a, i) => (
              <div key={i}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: '#5b6b77' }}>{a.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: a.color, fontFamily: "'IBM Plex Sans', sans-serif" }}>฿{a.amount}</span>
                </div>
                <div style={{ height: 10, borderRadius: 5, background: '#f0f2f5', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 5, background: a.color, width: `${a.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18, padding: '13px 15px', borderRadius: 12, background: '#fbe9e5', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#c4593f' }}>lightbulb</span>
            <span style={{ fontSize: 12, color: '#9c5648', lineHeight: 1.5 }}>หนี้ก้อน <b>฿150,000 (LUXE)</b> ค้างเกิน 60 วันแล้ว — ควรโทรทวงวันนี้ก่อนกลายเป็นหนี้สูญ</span>
          </div>
        </div>

        {/* Job Costing */}
        <div style={{ flex: '1.3 1 420px', background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 6 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#2f3b45' }}>กำไรต่อโปรเจกต์ <span style={{ fontSize: 12.5, color: '#9aa7b2', fontWeight: 400 }}>Job Costing</span></div>
          </div>
          <div style={{ fontSize: 12.5, color: '#9aa7b2', marginBottom: 16 }}>มูลค่างาน − ต้นทุนตรง (ฟรีแลนซ์/พิมพ์/วัสดุ) = กำไรจริง</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
            <div style={{ flex: 1, minWidth: 120, background: '#f5f7f9', borderRadius: 12, padding: '13px 15px' }}>
              <div style={{ fontSize: 11.5, color: '#9aa7b2' }}>มูลค่างานรวม</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#2f3b45', fontFamily: "'IBM Plex Sans', sans-serif" }}>฿283,000</div>
            </div>
            <div style={{ flex: 1, minWidth: 120, background: '#fbf3ec', borderRadius: 12, padding: '13px 15px' }}>
              <div style={{ fontSize: 11.5, color: '#a9762f' }}>ต้นทุนรวม</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#a9762f', fontFamily: "'IBM Plex Sans', sans-serif" }}>฿152,000</div>
            </div>
            <div style={{ flex: 1, minWidth: 120, background: '#e9f3ed', borderRadius: 12, padding: '13px 15px' }}>
              <div style={{ fontSize: 11.5, color: '#3d8a64' }}>กำไรจริง</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#3d8a64', fontFamily: "'IBM Plex Sans', sans-serif" }}>฿131,000</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1fr 0.9fr', gap: 8, fontSize: 11.5, color: '#9aa7b2', fontWeight: 500, padding: '0 4px 10px', borderBottom: '1px solid #f0f2f5' }}>
            {['โปรเจกต์', 'มูลค่า', 'ต้นทุน', 'กำไร', 'มาร์จิน'].map((h, i) => (
              <div key={h} style={i > 0 ? { textAlign: 'right' } : {}}>{h}</div>
            ))}
          </div>
          {jobRows.map((j, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1fr 0.9fr', gap: 8, alignItems: 'center', padding: '11px 4px', borderBottom: '1px solid #f4f6f8' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#2f3b45' }}>{j.cust}</div>
                <div style={{ fontSize: 11, color: '#9aa7b2' }}>{j.type}</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 12.5, color: '#7a8893', fontFamily: "'IBM Plex Sans', sans-serif" }}>{j.value}</div>
              <div style={{ textAlign: 'right', fontSize: 12.5, color: '#a9762f', fontFamily: "'IBM Plex Sans', sans-serif" }}>{j.cost}</div>
              <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: j.profitColor, fontFamily: "'IBM Plex Sans', sans-serif" }}>{j.profit}</div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'inline-flex', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: j.marginBg, color: j.marginColor }}>{j.margin}</span>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 16, padding: '13px 15px', borderRadius: 12, background: '#eef3f7', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#5f7d99' }}>insights</span>
            <span style={{ fontSize: 12, color: '#54697d', lineHeight: 1.5 }}><b>NATURE PLUS</b> ต้นทุน ฿53,000 แต่รับแค่ ฿45,000 = <b style={{ color: '#c4593f' }}>ขาดทุน ฿8,000</b> · งานประเภท Box Design ควรตั้งราคาใหม่</span>
          </div>
        </div>
      </div>
    </div>
  )
}

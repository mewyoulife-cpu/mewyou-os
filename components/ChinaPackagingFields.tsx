'use client'

// Shared "ผลิตแพคเกจจิ้งจีน" (China packaging production) cost fields.
// Stored on Project.chinaData as a JSON string of the base + derived numbers.

export const CHINA_TYPE = 'ผลิตแพคเกจจิ้งจีน'

export type ChinaBase = {
  yuanCost: string     // 1. ต้นทุนเงินหยวน (¥ / ชิ้น)
  rate: string         // 2. เรทเงิน (บาท/หยวน)
  qty: string          // 5. จำนวน Q
  shipPerPiece: string // 7. ราคาขนส่งต่อชิ้น
  sellPrice: string    // 9. ราคาขาย (รวม)
}

export function emptyChina(): ChinaBase {
  return { yuanCost: '', rate: '', qty: '', shipPerPiece: '', sellPrice: '' }
}

const num = (v: string | number | undefined) => {
  const n = parseFloat(String(v ?? '').replace(/,/g, ''))
  return isNaN(n) ? 0 : n
}

// Hydrate the editable base fields from a stored chinaData JSON string.
export function chinaFromJSON(str: string | null | undefined): ChinaBase {
  if (!str) return emptyChina()
  try {
    const c = JSON.parse(str)
    const s = (n: unknown) => (n == null || n === 0 ? '' : String(n))
    return { yuanCost: s(c.yuanCost), rate: s(c.rate), qty: s(c.qty), shipPerPiece: s(c.shipPerPiece), sellPrice: s(c.sellPrice) }
  } catch {
    return emptyChina()
  }
}

// Derived values computed from the base inputs.
export function computeChina(b: ChinaBase) {
  const yuanCost = num(b.yuanCost)
  const rate = num(b.rate)
  const qty = num(b.qty)
  const shipPerPiece = num(b.shipPerPiece)
  const sellPrice = num(b.sellPrice)
  const bahtPerPiece = yuanCost * rate
  const bahtTotal = bahtPerPiece * qty
  const shipTotal = shipPerPiece * qty
  const netProfit = sellPrice - bahtTotal - shipTotal
  return { yuanCost, rate, qty, shipPerPiece, sellPrice, bahtPerPiece, bahtTotal, shipTotal, netProfit }
}

const fmt = (n: number) =>
  n.toLocaleString('th-TH', { maximumFractionDigits: 2 })

const fieldInput: React.CSSProperties = {
  width: '100%', height: 38, border: '1px solid #e4e8ec', borderRadius: 9,
  padding: '0 11px', fontSize: 13.5, color: '#2f3b45', background: '#fff',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
}
const fieldLabel: React.CSSProperties = { fontSize: 12, color: '#7a8893', marginBottom: 5 }

function InputCell({ label, unit, value, onChange }: {
  label: string; unit?: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div>
      <div style={fieldLabel}>{label}{unit ? ` (${unit})` : ''}</div>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="0"
        style={fieldInput}
      />
    </div>
  )
}

function CalcCell({ label, unit, value, highlight }: {
  label: string; unit?: string; value: number; highlight?: boolean
}) {
  const neg = highlight && value < 0
  return (
    <div>
      <div style={fieldLabel}>{label}{unit ? ` (${unit})` : ''}</div>
      <div style={{
        height: 38, display: 'flex', alignItems: 'center', padding: '0 11px',
        borderRadius: 9, fontSize: 13.5, fontWeight: 600, boxSizing: 'border-box',
        background: highlight ? (neg ? '#fceeec' : '#eef6f1') : '#f5f7f9',
        color: highlight ? (neg ? '#d9534f' : '#3d8a64') : '#54697d',
        border: '1px solid transparent',
        fontFamily: "'IBM Plex Sans', sans-serif",
      }}>
        {fmt(value)}
      </div>
    </div>
  )
}

export default function ChinaPackagingFields({ china, onChange }: {
  china: ChinaBase
  onChange: (key: keyof ChinaBase, value: string) => void
}) {
  const d = computeChina(china)
  return (
    <div style={{
      marginTop: 14, padding: 16, borderRadius: 14,
      background: '#fbfcfd', border: '1px solid #e9edf1',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
        <span style={{ fontSize: 15 }}>🇨🇳</span>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: '#2f3b45' }}>ข้อมูลต้นทุนผลิตแพคเกจจิ้งจีน</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <InputCell label="1. ต้นทุนเงินหยวน" unit="¥/ชิ้น" value={china.yuanCost} onChange={v => onChange('yuanCost', v)} />
        <InputCell label="2. เรทเงิน" unit="บาท/¥" value={china.rate} onChange={v => onChange('rate', v)} />
        <CalcCell label="3. ต้นทุนบาท/ชิ้น" unit="฿" value={d.bahtPerPiece} />
        <CalcCell label="4. ต้นทุนบาทรวม" unit="฿" value={d.bahtTotal} />
        <InputCell label="5. จำนวน Q" unit="ชิ้น" value={china.qty} onChange={v => onChange('qty', v)} />
        <InputCell label="6. ราคาขนส่งต่อชิ้น" unit="฿" value={china.shipPerPiece} onChange={v => onChange('shipPerPiece', v)} />
        <CalcCell label="7. ราคารวมค่าขนส่ง" unit="฿" value={d.shipTotal} />
        <InputCell label="8. ราคาขาย" unit="฿" value={china.sellPrice} onChange={v => onChange('sellPrice', v)} />
        <CalcCell label="9. กำไรสุทธิ" unit="฿" value={d.netProfit} highlight />
      </div>
    </div>
  )
}

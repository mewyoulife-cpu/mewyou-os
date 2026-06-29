'use client'

// Shared "ผลิตแพคเกจจิ้งจีน" (China packaging production) cost fields.
// Stored on Project.chinaData as a JSON string of the base + derived numbers.

export const CHINA_TYPE = 'ผลิตแพคเกจจิ้งจีน'

export type ChinaBase = {
  yuanCost: string     // ต้นทุนเงินหยวน (¥ / ชิ้น)
  rate: string         // เรทเงิน (บาท/หยวน)
  moq: string          // จำนวน MOQ (จำนวนชิ้นที่ผลิตจริง)
  qty: string          // จำนวน Q (จำนวนลอตขนส่ง)
  shipMethod: string   // วิธีขนส่ง: '' | 'sea' | 'truck'
  shipPerPiece: string // ราคาขนส่งต่อ Q (กรอกเอง เมื่อไม่เลือกวิธีขนส่ง)
  sellPrice: string    // ราคาขายรวม
}

// Fixed shipping rates per 1 Q.
export const SHIP_METHODS = [
  { key: 'sea', label: 'ขนส่งโดยเรือ', icon: '🚢', rate: 3600 },
  { key: 'truck', label: 'ขนส่งโดยรถ', icon: '🚛', rate: 5700 },
] as const

function shipRateFor(method: string): number | null {
  const m = SHIP_METHODS.find(x => x.key === method)
  return m ? m.rate : null
}

export function emptyChina(): ChinaBase {
  return { yuanCost: '', rate: '', moq: '', qty: '', shipMethod: '', shipPerPiece: '', sellPrice: '' }
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
    const method = c.shipMethod === 'sea' || c.shipMethod === 'truck' ? c.shipMethod : ''
    return { yuanCost: s(c.yuanCost), rate: s(c.rate), moq: s(c.moq), qty: s(c.qty), shipMethod: method, shipPerPiece: s(c.shipPerPiece), sellPrice: s(c.sellPrice) }
  } catch {
    return emptyChina()
  }
}

// Derived values computed from the base inputs.
export function computeChina(b: ChinaBase) {
  const yuanCost = num(b.yuanCost)
  const rate = num(b.rate)
  const moq = num(b.moq)       // จำนวนชิ้นที่ผลิตจริง
  const qty = num(b.qty)       // จำนวนลอตขนส่ง
  const sellPrice = num(b.sellPrice)
  // A chosen shipping method fixes the per-Q rate; otherwise use the manual input.
  const fixedRate = shipRateFor(b.shipMethod)
  const shipRatePerQ = fixedRate != null ? fixedRate : num(b.shipPerPiece)

  const bahtPerPiece = yuanCost * rate            // ต้นทุนบาท/ชิ้น
  const bahtTotal = bahtPerPiece * moq            // ต้นทุนบาทรวม = บาท/ชิ้น × MOQ
  const shipTotal = shipRatePerQ * qty            // ค่าขนส่งรวม = ต่อ Q × จำนวน Q
  const shipPerUnit = moq > 0 ? shipTotal / moq : 0 // ต้นทุนขนส่ง/ชิ้น = ขนส่งรวม ÷ MOQ
  const totalCost = bahtTotal + shipTotal         // ต้นทุนรวม = สินค้า + ขนส่ง
  const netProfit = sellPrice - totalCost         // กำไรสุทธิ = ราคาขายรวม − ต้นทุนรวม

  return {
    yuanCost, rate, moq, qty, shipMethod: b.shipMethod,
    shipPerPiece: num(b.shipPerPiece), // keep base value so re-computing stored output is idempotent
    sellPrice, bahtPerPiece, bahtTotal, shipRatePerQ, shipTotal, shipPerUnit, totalCost, netProfit,
  }
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

      {/* Shipping method — sets the shipping cost per Q automatically */}
      <div style={{ marginBottom: 14 }}>
        <div style={fieldLabel}>วิธีขนส่ง</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SHIP_METHODS.map(m => {
            const active = china.shipMethod === m.key
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => onChange('shipMethod', active ? '' : m.key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 20,
                  border: active ? '1.5px solid #5f7d99' : '1.5px solid #dde3e9',
                  background: active ? '#e8eef4' : '#fff',
                  color: active ? '#5f7d99' : '#7a8893',
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: 14 }}>{m.icon}</span>
                {m.label}
                <span style={{ fontSize: 12, color: active ? '#5f7d99' : '#9aa7b2' }}>· {fmt(m.rate)}฿/Q</span>
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <InputCell label="1. ต้นทุนเงินหยวน" unit="¥/ชิ้น" value={china.yuanCost} onChange={v => onChange('yuanCost', v)} />
        <InputCell label="2. เรทเงิน" unit="บาท/¥" value={china.rate} onChange={v => onChange('rate', v)} />
        <CalcCell label="3. ต้นทุนบาท/ชิ้น" unit="฿" value={d.bahtPerPiece} />
        <InputCell label="4. จำนวน MOQ" unit="ชิ้น" value={china.moq} onChange={v => onChange('moq', v)} />
        <CalcCell label="5. ต้นทุนบาทรวม" unit="฿" value={d.bahtTotal} />
        <InputCell label="6. จำนวน Q" unit="ลอต" value={china.qty} onChange={v => onChange('qty', v)} />
        {china.shipMethod ? (
          <CalcCell label="7. ราคาขนส่งต่อ Q" unit="฿" value={d.shipRatePerQ} />
        ) : (
          <InputCell label="7. ราคาขนส่งต่อ Q" unit="฿" value={china.shipPerPiece} onChange={v => onChange('shipPerPiece', v)} />
        )}
        <CalcCell label="8. ราคารวมค่าขนส่ง" unit="฿" value={d.shipTotal} />
        <CalcCell label="9. ต้นทุนขนส่ง/ชิ้น" unit="฿" value={d.shipPerUnit} />
        <CalcCell label="10. ต้นทุนรวม" unit="฿" value={d.totalCost} />
        <InputCell label="11. ราคาขายรวม" unit="฿" value={china.sellPrice} onChange={v => onChange('sellPrice', v)} />
        <CalcCell label="12. กำไรสุทธิ" unit="฿" value={d.netProfit} highlight />
      </div>
    </div>
  )
}

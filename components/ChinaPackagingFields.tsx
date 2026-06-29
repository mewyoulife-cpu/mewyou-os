'use client'

// UI for the "ผลิตแพคเกจจิ้งจีน" (China packaging production) cost fields.
// Pure cost logic lives in lib/chinaPackaging so it can also run on the server.

import {
  CHINA_TYPE, SHIP_METHODS, emptyChina, chinaFromJSON, computeChina,
  type ChinaBase,
} from '@/lib/chinaPackaging'

// Re-export so existing imports from this component keep working.
export { CHINA_TYPE, SHIP_METHODS, emptyChina, chinaFromJSON, computeChina }
export type { ChinaBase }

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

function CalcCell({ label, unit, value, highlight, badge }: {
  label: string; unit?: string; value: number; highlight?: boolean; badge?: string
}) {
  const neg = highlight && value < 0
  return (
    <div>
      <div style={fieldLabel}>{label}{unit ? ` (${unit})` : ''}</div>
      <div style={{
        height: 38, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '0 11px',
        borderRadius: 9, fontSize: 13.5, fontWeight: 600, boxSizing: 'border-box',
        background: highlight ? (neg ? '#fceeec' : '#eef6f1') : '#f5f7f9',
        color: highlight ? (neg ? '#d9534f' : '#3d8a64') : '#54697d',
        border: '1px solid transparent',
        fontFamily: "'IBM Plex Sans', sans-serif",
      }}>
        <span>{fmt(value)}</span>
        {badge && (
          <span style={{
            fontSize: 11.5, fontWeight: 700, padding: '2px 7px', borderRadius: 7,
            background: neg ? '#f7d9d6' : '#d8ecdf', color: neg ? '#d9534f' : '#2f7a52',
          }}>{badge}</span>
        )}
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
                onClick={() => {
                  if (active) {
                    onChange('shipMethod', '')
                  } else {
                    onChange('shipMethod', m.key)
                    onChange('shipPerPiece', String(m.rate)) // prefill default, still editable
                  }
                }}
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
        <InputCell label="7. ราคาขนส่งต่อ Q" unit="฿" value={china.shipPerPiece} onChange={v => onChange('shipPerPiece', v)} />

        <CalcCell label="8. ราคารวมค่าขนส่ง" unit="฿" value={d.shipTotal} />
        <CalcCell label="9. ต้นทุนขนส่ง/ชิ้น" unit="฿" value={d.shipPerUnit} />
        <CalcCell label="10. ต้นทุนรวม" unit="฿" value={d.totalCost} />
        <InputCell label="11. ราคาขาย" unit="฿/ชิ้น" value={china.sellPrice} onChange={v => onChange('sellPrice', v)} />
        <CalcCell label="12. ราคาขายรวม" unit="฿" value={d.sellTotal} />
        <CalcCell label="13. กำไรสุทธิ" unit="฿" value={d.netProfit} highlight
          badge={`${d.netMarginPct >= 0 ? '+' : ''}${fmt(d.netMarginPct)}%`} />
      </div>
    </div>
  )
}

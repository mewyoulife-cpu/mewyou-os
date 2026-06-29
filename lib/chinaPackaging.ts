// Pure cost logic for packaging-production projects.
// No React / 'use client' here so it can be imported on the server (API routes).

export const CHINA_TYPE = 'ผลิตแพคเกจจิ้งจีน'
export const THAI_TYPE = 'ผลิตแพคเกจจิ้งไทย'

export type ChinaBase = {
  yuanCost: string     // ต้นทุนเงินหยวน (¥ / ชิ้น)
  rate: string         // เรทเงิน (บาท/หยวน)
  moq: string          // จำนวน MOQ (จำนวนชิ้นที่ผลิตจริง)
  qty: string          // จำนวน Q (จำนวนลอตขนส่ง)
  shipMethod: string   // วิธีขนส่ง: '' | 'sea' | 'truck'
  shipPerPiece: string // ราคาขนส่งต่อ Q (กรอกเอง เมื่อไม่เลือกวิธีขนส่ง)
  sellPrice: string    // ราคาขายต่อชิ้น
}

// Fixed shipping rates per 1 Q (used as a default; the rate stays editable).
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
  const moq = num(b.moq)            // จำนวนชิ้นที่ผลิตจริง
  const qty = num(b.qty)            // จำนวนลอตขนส่ง
  const sellPrice = num(b.sellPrice) // ราคาขายต่อชิ้น
  // The entered shipping price takes priority; the chosen method only provides
  // a default fallback when the field is left empty (rates fluctuate occasionally).
  const typedRate = num(b.shipPerPiece)
  const presetRate = shipRateFor(b.shipMethod)
  const shipRatePerQ = typedRate > 0 ? typedRate : (presetRate != null ? presetRate : 0)

  const bahtPerPiece = yuanCost * rate            // ต้นทุนบาท/ชิ้น
  const bahtTotal = bahtPerPiece * moq            // ต้นทุนบาทรวม = บาท/ชิ้น × MOQ
  const shipTotal = shipRatePerQ * qty            // ค่าขนส่งรวม = ต่อ Q × จำนวน Q
  const shipPerUnit = moq > 0 ? shipTotal / moq : 0 // ต้นทุนขนส่ง/ชิ้น = ขนส่งรวม ÷ MOQ
  const totalCost = bahtTotal + shipTotal         // ต้นทุนรวม = สินค้า + ขนส่ง
  const sellTotal = sellPrice * moq               // ราคาขายรวม = ราคาขาย × MOQ
  const netProfit = sellTotal - totalCost         // กำไรสุทธิ = ราคาขายรวม − ต้นทุนรวม
  const netMarginPct = totalCost > 0 ? (netProfit / totalCost) * 100 : 0 // กำไร % จากต้นทุน

  return {
    yuanCost, rate, moq, qty, shipMethod: b.shipMethod,
    shipPerPiece: num(b.shipPerPiece), // keep base value so re-computing stored output is idempotent
    sellPrice, bahtPerPiece, bahtTotal, shipRatePerQ, shipTotal, shipPerUnit, totalCost, sellTotal, netProfit, netMarginPct,
  }
}

// Net profit for a single project's stored chinaData (0 if none / unparseable).
export function chinaNetProfit(chinaData: string | null | undefined): number {
  if (!chinaData) return 0
  try {
    return computeChina(chinaFromJSON(chinaData)).netProfit
  } catch {
    return 0
  }
}

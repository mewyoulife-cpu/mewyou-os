'use client'

// Client-side OCR for Thai bank transfer / QR payment / mobile-banking slips.
// Uses tesseract.js (Thai + English) — no API key required. Parses the common
// fields out of the recognised text with heuristics that work across banks.

export interface SlipData {
  amount?: number
  date?: string
  ref?: string
  transactionId?: string
  fromBank?: string
  toBank?: string
  sender?: string
  raw: string
  ok: boolean
}

const THAI_BANKS: { key: string; label: string }[] = [
  { key: 'กสิกร', label: 'ธนาคารกสิกรไทย' },
  { key: 'kbank', label: 'ธนาคารกสิกรไทย' },
  { key: 'ไทยพาณิชย์', label: 'ธนาคารไทยพาณิชย์' },
  { key: 'scb', label: 'ธนาคารไทยพาณิชย์' },
  { key: 'กรุงเทพ', label: 'ธนาคารกรุงเทพ' },
  { key: 'bangkok bank', label: 'ธนาคารกรุงเทพ' },
  { key: 'bbl', label: 'ธนาคารกรุงเทพ' },
  { key: 'กรุงไทย', label: 'ธนาคารกรุงไทย' },
  { key: 'ktb', label: 'ธนาคารกรุงไทย' },
  { key: 'กรุงศรี', label: 'ธนาคารกรุงศรีอยุธยา' },
  { key: 'krungsri', label: 'ธนาคารกรุงศรีอยุธยา' },
  { key: 'ทหารไทยธนชาต', label: 'ttb' },
  { key: 'ttb', label: 'ttb' },
  { key: 'ออมสิน', label: 'ธนาคารออมสิน' },
  { key: 'gsb', label: 'ธนาคารออมสิน' },
  { key: 'พร้อมเพย์', label: 'พร้อมเพย์' },
  { key: 'promptpay', label: 'พร้อมเพย์' },
]

const TH_MONTHS: Record<string, string> = {
  'ม.ค.': '01', 'มกราคม': '01', 'jan': '01',
  'ก.พ.': '02', 'กุมภาพันธ์': '02', 'feb': '02',
  'มี.ค.': '03', 'มีนาคม': '03', 'mar': '03',
  'เม.ย.': '04', 'เมษายน': '04', 'apr': '04',
  'พ.ค.': '05', 'พฤษภาคม': '05', 'may': '05',
  'มิ.ย.': '06', 'มิถุนายน': '06', 'jun': '06',
  'ก.ค.': '07', 'กรกฎาคม': '07', 'jul': '07',
  'ส.ค.': '08', 'สิงหาคม': '08', 'aug': '08',
  'ก.ย.': '09', 'กันยายน': '09', 'sep': '09',
  'ต.ค.': '10', 'ตุลาคม': '10', 'oct': '10',
  'พ.ย.': '11', 'พฤศจิกายน': '11', 'nov': '11',
  'ธ.ค.': '12', 'ธันวาคม': '12', 'dec': '12',
}

function parseAmount(text: string): number | undefined {
  // Prefer a number that sits next to an amount keyword or ฿/บาท.
  const near = text.match(/(?:จำนวนเงิน|amount|฿)\s*[:：]?\s*([0-9][0-9,]*\.[0-9]{2})/i)
  if (near) return Number(near[1].replace(/,/g, ''))
  // Otherwise take the largest 2-decimal number on the slip.
  const nums = [...text.matchAll(/([0-9][0-9,]*\.[0-9]{2})/g)].map(m => Number(m[1].replace(/,/g, '')))
  if (nums.length) return Math.max(...nums)
  return undefined
}

function parseDate(text: string): string | undefined {
  // 14/06/2569 or 14-06-2024
  const dmy = text.match(/(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/)
  if (dmy) {
    const d = dmy[1], m = dmy[2]
    let y = dmy[3]
    if (y.length === 2) y = '25' + y
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`
  }
  // 14 มิ.ย. 67  /  14 มิถุนายน 2567  / 14 Jun 2024
  const named = text.match(/(\d{1,2})\s+([ก-๙.]{2,12}|[A-Za-z]{3,9})\.?\s*(\d{2,4})/)
  if (named) {
    const mk = named[2].toLowerCase().replace(/\s/g, '')
    const mm = TH_MONTHS[named[2]] || TH_MONTHS[mk]
    if (mm) {
      let y = named[3]
      if (y.length === 2) y = '25' + y
      return `${named[1].padStart(2, '0')}/${mm}/${y}`
    }
  }
  return undefined
}

function parseRef(text: string): { ref?: string; transactionId?: string } {
  const refM = text.match(/(?:เลขที่รายการ|รหัสอ้างอิง|อ้างอิง|reference|ref(?:erence)?\s*(?:no|number)?|รายการเลขที่)\s*[:：#]?\s*([A-Za-z0-9]{6,30})/i)
  const txM = text.match(/(?:transaction\s*id|trans\s*id|รหัสรายการ)\s*[:：#]?\s*([A-Za-z0-9]{6,30})/i)
  return { ref: refM?.[1], transactionId: txM?.[1] }
}

function detectBanks(text: string): { fromBank?: string; toBank?: string } {
  const lower = text.toLowerCase()
  const found: string[] = []
  for (const b of THAI_BANKS) {
    if (lower.includes(b.key.toLowerCase()) && !found.includes(b.label)) found.push(b.label)
  }
  return { fromBank: found[0], toBank: found[1] }
}

function parseSender(text: string): string | undefined {
  const m = text.match(/(?:จาก|from|ผู้โอน|ชื่อผู้โอน)\s*[:：]?\s*((?:นาย|นาง|น\.ส\.|คุณ|mr\.?|ms\.?|mrs\.?)?\s*[^\n]{2,40})/i)
  return m?.[1]?.trim()
}

export async function readSlip(image: File | string): Promise<SlipData> {
  try {
    const { createWorker } = await import('tesseract.js')
    const worker = await createWorker(['tha', 'eng'])
    const { data } = await worker.recognize(image)
    await worker.terminate()
    const raw = data.text || ''
    const { ref, transactionId } = parseRef(raw)
    const { fromBank, toBank } = detectBanks(raw)
    const result: SlipData = {
      amount: parseAmount(raw),
      date: parseDate(raw),
      ref,
      transactionId,
      fromBank,
      toBank,
      sender: parseSender(raw),
      raw,
      ok: raw.trim().length > 0,
    }
    // Consider it a success only if we recognised at least one useful field.
    result.ok = !!(result.amount || result.date || result.ref || result.transactionId || result.fromBank)
    return result
  } catch {
    return { raw: '', ok: false }
  }
}

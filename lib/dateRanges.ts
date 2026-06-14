// Shared date-range presets for the dashboard filter. Pure + client-safe.

export type RangePreset =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last30'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'this_year'
  | 'custom'

export const PRESET_ORDER: RangePreset[] = [
  'today', 'yesterday', 'last7', 'last30',
  'this_month', 'last_month', 'this_quarter', 'this_year', 'custom',
]

export const PRESET_LABELS: Record<RangePreset, string> = {
  today: 'วันนี้',
  yesterday: 'เมื่อวาน',
  last7: '7 วันล่าสุด',
  last30: '30 วันล่าสุด',
  this_month: 'เดือนนี้',
  last_month: 'เดือนก่อน',
  this_quarter: 'ไตรมาสนี้',
  this_year: 'ปีนี้',
  custom: 'กำหนดเอง',
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function endOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

export interface ResolvedRange {
  from: Date
  to: Date
  label: string
}

// Resolve a preset (and optional custom dates) into concrete from/to instants,
// computed in the caller's local timezone so "today" matches the user's day.
export function resolveRange(
  preset: RangePreset,
  customFrom?: string,
  customTo?: string,
): ResolvedRange {
  const now = new Date()
  const today0 = startOfDay(now)
  const todayE = endOfDay(now)

  switch (preset) {
    case 'today':
      return { from: today0, to: todayE, label: PRESET_LABELS.today }
    case 'yesterday': {
      const y = new Date(today0)
      y.setDate(y.getDate() - 1)
      return { from: startOfDay(y), to: endOfDay(y), label: PRESET_LABELS.yesterday }
    }
    case 'last7': {
      const f = new Date(today0)
      f.setDate(f.getDate() - 6)
      return { from: f, to: todayE, label: PRESET_LABELS.last7 }
    }
    case 'last30': {
      const f = new Date(today0)
      f.setDate(f.getDate() - 29)
      return { from: f, to: todayE, label: PRESET_LABELS.last30 }
    }
    case 'this_month': {
      const f = new Date(now.getFullYear(), now.getMonth(), 1)
      return { from: startOfDay(f), to: todayE, label: PRESET_LABELS.this_month }
    }
    case 'last_month': {
      const f = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const t = new Date(now.getFullYear(), now.getMonth(), 0)
      return { from: startOfDay(f), to: endOfDay(t), label: PRESET_LABELS.last_month }
    }
    case 'this_quarter': {
      const q = Math.floor(now.getMonth() / 3)
      const f = new Date(now.getFullYear(), q * 3, 1)
      return { from: startOfDay(f), to: todayE, label: PRESET_LABELS.this_quarter }
    }
    case 'this_year': {
      const f = new Date(now.getFullYear(), 0, 1)
      return { from: startOfDay(f), to: todayE, label: PRESET_LABELS.this_year }
    }
    case 'custom': {
      const f = customFrom ? startOfDay(new Date(customFrom)) : today0
      const t = customTo ? endOfDay(new Date(customTo)) : todayE
      const fmt = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear() + 543}`
      return { from: f, to: t, label: `${fmt(f)} – ${fmt(t)}` }
    }
  }
}

'use client'

import { useEffect, useState, useCallback } from 'react'

interface CalendarNote {
  id: string
  date: string
  text: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
}

const priorityMap = {
  low: { label: 'ต่ำ', color: '#3d8a64', bg: '#e9f3ed' },
  normal: { label: 'ปกติ', color: '#5f7d99', bg: '#e8eef4' },
  high: { label: 'สูง', color: '#f4a431', bg: '#fdf3e3' },
  urgent: { label: 'เร่งด่วน', color: '#c4593f', bg: '#fceee8' },
}

const thaiMonths = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
]

const thaiMonthsShort = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

const dayHeaders = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

const staticEvents: Record<string, { text: string; color: string; bg: string }[]> = {
  '2026-06-02': [{ text: 'ส่งงาน Packaging', color: '#5f7d99', bg: '#e8eef4' }],
  '2026-06-05': [{ text: 'ประชุม Lotus', color: '#3d8a64', bg: '#e9f3ed' }, { text: 'ส่ง Logo Draft', color: '#e0a96d', bg: '#fdf3e3' }],
  '2026-06-09': [{ text: 'Review Design', color: '#5f7d99', bg: '#e8eef4' }],
  '2026-06-13': [{ text: 'ส่ง CI Manual', color: '#c4593f', bg: '#fceee8' }, { text: 'ประชุมทีม', color: '#5f7d99', bg: '#e8eef4' }],
  '2026-06-16': [{ text: 'Deadline Label', color: '#c4593f', bg: '#fceee8' }],
  '2026-06-18': [{ text: 'นัดลูกค้า BrandX', color: '#3d8a64', bg: '#e9f3ed' }],
  '2026-06-20': [{ text: 'ส่งสรุปเดือน', color: '#e0a96d', bg: '#fdf3e3' }],
  '2026-06-23': [{ text: 'ประชุมพาร์ทเนอร์', color: '#5f7d99', bg: '#e8eef4' }],
  '2026-06-25': [{ text: 'Revise Packaging', color: '#5f7d99', bg: '#e8eef4' }, { text: 'ส่ง Invoice', color: '#3d8a64', bg: '#e9f3ed' }],
  '2026-06-30': [{ text: 'สิ้นเดือน – ปิดบัญชี', color: '#c4593f', bg: '#fceee8' }],
}

const todayEvents = [
  { time: '09:00', title: 'ส่ง CI Manual ให้ลูกค้า', sub: 'ส่งไฟล์ PDF + Guideline ครบ' },
  { time: '11:00', title: 'ประชุมทีม', sub: 'อัพเดตงานประจำสัปดาห์' },
  { time: '14:30', title: 'นัด Review งาน Packaging', sub: 'ลูกค้า Lotus – รอบ 2' },
]

function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = []
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = firstDay.getDay()

  for (let i = 0; i < startDow; i++) {
    const d = new Date(firstDay)
    d.setDate(d.getDate() - (startDow - i))
    days.push(d)
  }
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d))
  }
  while (days.length % 7 !== 0) {
    const last = days[days.length - 1]
    const next = new Date(last)
    next.setDate(next.getDate() + 1)
    days.push(next)
  }
  return days
}

export default function CalendarPage() {
  const today = new Date(2026, 5, 13)
  const todayStr = toDateStr(today)
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 5, 1))
  const [notes, setNotes] = useState<Record<string, CalendarNote[]>>({})
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [popupText, setPopupText] = useState('')
  const [popupPriority, setPopupPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal')
  const [adding, setAdding] = useState(false)
  const [view, setView] = useState<'day' | 'week' | 'month'>('month')

  const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`

  const loadNotes = useCallback(() => {
    fetch(`/api/calendar?month=${monthKey}`)
      .then(r => r.json())
      .then(data => {
        const byDate: Record<string, CalendarNote[]> = {}
        const arr: CalendarNote[] = Array.isArray(data) ? data : data.notes || []
        arr.forEach(note => {
          if (!byDate[note.date]) byDate[note.date] = []
          byDate[note.date].push(note)
        })
        setNotes(byDate)
      })
      .catch(() => {})
  }, [monthKey])

  useEffect(() => { loadNotes() }, [loadNotes])

  function prevMonth() {
    setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))
  }
  function nextMonth() {
    setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))
  }

  async function addNote() {
    if (!popupText.trim() || !selectedDay) return
    setAdding(true)
    try {
      await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDay, text: popupText, priority: popupPriority }),
      })
      setPopupText('')
      setPopupPriority('normal')
      loadNotes()
    } finally {
      setAdding(false)
    }
  }

  async function deleteNote(id: string) {
    await fetch(`/api/calendar/${id}`, { method: 'DELETE' })
    loadNotes()
  }

  const days = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth())
  const thaiYear = currentMonth.getFullYear() + 543
  const selectedNotes = selectedDay ? (notes[selectedDay] || []) : []

  function formatThaiDateShort(dateStr: string) {
    const [y, m, d] = dateStr.split('-')
    const thaiYearShort = String((parseInt(y) + 543) % 100).padStart(2, '0')
    return `${parseInt(d)} ${thaiMonthsShort[parseInt(m) - 1]} ${thaiYearShort}`
  }

  function formatThaiDateLong(dateStr: string) {
    const [y, m, d] = dateStr.split('-')
    return `${parseInt(d)} ${thaiMonths[parseInt(m) - 1]} ${parseInt(y) + 543}`
  }

  const allEventsForDay = (dateStr: string) => {
    const staticEvs = staticEvents[dateStr] || []
    const noteEvs = (notes[dateStr] || []).map(n => ({
      text: n.text,
      color: priorityMap[n.priority].color,
      bg: priorityMap[n.priority].bg,
    }))
    return [...staticEvs, ...noteEvs]
  }

  return (
    <div style={{ fontFamily: "'IBM Plex Sans Thai', 'IBM Plex Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, margin: '16px 0 18px' }}>
        <div>
          <div style={{ fontSize: 23, fontWeight: 700, color: '#2f3b45' }}>ปฏิทินงาน</div>
          <div style={{ fontSize: 13.5, color: '#7a8893', marginTop: 2 }}>นัดหมาย กำหนดส่ง และงานสำคัญทั้งหมด</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div onClick={prevMonth} style={{ width: 34, height: 34, border: '1px solid #e4e8ec', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fff' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#5b6b77' }}>chevron_left</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#2f3b45', minWidth: 128, textAlign: 'center' }}>
              {thaiMonths[currentMonth.getMonth()]} {thaiYear}
            </div>
            <div onClick={nextMonth} style={{ width: 34, height: 34, border: '1px solid #e4e8ec', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fff' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#5b6b77' }}>chevron_right</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 3, background: '#fff', border: '1px solid #e4e8ec', borderRadius: 10, padding: 3 }}>
            {(['day', 'week', 'month'] as const).map((v, i) => {
              const labels = ['วัน', 'สัปดาห์', 'เดือน']
              const active = view === v
              return (
                <div key={v} onClick={() => setView(v)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: active ? 600 : 400, background: active ? '#5f7d99' : 'transparent', color: active ? '#fff' : '#7a8893', cursor: 'pointer' }}>
                  {labels[i]}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 20 }}>
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 10 }}>
          {dayHeaders.map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: 12, color: '#9aa7b2', fontWeight: 600 }}>{d}</div>
          ))}
        </div>
        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {days.map((day, i) => {
            const dateStr = toDateStr(day)
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selectedDay
            const evs = allEventsForDay(dateStr)

            return (
              <div
                key={i}
                onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                style={{
                  minHeight: 80,
                  padding: '8px 7px',
                  borderRadius: 10,
                  background: isSelected ? '#f0f5fa' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => {
                  if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = '#f8fafb'
                }}
                onMouseLeave={e => {
                  if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'
                }}
              >
                <div style={{ marginBottom: 5 }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: '50%',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: isToday ? 700 : 400,
                    background: isToday ? '#5f7d99' : 'transparent',
                    color: isToday ? '#fff' : isCurrentMonth ? '#2f3b45' : '#c5cdd4',
                  }}>
                    {day.getDate()}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {evs.slice(0, 2).map((ev, j) => (
                    <div key={j} style={{ background: ev.bg, color: ev.color, borderRadius: 4, padding: '2px 5px', fontSize: 10, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ev.text}
                    </div>
                  ))}
                  {evs.length > 2 && (
                    <div style={{ fontSize: 10, color: '#9aa7b2', paddingLeft: 4 }}>+{evs.length - 2} อื่น</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 13, fontSize: 12.5, color: '#9aa7b2' }}>
        <span className="material-symbols-rounded" style={{ fontSize: 17, color: '#a9b6c0' }}>touch_app</span>
        คลิกที่ช่องวันเพื่อเพิ่มหรือแก้ไขโน้ต
      </div>

      {/* Today appointments */}
      <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 22, marginTop: 18, maxWidth: 640 }}>
        <div style={{ fontSize: 15.5, fontWeight: 600, color: '#2f3b45', marginBottom: 16 }}>
          รายการนัดหมายวันนี้ · {formatThaiDateShort(todayStr)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {todayEvents.map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#54697d', fontFamily: "'IBM Plex Sans', sans-serif", width: 52, flexShrink: 0 }}>{e.time}</div>
              <div style={{ borderLeft: '2px solid #cdd9e3', paddingLeft: 13, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#2f3b45' }}>{e.title}</div>
                <div style={{ fontSize: 12.5, color: '#9aa7b2', marginTop: 1 }}>{e.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Day popup modal */}
      {selectedDay && (
        <div
          onClick={() => setSelectedDay(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(40,55,70,.32)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: 420, maxWidth: '100%', background: '#fff', borderRadius: 18, boxShadow: '0 24px 60px rgba(30,45,60,.28)', overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #f0f2f5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 22, color: '#5f7d99' }}>event_note</span>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#2f3b45' }}>{formatThaiDateLong(selectedDay)}</div>
              </div>
              <div onClick={() => setSelectedDay(null)} style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#9aa7b2' }}>close</span>
              </div>
            </div>
            <div style={{ padding: '20px 22px' }}>
              <div style={{ fontSize: 12.5, color: '#7a8893', fontWeight: 600, marginBottom: 10 }}>โน้ตของวันนี้</div>

              {selectedNotes.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                  {selectedNotes.map(note => {
                    const p = priorityMap[note.priority] || priorityMap.normal
                    return (
                      <div key={note.id} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ flex: 1, background: p.bg, color: p.color, borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 500 }}>{note.text}</div>
                        <div onClick={() => deleteNote(note.id)} style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                          <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#c3cdd6' }}>delete</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: 14, borderRadius: 10, background: '#fafbfc', color: '#9aa7b2', fontSize: 13, marginBottom: 18 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#cdd6df' }}>inbox</span>
                  ยังไม่มีโน้ตในวันนี้
                </div>
              )}

              <div style={{ height: 1, background: '#f0f2f5', marginBottom: 18 }}></div>
              <div style={{ fontSize: 12.5, color: '#7a8893', fontWeight: 600, marginBottom: 9 }}>ลำดับความสำคัญ (สีโน้ต)</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                {(Object.entries(priorityMap) as [string, typeof priorityMap.normal][]).map(([key, val]) => {
                  const active = popupPriority === key
                  return (
                    <div
                      key={key}
                      onClick={() => setPopupPriority(key as 'low' | 'normal' | 'high' | 'urgent')}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: `1.5px solid ${active ? val.color : '#e4e8ec'}`, background: active ? val.bg : '#fff', cursor: 'pointer', fontSize: 13 }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: val.color, display: 'inline-block' }}></span>
                      <span style={{ color: active ? val.color : '#7a8893', fontWeight: active ? 600 : 400 }}>{val.label}</span>
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 9 }}>
                <input
                  value={popupText}
                  onChange={e => setPopupText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addNote()}
                  placeholder="พิมพ์โน้ต เช่น 10:00 ประชุมลูกค้า..."
                  style={{ flex: 1, border: '1px solid #e4e8ec', borderRadius: 10, height: 42, padding: '0 14px', fontFamily: 'inherit', fontSize: 14, color: '#2f3b45', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                />
                <div onClick={addNote} style={{ display: 'flex', alignItems: 'center', gap: 5, height: 42, padding: '0 16px', borderRadius: 10, background: '#5f7d99', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 19 }}>add</span>
                  เพิ่ม
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

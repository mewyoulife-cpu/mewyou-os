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

const dayHeaders = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา']

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = []
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  // Monday = 0
  let startDow = firstDay.getDay()
  startDow = startDow === 0 ? 6 : startDow - 1

  for (let i = 0; i < startDow; i++) {
    const d = new Date(firstDay)
    d.setDate(d.getDate() - (startDow - i))
    days.push(d)
  }
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d))
  }
  // Fill to complete last row
  while (days.length % 7 !== 0) {
    const last = days[days.length - 1]
    const next = new Date(last)
    next.setDate(next.getDate() + 1)
    days.push(next)
  }
  return days
}

export default function CalendarPage() {
  const today = new Date()
  const todayStr = toDateStr(today)
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [notes, setNotes] = useState<Record<string, CalendarNote[]>>({})
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [popupText, setPopupText] = useState('')
  const [popupPriority, setPopupPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal')
  const [adding, setAdding] = useState(false)

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
  const todayNotes = notes[todayStr] || []
  const selectedNotes = selectedDay ? (notes[selectedDay] || []) : []

  function formatThaiDate(dateStr: string) {
    const [y, m, d] = dateStr.split('-')
    return `${parseInt(d)} ${thaiMonths[parseInt(m) - 1]} ${parseInt(y) + 543}`
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#2f3b45', margin: 0 }}>ปฏิทินงาน</h1>
          <p style={{ fontSize: 14, color: '#7a8893', margin: '4px 0 0' }}>บันทึกและติดตามงานรายวัน</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={prevMonth} style={{
            width: 36, height: 36, borderRadius: 10, border: '1px solid #edf0f3',
            background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#5f7d99' }}>chevron_left</span>
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#2f3b45', minWidth: 160, textAlign: 'center' }}>
            {thaiMonths[currentMonth.getMonth()]} {thaiYear}
          </span>
          <button onClick={nextMonth} style={{
            width: 36, height: 36, borderRadius: 10, border: '1px solid #edf0f3',
            background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#5f7d99' }}>chevron_right</span>
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', overflow: 'hidden', marginBottom: 16 }}>
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #edf0f3' }}>
          {dayHeaders.map((d, i) => (
            <div key={i} style={{
              padding: '12px 8px',
              textAlign: 'center',
              fontSize: 13,
              fontWeight: 700,
              color: i === 6 ? '#c4593f' : '#7a8893',
              borderRight: i < 6 ? '1px solid #edf0f3' : 'none',
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {days.map((day, i) => {
            const dateStr = toDateStr(day)
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
            const isToday = dateStr === todayStr
            const isSunday = day.getDay() === 0
            const dayNotes = notes[dateStr] || []
            const isSelected = dateStr === selectedDay

            return (
              <div
                key={i}
                onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                style={{
                  minHeight: 90,
                  padding: '8px 6px',
                  borderRight: (i + 1) % 7 !== 0 ? '1px solid #edf0f3' : 'none',
                  borderBottom: i < days.length - 7 ? '1px solid #edf0f3' : 'none',
                  background: isSelected ? '#f0f5fa' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = '#f9fafb'
                }}
                onMouseLeave={e => {
                  if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'
                }}
              >
                {/* Date number */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginBottom: 4,
                }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: isToday ? 700 : 400,
                    background: isToday ? '#5f7d99' : 'transparent',
                    color: isToday ? '#fff' : isSunday ? '#c4593f' : isCurrentMonth ? '#2f3b45' : '#c5cdd4',
                  }}>
                    {day.getDate()}
                  </span>
                </div>

                {/* Notes chips */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {dayNotes.slice(0, 3).map(note => {
                    const p = priorityMap[note.priority] || priorityMap.normal
                    return (
                      <div key={note.id} style={{
                        background: p.bg,
                        color: p.color,
                        borderRadius: 4,
                        padding: '2px 5px',
                        fontSize: 10,
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {note.text}
                      </div>
                    )
                  })}
                  {dayNotes.length > 3 && (
                    <div style={{ fontSize: 10, color: '#9aa7b2', paddingLeft: 4 }}>+{dayNotes.length - 3} อื่น</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Note editor popup */}
      {selectedDay && (
        <div style={{
          background: '#fff',
          borderRadius: 18,
          border: '1px solid #edf0f3',
          padding: 22,
          marginBottom: 16,
          position: 'relative',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#2f3b45', margin: 0 }}>
                {formatThaiDate(selectedDay)}
              </h3>
              <p style={{ fontSize: 13, color: '#7a8893', margin: '3px 0 0' }}>บันทึกโน้ตประจำวัน</p>
            </div>
            <button onClick={() => setSelectedDay(null)} style={{
              width: 32, height: 32, borderRadius: 8, border: '1px solid #edf0f3',
              background: '#f9fafb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#7a8893' }}>close</span>
            </button>
          </div>

          {/* Existing notes */}
          {selectedNotes.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#9aa7b2', marginBottom: 8 }}>โน้ตที่บันทึกไว้</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedNotes.map(note => {
                  const p = priorityMap[note.priority] || priorityMap.normal
                  return (
                    <div key={note.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: p.bg,
                      borderRadius: 10,
                      border: `1px solid ${p.color}22`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                          background: p.color, color: '#fff',
                          borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 600,
                        }}>
                          {p.label}
                        </span>
                        <span style={{ fontSize: 13, color: '#2f3b45' }}>{note.text}</span>
                      </div>
                      <button
                        onClick={() => deleteNote(note.id)}
                        style={{
                          width: 28, height: 28, borderRadius: 6, border: 'none',
                          background: 'rgba(196,89,63,0.1)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <span className="material-symbols-rounded" style={{ fontSize: 14, color: '#c4593f' }}>delete</span>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Add new note */}
          <div style={{ borderTop: selectedNotes.length > 0 ? '1px solid #edf0f3' : 'none', paddingTop: selectedNotes.length > 0 ? 16 : 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#9aa7b2', marginBottom: 10 }}>เพิ่มโน้ตใหม่</div>
            <input
              type="text"
              placeholder="บันทึกงาน นัดหมาย หรือข้อความ..."
              value={popupText}
              onChange={e => setPopupText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addNote()}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #edf0f3',
                borderRadius: 10,
                fontSize: 14,
                color: '#2f3b45',
                background: '#f9fafb',
                outline: 'none',
                marginBottom: 12,
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: '#9aa7b2', marginRight: 4 }}>ระดับ:</span>
              {(Object.entries(priorityMap) as [string, { label: string; color: string; bg: string }][]).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setPopupPriority(key as 'low' | 'normal' | 'high' | 'urgent')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 8,
                    border: popupPriority === key ? `2px solid ${val.color}` : '1.5px solid #edf0f3',
                    background: popupPriority === key ? val.bg : '#f9fafb',
                    color: popupPriority === key ? val.color : '#7a8893',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {val.label}
                </button>
              ))}
              <button
                onClick={addNote}
                disabled={adding || !popupText.trim()}
                style={{
                  marginLeft: 'auto',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: 10,
                  background: !popupText.trim() ? '#d0d8e0' : '#5f7d99',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: !popupText.trim() ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 16 }}>add</span>
                เพิ่มโน้ต
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Today panel */}
      <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#5f7d99' }}>today</span>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2f3b45', margin: 0 }}>
            วันนี้ — {formatThaiDate(todayStr)}
          </h3>
        </div>
        {todayNotes.length === 0 ? (
          <div style={{ color: '#9aa7b2', fontSize: 13 }}>ยังไม่มีโน้ตสำหรับวันนี้</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {todayNotes.map(note => {
              const p = priorityMap[note.priority] || priorityMap.normal
              return (
                <div key={note.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', background: p.bg, borderRadius: 10,
                }}>
                  <span style={{
                    background: p.color, color: '#fff',
                    borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 600,
                  }}>{p.label}</span>
                  <span style={{ fontSize: 13, color: '#2f3b45' }}>{note.text}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

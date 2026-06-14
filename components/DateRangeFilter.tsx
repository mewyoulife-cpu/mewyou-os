'use client'

import { useEffect, useRef, useState } from 'react'
import { PRESET_ORDER, PRESET_LABELS, resolveRange, type RangePreset } from '@/lib/dateRanges'

export interface RangeState {
  preset: RangePreset
  customFrom?: string
  customTo?: string
}

interface Props {
  value: RangeState
  onChange: (next: RangeState) => void
}

export default function DateRangeFilter({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [draftFrom, setDraftFrom] = useState(value.customFrom || '')
  const [draftTo, setDraftTo] = useState(value.customTo || '')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setShowCustom(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const label = resolveRange(value.preset, value.customFrom, value.customTo).label

  function pick(preset: RangePreset) {
    if (preset === 'custom') {
      setShowCustom(true)
      return
    }
    onChange({ preset })
    setOpen(false)
  }

  function applyCustom() {
    if (!draftFrom || !draftTo) return
    onChange({ preset: 'custom', customFrom: draftFrom, customTo: draftTo })
    setOpen(false)
    setShowCustom(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, height: 40,
          padding: '0 14px', borderRadius: 11, background: '#fff',
          border: '1px solid #e4e8ec', cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 13.5, color: '#3b4954', fontWeight: 500, whiteSpace: 'nowrap',
        }}
      >
        <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#7a8893' }}>calendar_month</span>
        {label}
        <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#9aa7b2' }}>
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 50,
          background: '#fff', border: '1px solid #e4e8ec', borderRadius: 13,
          boxShadow: '0 12px 32px rgba(47,59,69,.14)', padding: 6, minWidth: 196,
        }}>
          {PRESET_ORDER.map(preset => {
            const active = value.preset === preset && !(preset === 'custom' && showCustom)
            return (
              <button
                key={preset}
                onClick={() => pick(preset)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', height: 36, padding: '0 11px', borderRadius: 8,
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5,
                  textAlign: 'left', color: active ? '#5f7d99' : '#3b4954',
                  fontWeight: active ? 600 : 400,
                  background: active ? '#eef3f7' : 'transparent',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget.style.background = '#f5f7f9') }}
                onMouseLeave={e => { if (!active) (e.currentTarget.style.background = 'transparent') }}
              >
                {PRESET_LABELS[preset]}
                {active && <span className="material-symbols-rounded" style={{ fontSize: 17 }}>check</span>}
                {preset === 'custom' && !active && <span className="material-symbols-rounded" style={{ fontSize: 17, color: '#9aa7b2' }}>chevron_right</span>}
              </button>
            )
          })}

          {showCustom && (
            <div style={{ borderTop: '1px solid #f0f2f5', marginTop: 6, padding: '10px 6px 4px' }}>
              <label style={{ display: 'block', fontSize: 11.5, color: '#7a8893', marginBottom: 4 }}>ตั้งแต่วันที่</label>
              <input type="date" value={draftFrom} max={draftTo || undefined} onChange={e => setDraftFrom(e.target.value)}
                style={{ width: '100%', height: 36, border: '1px solid #e4e8ec', borderRadius: 8, padding: '0 10px', fontFamily: 'inherit', fontSize: 13, color: '#2f3b45', marginBottom: 9 }} />
              <label style={{ display: 'block', fontSize: 11.5, color: '#7a8893', marginBottom: 4 }}>ถึงวันที่</label>
              <input type="date" value={draftTo} min={draftFrom || undefined} onChange={e => setDraftTo(e.target.value)}
                style={{ width: '100%', height: 36, border: '1px solid #e4e8ec', borderRadius: 8, padding: '0 10px', fontFamily: 'inherit', fontSize: 13, color: '#2f3b45', marginBottom: 10 }} />
              <button onClick={applyCustom} disabled={!draftFrom || !draftTo}
                style={{
                  width: '100%', height: 38, border: 'none', borderRadius: 9,
                  background: draftFrom && draftTo ? '#5f7d99' : '#c3cdd6', color: '#fff',
                  fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit',
                  cursor: draftFrom && draftTo ? 'pointer' : 'not-allowed',
                }}>
                ใช้ช่วงวันที่นี้
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

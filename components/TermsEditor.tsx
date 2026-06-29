'use client'

// Editable list of Terms & Conditions lines for a quotation.

export default function TermsEditor({ terms, onChange }: {
  terms: string[]
  onChange: (next: string[]) => void
}) {
  const setLine = (i: number, val: string) => onChange(terms.map((t, idx) => (idx === i ? val : t)))
  const removeLine = (i: number) => onChange(terms.filter((_, idx) => idx !== i))
  const addLine = () => onChange([...terms, ''])
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= terms.length) return
    const next = [...terms]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {terms.map((line, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ color: '#8294a6', fontSize: 15, lineHeight: 1 }}>•</span>
          <input
            value={line}
            onChange={e => setLine(i, e.target.value)}
            placeholder="พิมพ์เงื่อนไข..."
            style={{
              flex: 1, height: 38, border: '1px solid #e4e8ec', borderRadius: 9,
              padding: '0 11px', fontFamily: 'inherit', fontSize: 13.5, color: '#3b4954',
              outline: 'none', background: '#fff', boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Icon name="keyboard_arrow_up" disabled={i === 0} onClick={() => move(i, -1)} />
            <Icon name="keyboard_arrow_down" disabled={i === terms.length - 1} onClick={() => move(i, 1)} />
          </div>
          <Icon name="close" onClick={() => removeLine(i)} danger />
        </div>
      ))}
      <button
        type="button"
        onClick={addLine}
        style={{
          alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 5,
          marginTop: 2, padding: '7px 13px', borderRadius: 9, cursor: 'pointer',
          border: '1.5px dashed #c4cfd8', background: '#fff', color: '#5f7d99',
          fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
        }}
      >
        <span className="material-symbols-rounded" style={{ fontSize: 18 }}>add</span>
        เพิ่มเงื่อนไข
      </button>
    </div>
  )
}

function Icon({ name, onClick, disabled, danger }: {
  name: string; onClick: () => void; disabled?: boolean; danger?: boolean
}) {
  return (
    <span
      className="material-symbols-rounded"
      onClick={disabled ? undefined : onClick}
      style={{
        fontSize: name === 'close' ? 19 : 17,
        color: disabled ? '#d4dbe1' : danger ? '#c0ccd6' : '#9aa7b2',
        cursor: disabled ? 'default' : 'pointer',
        userSelect: 'none',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.color = danger ? '#d9534f' : '#5f7d99' }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.color = danger ? '#c0ccd6' : '#9aa7b2' }}
    >{name}</span>
  )
}

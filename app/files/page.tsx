'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const mockFiles = [
  { id: '1', name: 'PERCARE_Packaging_v3.ai', size: '42 MB', type: 'ai', project: 'PJ-2024-001', customer: 'PERCARE', date: '10 มิ.ย. 2567', category: 'design' },
  { id: '2', name: 'JELLYS_Logo_Final.pdf', size: '8.2 MB', type: 'pdf', project: 'PJ-2024-002', customer: 'JELLYS', date: '09 มิ.ย. 2567', category: 'final' },
  { id: '3', name: 'GLOWME_Label_Draft.psd', size: '156 MB', type: 'psd', project: 'PJ-2024-003', customer: 'GLOWME', date: '08 มิ.ย. 2567', category: 'design' },
  { id: '4', name: 'PERCARE_Brief.docx', size: '1.2 MB', type: 'doc', project: 'PJ-2024-001', customer: 'PERCARE', date: '01 มิ.ย. 2567', category: 'brief' },
  { id: '5', name: 'LUXE_Mockup_v1.png', size: '22 MB', type: 'img', project: 'PJ-2024-005', customer: 'LUXE', date: '07 มิ.ย. 2567', category: 'mockup' },
  { id: '6', name: 'NaturePlus_Box_Artwork.pdf', size: '18 MB', type: 'pdf', project: 'PJ-2024-004', customer: 'NATURE PLUS', date: '06 มิ.ย. 2567', category: 'final' },
  { id: '7', name: 'QO-2569-0001.pdf', size: '0.8 MB', type: 'pdf', project: 'PJ-2024-001', customer: 'PERCARE', date: '04 มิ.ย. 2567', category: 'document' },
  { id: '8', name: 'JELLYS_Branding_Guide.pdf', size: '32 MB', type: 'pdf', project: 'PJ-2024-002', customer: 'JELLYS', date: '05 มิ.ย. 2567', category: 'final' },
]

const typeColors: Record<string, { bg: string; color: string; label: string }> = {
  ai: { bg: '#fff3e0', color: '#e65100', label: 'AI' },
  pdf: { bg: '#fce4ec', color: '#c62828', label: 'PDF' },
  psd: { bg: '#e3f2fd', color: '#1565c0', label: 'PSD' },
  doc: { bg: '#e8f5e9', color: '#2e7d32', label: 'DOC' },
  img: { bg: '#f3e5f5', color: '#6a1b9a', label: 'IMG' },
}

const categoryLabels: Record<string, string> = {
  all: 'ทั้งหมด',
  design: 'ไฟล์ออกแบบ',
  final: 'ไฟล์สำเร็จ',
  brief: 'บรีฟ',
  mockup: 'ม็อคอัพ',
  document: 'เอกสาร',
}

export default function FilesPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [view, setView] = useState<'grid' | 'list'>('list')

  const filtered = mockFiles.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.customer.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'all' || f.category === category
    return matchSearch && matchCat
  })

  const totalSize = '280 MB'

  return (
    <div style={{ padding: '32px', background: '#eef1f4', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#2f3b45', margin: 0 }}>ไฟล์งาน</h1>
          <p style={{ color: '#7a8893', margin: '4px 0 0', fontSize: 14 }}>{mockFiles.length} ไฟล์ · {totalSize}</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#5f7d99', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>upload</span>
          อัปโหลดไฟล์
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'ไฟล์ออกแบบ', count: 2, icon: 'brush', color: '#e65100', bg: '#fff3e0' },
          { label: 'ไฟล์สำเร็จ', count: 3, icon: 'check_circle', color: '#2e7d32', bg: '#e8f5e9' },
          { label: 'ม็อคอัพ', count: 1, icon: 'image', color: '#6a1b9a', bg: '#f3e5f5' },
          { label: 'เอกสาร', count: 2, icon: 'description', color: '#1565c0', bg: '#e3f2fd' },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: '#fff', borderRadius: 14, border: '1px solid #edf0f3', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 22, color: s.color }}>{s.icon}</span>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#2f3b45' }}>{s.count}</div>
              <div style={{ fontSize: 12, color: '#7a8893' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #edf0f3', padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, background: '#f7f9fb', borderRadius: 8, padding: '8px 14px' }}>
          <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#9aa7b2' }}>search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาไฟล์..."
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: '#2f3b45', width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              style={{
                padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                background: category === key ? '#5f7d99' : '#f0f3f6',
                color: category === key ? '#fff' : '#5f7d99',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 4, borderLeft: '1px solid #edf0f3', paddingLeft: 12 }}>
          {(['list', 'grid'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{ width: 34, height: 34, borderRadius: 7, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: view === v ? '#5f7d99' : 'transparent', color: view === v ? '#fff' : '#7a8893' }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>{v === 'list' ? 'view_list' : 'grid_view'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* File list */}
      {view === 'list' ? (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #edf0f3', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f7f9fb' }}>
                {['ชื่อไฟล์', 'โปรเจกต์', 'ลูกค้า', 'ขนาด', 'วันที่', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#7a8893', borderBottom: '1px solid #edf0f3' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((file, i) => {
                const tc = typeColors[file.type] || { bg: '#f0f3f6', color: '#5f7d99', label: file.type.toUpperCase() }
                return (
                  <tr key={file.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #edf0f3' : 'none' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: tc.color }}>{tc.label}</div>
                        <span style={{ fontSize: 14, fontWeight: 500, color: '#2f3b45' }}>{file.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#5f7d99' }}>{file.project}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#7a8893' }}>{file.customer}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#7a8893' }}>{file.size}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#7a8893' }}>{file.date}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #edf0f3', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#7a8893' }}>download</span>
                        </button>
                        <button style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #edf0f3', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#7a8893' }}>more_vert</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 48, color: '#9aa7b2' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>folder_open</span>
              ไม่พบไฟล์
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {filtered.map(file => {
            const tc = typeColors[file.type] || { bg: '#f0f3f6', color: '#5f7d99', label: file.type.toUpperCase() }
            return (
              <div key={file.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #edf0f3', padding: 16, cursor: 'pointer' }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: tc.color, marginBottom: 12 }}>{tc.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#2f3b45', marginBottom: 4, wordBreak: 'break-all' }}>{file.name}</div>
                <div style={{ fontSize: 11, color: '#9aa7b2' }}>{file.size} · {file.date}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

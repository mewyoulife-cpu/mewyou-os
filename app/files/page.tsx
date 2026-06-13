'use client'

import { useState } from 'react'

const mockFiles = [
  { name: 'LUXE_Label_v3.ai',         type: 'AI',  size: '8.2 MB',  project: 'PRJ-001', date: '20/05/68' },
  { name: 'GLOWME_Package.psd',        type: 'PSD', size: '124 MB',  project: 'PRJ-003', date: '18/05/68' },
  { name: 'PERCARE_Logo_Final.pdf',    type: 'PDF', size: '2.1 MB',  project: 'PRJ-007', date: '17/05/68' },
  { name: 'JELLYS_Label_Artwork.ai',   type: 'AI',  size: '6.7 MB',  project: 'PRJ-008', date: '15/05/68' },
  { name: 'NATURE_Box_v2.psd',         type: 'PSD', size: '89 MB',   project: 'PRJ-005', date: '14/05/68' },
  { name: 'Brand_Guidelines.pdf',      type: 'PDF', size: '4.3 MB',  project: 'PRJ-001', date: '10/05/68' },
]

const typeConfig: Record<string, { bg: string; color: string; icon: string }> = {
  AI:  { bg: '#fff0e6', color: '#f47a2a', icon: 'draw' },
  PSD: { bg: '#e6f3ff', color: '#2da0fb', icon: 'photo_size_select_large' },
  PDF: { bg: '#fde8e8', color: '#e54b4b', icon: 'picture_as_pdf' },
  PNG: { bg: '#e8f5ee', color: '#3d8a64', icon: 'image' },
  JPG: { bg: '#e8f5ee', color: '#3d8a64', icon: 'image' },
}

const PROJECT_CHIPS = ['ทั้งหมด', 'PRJ-001', 'PRJ-003', 'PRJ-005', 'PRJ-007', 'PRJ-008']
const TYPE_FILTER_CHIPS = ['ประเภทไฟล์ทั้งหมด', 'AI', 'PSD', 'PDF', 'PNG/JPG']

export default function FilesPage() {
  const [search, setSearch] = useState('')
  const [activeProject, setActiveProject] = useState('ทั้งหมด')
  const [activeType, setActiveType] = useState('ประเภทไฟล์ทั้งหมด')

  const filtered = mockFiles.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase())
    const matchProject = activeProject === 'ทั้งหมด' || f.project === activeProject
    const matchType = activeType === 'ประเภทไฟล์ทั้งหมด'
      || (activeType === 'PNG/JPG' ? (f.type === 'PNG' || f.type === 'JPG') : f.type === activeType)
    return matchSearch && matchProject && matchType
  })

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, margin: '16px 0 18px' }}>
        <div>
          <div style={{ fontSize: 23, fontWeight: 700, color: '#2f3b45' }}>ไฟล์ทั้งหมด</div>
          <div style={{ fontSize: 13.5, color: '#7a8893', marginTop: 2 }}>ไฟล์ออกแบบ · Artwork · PDF · รูปภาพ</div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          height: 42, padding: '0 18px', borderRadius: 11,
          background: '#5f7d99', color: '#fff',
          fontSize: 14, fontWeight: 600, cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(95,125,153,.3)',
        }}>
          <span className="material-symbols-rounded" style={{ fontSize: 20 }}>upload</span>
          อัปโหลดไฟล์
        </div>
      </div>

      {/* Search + filter row */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #edf0f3', padding: '14px 16px', marginBottom: 16 }}>
        {/* Search bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#f5f7fa', borderRadius: 10, padding: '9px 14px', marginBottom: 12 }}>
          <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#9aa7b2' }}>search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อไฟล์..."
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: '#2f3b45', width: '100%' }}
          />
        </div>

        {/* Type chips */}
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 9 }}>
          <div style={{ fontSize: 12, color: '#9aa7b2', fontWeight: 500, alignSelf: 'center', marginRight: 2 }}>ประเภทไฟล์</div>
          {TYPE_FILTER_CHIPS.map(chip => {
            const active = activeType === chip
            return (
              <div
                key={chip}
                onClick={() => setActiveType(chip)}
                style={{
                  padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
                  fontSize: 12.5, fontWeight: active ? 600 : 500,
                  background: active ? '#5f7d99' : '#f0f3f6',
                  color: active ? '#fff' : '#5b6b77',
                  transition: 'all .15s',
                }}
              >
                {chip}
              </div>
            )
          })}
        </div>

        {/* Project chips */}
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, color: '#9aa7b2', fontWeight: 500, alignSelf: 'center', marginRight: 2 }}>โปรเจกต์</div>
          {PROJECT_CHIPS.map(chip => {
            const active = activeProject === chip
            return (
              <div
                key={chip}
                onClick={() => setActiveProject(chip)}
                style={{
                  padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
                  fontSize: 12.5, fontWeight: active ? 600 : 500,
                  background: active ? '#5f7d99' : '#f0f3f6',
                  color: active ? '#fff' : '#5b6b77',
                  transition: 'all .15s',
                }}
              >
                {chip}
              </div>
            )
          })}
        </div>
      </div>

      {/* File grid */}
      {filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 56, textAlign: 'center', color: '#9aa7b2' }}>
          <span className="material-symbols-rounded" style={{ fontSize: 44, display: 'block', marginBottom: 10, color: '#d0d8e0' }}>folder_open</span>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#7a8893' }}>ไม่พบไฟล์</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
          {filtered.map((file, idx) => {
            const tc = typeConfig[file.type] || { bg: '#f0f3f6', color: '#5f7d99', icon: 'insert_drive_file' }
            return (
              <div
                key={idx}
                style={{
                  background: '#fff', borderRadius: 16, border: '1px solid #edf0f3',
                  padding: '18px 16px', cursor: 'pointer', transition: 'all .15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#bcd0df'
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 18px rgba(40,60,80,.08)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#edf0f3'
                  ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
                }}
              >
                {/* File type icon badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 11,
                    background: tc.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 24, color: tc.color }}>{tc.icon}</span>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: tc.color,
                    background: tc.bg, borderRadius: 6, padding: '3px 8px',
                    fontFamily: "'IBM Plex Sans', sans-serif",
                  }}>
                    {file.type}
                  </span>
                </div>

                {/* File name */}
                <div style={{ fontSize: 13, fontWeight: 600, color: '#2f3b45', marginBottom: 6, wordBreak: 'break-all', lineHeight: 1.4 }}>
                  {file.name}
                </div>

                {/* Meta */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#9aa7b2', marginBottom: 4 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 14 }}>data_usage</span>
                  {file.size}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#9aa7b2', marginBottom: 4 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 14 }}>folder</span>
                  {file.project}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#9aa7b2' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 14 }}>calendar_today</span>
                  {file.date}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

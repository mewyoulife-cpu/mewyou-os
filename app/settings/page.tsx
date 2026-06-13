'use client'

import { useState } from 'react'
import Link from 'next/link'

const NAV_ITEMS = [
  { key: 'studio',    label: 'ข้อมูลสตูดิโอ',    icon: 'store'           },
  { key: 'bank',      label: 'บัญชีธนาคาร',       icon: 'account_balance' },
  { key: 'documents', label: 'เอกสาร & เลขที่',   icon: 'article'         },
  { key: 'pricing',   label: 'ค่าบริการ',          icon: 'payments'        },
  { key: 'roles',     label: 'สิทธิ์การใช้งาน',   icon: 'shield'          },
]

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #e4e8ec',
  borderRadius: 9,
  height: 42,
  padding: '0 13px',
  fontFamily: 'inherit',
  fontSize: 14,
  color: '#2f3b45',
  outline: 'none',
  background: '#fff',
  boxSizing: 'border-box',
}

export default function SettingsPage() {
  const [activeNav, setActiveNav] = useState('studio')
  const [saved, setSaved] = useState(false)

  const [studio, setStudio] = useState({
    name: 'mew.you Design Studio',
    phone: '089-123-4567',
    email: 'hello@mewyou.design',
    website: 'www.mewyou.design',
    address: '123 ถ.สุขุมวิท แขวงคลองตัน เขตคลองเตย กรุงเทพฯ 10110',
  })

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ margin: '16px 0 22px' }}>
        <div style={{ fontSize: 23, fontWeight: 700, color: '#2f3b45' }}>ตั้งค่าระบบ</div>
        <div style={{ fontSize: 13.5, color: '#7a8893', marginTop: 2 }}>จัดการข้อมูลสตูดิโอ บัญชีธนาคาร และการตั้งค่าระบบ</div>
      </div>

      {/* Layout: sidebar + content */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        {/* Left sidebar */}
        <div style={{
          width: 210, flexShrink: 0,
          background: '#fff', borderRadius: 18, border: '1px solid #edf0f3',
          padding: '10px 8px',
        }}>
          {NAV_ITEMS.map(item => {
            const active = activeNav === item.key
            const isRoles = item.key === 'roles'
            const inner = (
              <div
                onClick={() => !isRoles && setActiveNav(item.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 14px', borderRadius: 11, cursor: 'pointer',
                  background: active ? '#eef3f7' : 'transparent',
                  color: active ? '#5f7d99' : '#5b6b77',
                  fontWeight: active ? 600 : 500,
                  fontSize: 13.5,
                  transition: 'all .15s',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLDivElement).style.background = '#f5f7fa'
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLDivElement).style.background = 'transparent'
                }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 20, color: active ? '#5f7d99' : '#9aa7b2' }}>{item.icon}</span>
                {item.label}
              </div>
            )

            if (isRoles) {
              return (
                <Link key={item.key} href="/settings/roles" style={{ textDecoration: 'none', display: 'block' }}>
                  {inner}
                </Link>
              )
            }
            return <div key={item.key}>{inner}</div>
          })}
        </div>

        {/* Right content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Studio info */}
          {activeNav === 'studio' && (
            <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#2f3b45', marginBottom: 20 }}>ข้อมูลสตูดิโอ</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Name */}
                <div>
                  <div style={{ fontSize: 12.5, color: '#7a8893', marginBottom: 6 }}>ชื่อสตูดิโอ</div>
                  <input
                    value={studio.name}
                    onChange={e => setStudio(p => ({ ...p, name: e.target.value }))}
                    placeholder="ชื่อสตูดิโอ"
                    style={inputStyle}
                  />
                </div>

                {/* Phone + Email row */}
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: 12.5, color: '#7a8893', marginBottom: 6 }}>เบอร์โทร</div>
                    <input
                      value={studio.phone}
                      onChange={e => setStudio(p => ({ ...p, phone: e.target.value }))}
                      placeholder="เบอร์โทรศัพท์"
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: 12.5, color: '#7a8893', marginBottom: 6 }}>อีเมล</div>
                    <input
                      value={studio.email}
                      onChange={e => setStudio(p => ({ ...p, email: e.target.value }))}
                      placeholder="อีเมล"
                      type="email"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Website */}
                <div>
                  <div style={{ fontSize: 12.5, color: '#7a8893', marginBottom: 6 }}>เว็บไซต์</div>
                  <input
                    value={studio.website}
                    onChange={e => setStudio(p => ({ ...p, website: e.target.value }))}
                    placeholder="www.example.com"
                    style={inputStyle}
                  />
                </div>

                {/* Address */}
                <div>
                  <div style={{ fontSize: 12.5, color: '#7a8893', marginBottom: 6 }}>ที่อยู่</div>
                  <textarea
                    value={studio.address}
                    onChange={e => setStudio(p => ({ ...p, address: e.target.value }))}
                    placeholder="ที่อยู่สตูดิโอ"
                    rows={3}
                    style={{
                      width: '100%', border: '1px solid #e4e8ec', borderRadius: 9,
                      padding: '10px 13px', fontFamily: 'inherit', fontSize: 14,
                      color: '#2f3b45', outline: 'none', resize: 'vertical',
                      background: '#fff', boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Save button */}
                <div style={{ paddingTop: 4 }}>
                  <div
                    onClick={handleSave}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      height: 42, padding: '0 22px', borderRadius: 11,
                      background: saved ? '#3d8a64' : '#5f7d99',
                      color: '#fff', fontSize: 14, fontWeight: 600,
                      cursor: 'pointer', transition: 'background .2s',
                      boxShadow: '0 4px 12px rgba(95,125,153,.3)',
                    }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 19 }}>{saved ? 'check' : 'save'}</span>
                    {saved ? 'บันทึกแล้ว!' : 'บันทึกข้อมูล'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bank */}
          {activeNav === 'bank' && (
            <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#2f3b45' }}>บัญชีธนาคาร</div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  height: 38, padding: '0 16px', borderRadius: 10,
                  background: '#5f7d99', color: '#fff',
                  fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
                }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 18 }}>add</span>
                  เพิ่มบัญชี
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: 40, color: '#9aa7b2' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 40, display: 'block', marginBottom: 10, color: '#d0d8e0' }}>account_balance</span>
                <div style={{ fontSize: 14, color: '#7a8893' }}>ยังไม่มีบัญชีธนาคาร</div>
              </div>
            </div>
          )}

          {/* Documents & numbering */}
          {activeNav === 'documents' && (
            <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#2f3b45', marginBottom: 20 }}>เอกสาร & เลขที่</div>
              <div style={{ textAlign: 'center', padding: 40, color: '#9aa7b2' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 40, display: 'block', marginBottom: 10, color: '#d0d8e0' }}>article</span>
                <div style={{ fontSize: 14, color: '#7a8893' }}>ตั้งค่ารูปแบบเลขที่เอกสาร</div>
              </div>
            </div>
          )}

          {/* Pricing */}
          {activeNav === 'pricing' && (
            <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#2f3b45', marginBottom: 20 }}>ค่าบริการ</div>
              <div style={{ textAlign: 'center', padding: 40, color: '#9aa7b2' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 40, display: 'block', marginBottom: 10, color: '#d0d8e0' }}>payments</span>
                <div style={{ fontSize: 14, color: '#7a8893' }}>ตั้งค่าราคาบริการมาตรฐาน</div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

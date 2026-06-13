'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Settings {
  companyName: string
  address: string
  taxId: string
  vatRate: number
  phone: string
  email: string
  logo?: string
}

interface BankAccount {
  id: string
  bank: string
  accountNo: string
  name: string
  logo?: string
  isDefault: boolean
}

const BANKS = ['กสิกรไทย (KBank)', 'ไทยพาณิชย์ (SCB)', 'กรุงเทพ (BBL)', 'กรุงไทย (KTB)', 'ทหารไทยธนชาต (TTB)', 'ออมสิน', 'พร้อมเพย์']

export default function SettingsPage() {
  const [tab, setTab] = useState<'company' | 'bank' | 'team'>('company')
  const [settings, setSettings] = useState<Settings>({ companyName: '', address: '', taxId: '', vatRate: 7, phone: '', email: '' })
  const [banks, setBanks] = useState<BankAccount[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showAddBank, setShowAddBank] = useState(false)
  const [newBank, setNewBank] = useState({ bank: BANKS[0], accountNo: '', name: '' })

  useEffect(() => {
    fetch('/api/banks').then(r => r.json()).then(setBanks).catch(() => {})
    // Assume settings API exists
    fetch('/api/settings').then(r => r.json()).then(data => {
      if (data && !data.error) setSettings(data)
    }).catch(() => {})
  }, [])

  async function saveSettings() {
    setSaving(true)
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) }).catch(() => {})
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function addBank() {
    if (!newBank.accountNo || !newBank.name) return
    const res = await fetch('/api/banks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newBank) })
    if (res.ok) {
      const b = await res.json()
      setBanks(prev => [...prev, b])
      setNewBank({ bank: BANKS[0], accountNo: '', name: '' })
      setShowAddBank(false)
    }
  }

  async function deleteBank(id: string) {
    await fetch(`/api/banks/${id}`, { method: 'DELETE' })
    setBanks(prev => prev.filter(b => b.id !== id))
  }

  async function setDefault(id: string) {
    await fetch(`/api/banks/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isDefault: true }) })
    setBanks(prev => prev.map(b => ({ ...b, isDefault: b.id === id })))
  }

  const teamMembers = [
    { name: 'คุณมิว', role: 'Owner', email: 'mewyoulife@gmail.com', avatar: 'M', color: '#5f7d99' },
    { name: 'คุณยู', role: 'Admin', email: 'you@mewyou.design', avatar: 'Y', color: '#3d8a64' },
    { name: 'คุณหนิง', role: 'Designer', email: 'ning@mewyou.design', avatar: 'N', color: '#e06b37' },
  ]

  return (
    <div style={{ padding: '32px', background: '#eef1f4', minHeight: '100vh' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#2f3b45', margin: 0 }}>ตั้งค่า</h1>
        <p style={{ color: '#7a8893', margin: '4px 0 0', fontSize: 14 }}>จัดการข้อมูลบริษัท บัญชีธนาคาร และทีมงาน</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: '#fff', borderRadius: 12, padding: 5, width: 'fit-content', marginBottom: 24, border: '1px solid #edf0f3' }}>
        {[
          { key: 'company', label: 'ข้อมูลบริษัท', icon: 'business' },
          { key: 'bank', label: 'บัญชีธนาคาร', icon: 'account_balance' },
          { key: 'team', label: 'ทีมงาน', icon: 'group' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500,
              background: tab === t.key ? '#5f7d99' : 'transparent',
              color: tab === t.key ? '#fff' : '#7a8893',
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Company Tab */}
      {tab === 'company' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#2f3b45', margin: '0 0 20px' }}>ข้อมูลบริษัท</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { key: 'companyName', label: 'ชื่อบริษัท', placeholder: 'mew.you Design Studio' },
                  { key: 'taxId', label: 'เลขภาษี (13 หลัก)', placeholder: '0105566012345' },
                  { key: 'phone', label: 'โทรศัพท์', placeholder: '02-xxx-xxxx' },
                  { key: 'email', label: 'อีเมล', placeholder: 'hello@mewyou.design' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#5f7d99', display: 'block', marginBottom: 6 }}>{f.label}</label>
                    <input
                      value={(settings as any)[f.key] || ''}
                      onChange={e => setSettings(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '1.5px solid #e5eaee', fontSize: 14, color: '#2f3b45', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#5f7d99', display: 'block', marginBottom: 6 }}>ที่อยู่</label>
                <textarea
                  value={settings.address}
                  onChange={e => setSettings(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 ถ.สุขุมวิท แขวงคลองตัน เขตคลองเตย กรุงเทพฯ 10110"
                  rows={3}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '1.5px solid #e5eaee', fontSize: 14, color: '#2f3b45', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#5f7d99', display: 'block', marginBottom: 6 }}>อัตรา VAT (%)</label>
                  <input
                    type="number"
                    value={settings.vatRate}
                    onChange={e => setSettings(prev => ({ ...prev, vatRate: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '1.5px solid #e5eaee', fontSize: 14, color: '#2f3b45', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={saveSettings}
              disabled={saving}
              style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, background: saved ? '#3d8a64' : '#5f7d99', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>{saved ? 'check' : 'save'}</span>
              {saved ? 'บันทึกแล้ว!' : saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
            </button>
          </div>

          {/* Logo preview */}
          <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 24, height: 'fit-content' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#2f3b45', margin: '0 0 20px' }}>โลโก้บริษัท</h3>
            <div style={{ width: '100%', paddingBottom: '60%', background: '#f7f9fb', borderRadius: 12, border: '2px dashed #d0d8df', position: 'relative', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 32, color: '#9aa7b2', marginBottom: 8 }}>add_photo_alternate</span>
                <span style={{ fontSize: 12, color: '#9aa7b2' }}>คลิกเพื่ออัปโหลดโลโก้</span>
              </div>
            </div>
            <button style={{ width: '100%', padding: '10px', borderRadius: 9, border: '1.5px solid #e5eaee', background: '#fff', color: '#5f7d99', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
              อัปโหลดโลโก้
            </button>
            <p style={{ fontSize: 11, color: '#9aa7b2', marginTop: 10, textAlign: 'center' }}>PNG, JPG ขนาดสูงสุด 5MB</p>
          </div>
        </div>
      )}

      {/* Bank Tab */}
      {tab === 'bank' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ color: '#7a8893', fontSize: 14, margin: 0 }}>บัญชีธนาคารสำหรับออกเอกสาร</p>
            <button
              onClick={() => setShowAddBank(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#5f7d99', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>add</span>
              เพิ่มบัญชี
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {banks.map(bank => (
              <div key={bank.id} style={{ background: '#fff', borderRadius: 14, border: bank.isDefault ? '2px solid #5f7d99' : '1px solid #edf0f3', padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 10, background: '#eef1f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 24, color: '#5f7d99' }}>account_balance</span>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#2f3b45' }}>{bank.bank}</span>
                      {bank.isDefault && <span style={{ fontSize: 11, background: '#e8eef4', color: '#5f7d99', padding: '2px 8px', borderRadius: 6, fontWeight: 500 }}>ค่าเริ่มต้น</span>}
                    </div>
                    <div style={{ fontSize: 13, color: '#7a8893' }}>{bank.accountNo} · {bank.name}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {!bank.isDefault && (
                    <button
                      onClick={() => setDefault(bank.id)}
                      style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #e5eaee', background: '#fff', color: '#5f7d99', cursor: 'pointer', fontSize: 13 }}
                    >
                      ตั้งเป็นค่าเริ่มต้น
                    </button>
                  )}
                  <button
                    onClick={() => deleteBank(bank.id)}
                    style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #fce4ec', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#e53935' }}>delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add bank modal */}
          {showAddBank && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: 420 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#2f3b45', margin: '0 0 20px' }}>เพิ่มบัญชีธนาคาร</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#5f7d99', display: 'block', marginBottom: 6 }}>ธนาคาร</label>
                    <select value={newBank.bank} onChange={e => setNewBank(p => ({ ...p, bank: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '1.5px solid #e5eaee', fontSize: 14, color: '#2f3b45', outline: 'none' }}>
                      {BANKS.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#5f7d99', display: 'block', marginBottom: 6 }}>เลขบัญชี</label>
                    <input value={newBank.accountNo} onChange={e => setNewBank(p => ({ ...p, accountNo: e.target.value }))} placeholder="xxx-x-xxxxx-x" style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '1.5px solid #e5eaee', fontSize: 14, color: '#2f3b45', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#5f7d99', display: 'block', marginBottom: 6 }}>ชื่อบัญชี</label>
                    <input value={newBank.name} onChange={e => setNewBank(p => ({ ...p, name: e.target.value }))} placeholder="บจก. มิวยู ดีไซน์" style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '1.5px solid #e5eaee', fontSize: 14, color: '#2f3b45', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                  <button onClick={() => setShowAddBank(false)} style={{ flex: 1, padding: '11px', borderRadius: 9, border: '1.5px solid #e5eaee', background: '#fff', color: '#7a8893', cursor: 'pointer', fontSize: 14 }}>ยกเลิก</button>
                  <button onClick={addBank} style={{ flex: 1, padding: '11px', borderRadius: 9, border: 'none', background: '#5f7d99', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>เพิ่มบัญชี</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Team Tab */}
      {tab === 'team' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ color: '#7a8893', fontSize: 14, margin: 0 }}>จัดการทีมและสิทธิ์การเข้าถึง</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <a href="/settings/roles" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, border: '1.5px solid #5f7d99', background: '#fff', color: '#5f7d99', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>shield</span>
                จัดการ Role
              </a>
              <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#5f7d99', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>person_add</span>
                เชิญสมาชิก
              </button>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', overflow: 'hidden' }}>
            {teamMembers.map((m, i) => (
              <div key={m.email} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: i < teamMembers.length - 1 ? '1px solid #edf0f3' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 46, height: 46, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff' }}>{m.avatar}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#2f3b45', marginBottom: 2 }}>{m.name}</div>
                    <div style={{ fontSize: 13, color: '#7a8893' }}>{m.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 13, background: '#e8eef4', color: '#5f7d99', padding: '5px 12px', borderRadius: 8, fontWeight: 500 }}>{m.role}</span>
                  {m.role !== 'Owner' && (
                    <button style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #edf0f3', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#7a8893' }}>more_vert</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

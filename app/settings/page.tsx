'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { applyBrand } from '@/components/BrandApplier'

interface Settings {
  companyName: string
  branch: string
  address: string
  province: string
  postalCode: string
  website: string
  taxId: string
  vatRate: number
  phone: string
  email: string
  logo: string | null
  ownerName: string
  position: string
  appName: string
  browserTitle: string
  metaDescription: string
  favicon: string | null
  brandLogo: string | null
}

interface Bank {
  id: string
  bank: string
  accountNo: string
  name: string
  logo: string | null
  isDefault: boolean
}

const NAV = [
  { key: 'profile', icon: 'person',          label: 'โปรไฟล์',         sub: 'บัญชีและข้อมูลส่วนตัว', target: 'set-profile' },
  { key: 'company', icon: 'business',         label: 'ข้อมูลบริษัท',     sub: 'ที่อยู่ เลขภาษี โลโก้',  target: 'set-company' },
  { key: 'brand',   icon: 'palette',          label: 'Brand Settings',  sub: 'โลโก้ Favicon ชื่อระบบ', target: 'set-brand' },
  { key: 'bank',    icon: 'account_balance',  label: 'บัญชีธนาคาร',      sub: 'บัญชีรับชำระเงิน',     target: 'set-bank' },
  { key: 'docs',    icon: 'description',      label: 'ค่าเริ่มต้นเอกสาร', sub: 'เลขที่ VAT เงื่อนไข',   target: 'set-company' },
  { key: 'team',    icon: 'group',            label: 'ทีมงาน',          sub: 'สมาชิกและสิทธิ์',      target: 'set-team' },
  { key: 'noti',    icon: 'notifications',    label: 'การแจ้งเตือน',     sub: 'อีเมล และ Line',       target: 'set-team' },
]

const setInput: React.CSSProperties = {
  width: '100%', border: '1px solid #e4e8ec', borderRadius: 10, height: 42,
  padding: '0 13px', fontFamily: 'inherit', fontSize: 14, color: '#2f3b45',
  outline: 'none', background: '#fff', boxSizing: 'border-box',
}
const fieldLabel: React.CSSProperties = { fontSize: 12.5, color: '#7a8893', marginBottom: 6 }
const card: React.CSSProperties = { background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 24 }
const cardTitle: React.CSSProperties = { fontSize: 16, fontWeight: 700, color: '#2f3b45', marginBottom: 18 }

function bankBrand(name: string): { color: string; icon: string } {
  const n = name || ''
  if (n.includes('กสิกร') || /kbank/i.test(n)) return { color: '#1aa84a', icon: 'eco' }
  if (n.includes('ไทยพาณิชย์') || /scb/i.test(n)) return { color: '#4e2a84', icon: 'savings' }
  if (n.includes('กรุงเทพ') || /bbl/i.test(n)) return { color: '#1e4598', icon: 'account_balance' }
  if (n.includes('พร้อมเพย์') || /promptpay/i.test(n)) return { color: '#0a3a6b', icon: 'qr_code_2' }
  if (n.includes('กรุงไทย') || /ktb/i.test(n)) return { color: '#00a4e4', icon: 'account_balance' }
  if (n.includes('กรุงศรี')) return { color: '#fdb913', icon: 'account_balance' }
  return { color: '#5f7d99', icon: 'account_balance' }
}

function fileToCompressedDataUrl(file: File, maxWidth?: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new window.Image()
      img.onload = () => {
        const maxW = maxWidth ?? 360
        const scale = Math.min(1, maxW / img.width)
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve(reader.result as string); return }
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Preview a brand asset on both a light and a dark background.
function BrandPreview({ src, size }: { src: string | null; size: number }) {
  const cell = (bg: string, label: string) => (
    <div style={{ flex: 1 }}>
      <div style={{ height: size + 24, borderRadius: 12, border: '1px solid #edf0f3', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="brand" style={{ maxWidth: size, maxHeight: size, objectFit: 'contain' }} />
        ) : (
          <span className="material-symbols-rounded" style={{ fontSize: 26, color: bg === '#2f3b45' ? '#5b6b77' : '#c8d4de' }}>image</span>
        )}
      </div>
      <div style={{ fontSize: 11, color: '#9aa7b2', textAlign: 'center', marginTop: 4 }}>{label}</div>
    </div>
  )
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {cell('#ffffff', 'Light')}
      {cell('#2f3b45', 'Dark')}
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const [activeNav, setActiveNav] = useState('profile')
  const [settings, setSettings] = useState<Settings>({
    companyName: '', branch: '', address: '', province: '', postalCode: '', website: '', taxId: '', vatRate: 7, phone: '', email: '', logo: null, ownerName: '', position: '',
    appName: 'Mewyou Design OS', browserTitle: 'Mewyou Design OS', metaDescription: '', favicon: null, brandLogo: null,
  })
  const [banks, setBanks] = useState<Bank[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [bankModal, setBankModal] = useState<Bank | 'new' | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)

  function loadSettings() {
    fetch('/api/settings').then(r => r.json()).then((s: Partial<Settings>) => {
      setSettings(prev => ({
        ...prev,
        companyName: s.companyName ?? '',
        branch: s.branch ?? '',
        address: s.address ?? '',
        province: s.province ?? '',
        postalCode: s.postalCode ?? '',
        website: s.website ?? '',
        taxId: s.taxId ?? '',
        vatRate: s.vatRate ?? 7,
        phone: s.phone ?? '',
        email: s.email ?? '',
        logo: s.logo ?? null,
        ownerName: s.ownerName ?? 'Mewyou Studio',
        position: s.position ?? 'Owner · Admin',
        appName: s.appName ?? 'Mewyou Design OS',
        browserTitle: s.browserTitle ?? 'Mewyou Design OS',
        metaDescription: s.metaDescription ?? '',
        favicon: s.favicon ?? null,
        brandLogo: s.brandLogo ?? null,
      }))
    }).catch(() => {})
  }
  function loadBanks() {
    fetch('/api/banks').then(r => r.json()).then(d => setBanks(Array.isArray(d) ? d : [])).catch(() => {})
  }

  useEffect(() => { loadSettings(); loadBanks() }, [])

  function setS(key: keyof Settings, value: unknown) {
    setSettings(s => ({ ...s, [key]: value }))
  }

  function navTo(item: typeof NAV[number]) {
    setActiveNav(item.key)
    document.getElementById(item.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function handleSaveSettings() {
    setSaving(true)
    setSaved(false)
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: settings.companyName,
          branch: settings.branch,
          address: settings.address,
          province: settings.province,
          postalCode: settings.postalCode,
          website: settings.website,
          taxId: settings.taxId,
          vatRate: Number(settings.vatRate) || 0,
          phone: settings.phone,
          email: settings.email,
          logo: settings.logo,
          ownerName: settings.ownerName,
          position: settings.position,
          appName: settings.appName,
          browserTitle: settings.browserTitle,
          metaDescription: settings.metaDescription,
          favicon: settings.favicon,
          brandLogo: settings.brandLogo,
        }),
      })
      // Reflect branding on the live browser tab immediately.
      applyBrand({ browserTitle: settings.browserTitle, favicon: settings.favicon })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  // Favicon / logo upload: SVG and ICO are stored as-is; raster images are
  // compressed to a 512px square data URL.
  async function brandFile(e: React.ChangeEvent<HTMLInputElement>, field: 'favicon' | 'brandLogo') {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const isVector = /svg|icon|ico/i.test(file.type) || /\.(svg|ico)$/i.test(file.name)
    if (isVector) {
      const reader = new FileReader()
      reader.onload = () => setS(field, String(reader.result))
      reader.readAsDataURL(file)
    } else {
      setS(field, await fileToCompressedDataUrl(file, 512))
    }
  }

  async function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setS('logo', await fileToCompressedDataUrl(file))
  }

  async function handleBankLogo(bank: Bank, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const logo = await fileToCompressedDataUrl(file)
    setBanks(prev => prev.map(b => b.id === bank.id ? { ...b, logo } : b))
    await fetch(`/api/banks/${bank.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ logo }) })
  }

  const avatarInitial = (settings.ownerName || 'M').slice(0, 1).toUpperCase()

  return (
    <div>
      {/* Header */}
      <div style={{ margin: '16px 0 18px' }}>
        <div style={{ fontSize: 23, fontWeight: 700, color: '#2f3b45' }}>ตั้งค่า</div>
        <div style={{ fontSize: 13.5, color: '#7a8893', marginTop: 2 }}>จัดการบัญชี ข้อมูลบริษัท และค่าเริ่มต้นของระบบ</div>
      </div>

      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
        {/* Left nav */}
        <div style={{ width: 248, flexShrink: 0, background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', padding: 12, position: 'sticky', top: 6 }}>
          {NAV.map(n => {
            const active = activeNav === n.key
            return (
              <div key={n.key} onClick={() => navTo(n)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, cursor: 'pointer', background: active ? '#eef3f7' : 'transparent', marginBottom: 2 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? '#5f7d99' : '#f5f7f9' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 20, color: active ? '#fff' : '#8a97a2' }}>{n.icon}</span>
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: active ? '#2f3b45' : '#5b6b77' }}>{n.label}</div>
                  <div style={{ fontSize: 12, color: '#9aa7b2', marginTop: 1 }}>{n.sub}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right content */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* โปรไฟล์ */}
          <div id="set-profile" style={{ ...card, scrollMarginTop: 12 }}>
            <div style={cardTitle}>โปรไฟล์</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: settings.logo ? '#eef1f4' : 'linear-gradient(135deg,#cdd9e3,#a9bccd)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#54697d', fontSize: 24, fontFamily: "'IBM Plex Sans', sans-serif", overflow: 'hidden', flexShrink: 0 }}>
                {settings.logo
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={settings.logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : avatarInitial}
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 15px', border: '1px solid #e4e8ec', borderRadius: 10, fontSize: 13.5, color: '#5b6b77', fontWeight: 500, cursor: 'pointer' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>photo_camera</span>เปลี่ยนรูป
                <input type="file" accept="image/*" onChange={handleAvatarFile} style={{ display: 'none' }} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}><div style={fieldLabel}>ชื่อ-นามสกุล</div><input value={settings.ownerName} onChange={e => setS('ownerName', e.target.value)} style={setInput} /></div>
              <div style={{ flex: 1, minWidth: 200 }}><div style={fieldLabel}>ตำแหน่ง</div><input value={settings.position} onChange={e => setS('position', e.target.value)} style={setInput} /></div>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 14 }}>
              <div style={{ flex: 1, minWidth: 200 }}><div style={fieldLabel}>อีเมล</div><input value={settings.email} onChange={e => setS('email', e.target.value)} style={setInput} /></div>
              <div style={{ flex: 1, minWidth: 200 }}><div style={fieldLabel}>เบอร์โทร</div><input value={settings.phone} onChange={e => setS('phone', e.target.value)} style={setInput} /></div>
            </div>
          </div>

          {/* ข้อมูลบริษัท */}
          <div id="set-company" style={{ ...card, scrollMarginTop: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#2f3b45', marginBottom: 6 }}>ข้อมูลบริษัท</div>
            <div style={{ fontSize: 12.5, color: '#9aa7b2', marginBottom: 18 }}>ข้อมูลนี้จะแสดงบนหัวเอกสารทุกฉบับ</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
              <div style={{ flex: 2, minWidth: 240 }}><div style={fieldLabel}>ชื่อบริษัท</div><input value={settings.companyName} onChange={e => setS('companyName', e.target.value)} style={setInput} /></div>
              <div style={{ flex: 1, minWidth: 160 }}><div style={fieldLabel}>สาขา</div><input value={settings.branch} onChange={e => setS('branch', e.target.value)} placeholder="สำนักงานใหญ่ / สาขา" style={setInput} /></div>
            </div>
            <div style={{ marginBottom: 14 }}><div style={fieldLabel}>ที่อยู่</div><input value={settings.address} onChange={e => setS('address', e.target.value)} placeholder="บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ" style={setInput} /></div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
              <div style={{ flex: 1, minWidth: 200 }}><div style={fieldLabel}>จังหวัด</div><input value={settings.province} onChange={e => setS('province', e.target.value)} style={setInput} /></div>
              <div style={{ flex: 1, minWidth: 200 }}><div style={fieldLabel}>รหัสไปรษณีย์</div><input value={settings.postalCode} onChange={e => setS('postalCode', e.target.value)} style={setInput} /></div>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
              <div style={{ flex: 1, minWidth: 200 }}><div style={fieldLabel}>เลขประจำตัวผู้เสียภาษี</div><input value={settings.taxId} onChange={e => setS('taxId', e.target.value)} style={setInput} /></div>
              <div style={{ flex: 1, minWidth: 200 }}><div style={fieldLabel}>อัตราภาษีมูลค่าเพิ่ม (%)</div><input type="number" value={settings.vatRate} onChange={e => setS('vatRate', Number(e.target.value))} style={setInput} /></div>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}><div style={fieldLabel}>เบอร์โทรศัพท์</div><input value={settings.phone} onChange={e => setS('phone', e.target.value)} style={setInput} /></div>
              <div style={{ flex: 1, minWidth: 200 }}><div style={fieldLabel}>เว็บไซต์ / Line</div><input value={settings.website} onChange={e => setS('website', e.target.value)} placeholder="www.example.com หรือ @lineid" style={setInput} /></div>
            </div>
          </div>

          {/* Brand Settings */}
          <div id="set-brand" style={{ ...card, scrollMarginTop: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#2f3b45', marginBottom: 6 }}>Brand Settings</div>
            <div style={{ fontSize: 12.5, color: '#9aa7b2', marginBottom: 18 }}>ปรับแต่งโลโก้ Favicon ชื่อระบบ และข้อมูลที่แสดงบนแท็บเบราว์เซอร์</div>

            <div style={{ marginBottom: 14 }}><div style={fieldLabel}>ชื่อระบบ (Application Name)</div><input value={settings.appName} onChange={e => setS('appName', e.target.value)} style={setInput} /></div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
              <div style={{ flex: 1, minWidth: 220 }}><div style={fieldLabel}>Browser Title</div><input value={settings.browserTitle} onChange={e => setS('browserTitle', e.target.value)} style={setInput} /></div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <div style={fieldLabel}>Meta Description</div>
              <textarea value={settings.metaDescription} onChange={e => setS('metaDescription', e.target.value)} placeholder="คำอธิบายระบบสำหรับ SEO / การแชร์ลิงก์" style={{ ...setInput, height: 'auto', minHeight: 64, padding: '10px 13px', resize: 'vertical', lineHeight: 1.5 }} />
            </div>

            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              {/* Favicon */}
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={fieldLabel}>Favicon (ไอคอนบนแท็บ)</div>
                <BrandPreview src={settings.favicon} size={48} />
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, height: 36, padding: '0 14px', border: '1px solid #e4e8ec', borderRadius: 10, fontSize: 13, color: '#5b6b77', fontWeight: 500, cursor: 'pointer' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 18 }}>upload</span>อัปโหลด Favicon
                  <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/x-icon,.ico,.svg" onChange={e => brandFile(e, 'favicon')} style={{ display: 'none' }} />
                </label>
                <div style={{ fontSize: 11.5, color: '#9aa7b2', marginTop: 6 }}>PNG, JPG, SVG, ICO · แนะนำ 512×512px</div>
              </div>
              {/* Main Logo */}
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={fieldLabel}>Logo หลักของระบบ</div>
                <BrandPreview src={settings.brandLogo} size={120} />
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, height: 36, padding: '0 14px', border: '1px solid #e4e8ec', borderRadius: 10, fontSize: 13, color: '#5b6b77', fontWeight: 500, cursor: 'pointer' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 18 }}>upload</span>อัปโหลดโลโก้
                  <input type="file" accept="image/png,image/jpeg,image/svg+xml,.svg" onChange={e => brandFile(e, 'brandLogo')} style={{ display: 'none' }} />
                </label>
                <div style={{ fontSize: 11.5, color: '#9aa7b2', marginTop: 6 }}>PNG, JPG, SVG · พื้นใส (transparent) แนะนำ</div>
              </div>
            </div>
          </div>

          {/* บัญชีธนาคาร */}
          <div id="set-bank" style={{ ...card, scrollMarginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#2f3b45' }}>บัญชีธนาคาร</div>
              <div onClick={() => setBankModal('new')} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', borderRadius: 10, background: '#5f7d99', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 17 }}>add</span>เพิ่มบัญชี
              </div>
            </div>
            {banks.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9aa7b2', padding: '24px 0', fontSize: 13.5 }}>ยังไม่มีบัญชีธนาคาร · กด &quot;เพิ่มบัญชี&quot;</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {banks.map(b => {
                  const brand = bankBrand(b.bank)
                  return (
                    <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: 13, border: '1px solid #f0f2f5', borderRadius: 12 }}>
                      <label style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 11, background: b.logo ? '#eef1f4' : brand.color, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {b.logo
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={b.logo} alt={b.bank} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span className="material-symbols-rounded" style={{ fontSize: 21, color: '#fff' }}>{brand.icon}</span>}
                        </div>
                        <div style={{ position: 'absolute', bottom: -3, right: -3, width: 18, height: 18, borderRadius: 6, background: '#5f7d99', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-symbols-rounded" style={{ fontSize: 11, color: '#fff' }}>photo_camera</span>
                        </div>
                        <input type="file" accept="image/*" onChange={e => handleBankLogo(b, e)} style={{ display: 'none' }} />
                      </label>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#2f3b45' }}>{b.bank}</span>
                          {b.isDefault && <span style={{ background: '#e6f2ec', color: '#3d8a64', fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>หลัก</span>}
                        </div>
                        <div style={{ fontSize: 13, color: '#7a8893', fontFamily: "'IBM Plex Sans', sans-serif", marginTop: 1 }}>{b.accountNo} · {b.name}</div>
                      </div>
                      <span onClick={() => setBankModal(b)} className="material-symbols-rounded" style={{ fontSize: 20, color: '#c3cdd6', cursor: 'pointer' }}>edit</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ทีมงาน */}
          <div id="set-team" style={{ ...card, scrollMarginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#2f3b45' }}>ทีมงาน</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div onClick={() => router.push('/settings/roles')} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', border: '1px solid #e4e8ec', borderRadius: 10, fontSize: 13, color: '#5b6b77', fontWeight: 600, cursor: 'pointer' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 17 }}>admin_panel_settings</span>จัดการสิทธิ์ &amp; Role
                </div>
                <div onClick={() => setInviteOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', border: '1px solid #e4e8ec', borderRadius: 10, fontSize: 13, color: '#5b6b77', fontWeight: 600, cursor: 'pointer' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 17 }}>person_add</span>เชิญสมาชิก
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#cdd9e3,#a9bccd)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#54697d', fontSize: 15, fontFamily: "'IBM Plex Sans', sans-serif", flexShrink: 0 }}>{avatarInitial}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#2f3b45' }}>{settings.ownerName || 'Mewyou Studio'}</div>
                  <div style={{ fontSize: 12.5, color: '#9aa7b2' }}>{settings.position || 'Owner · Admin'}</div>
                </div>
                <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#c3cdd6', cursor: 'pointer' }}>more_vert</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <div onClick={loadSettings} style={{ display: 'flex', alignItems: 'center', height: 44, padding: '0 20px', border: '1px solid #e4e8ec', borderRadius: 11, fontSize: 14, color: '#5b6b77', fontWeight: 500, cursor: 'pointer', background: '#fff' }}>ยกเลิก</div>
            <div onClick={handleSaveSettings} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 44, padding: '0 22px', borderRadius: 11, background: saved ? '#3d8a64' : '#5f7d99', color: '#fff', fontSize: 14, fontWeight: 600, cursor: saving ? 'wait' : 'pointer', boxShadow: '0 4px 12px rgba(95,125,153,.3)' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 19 }}>{saved ? 'check_circle' : 'save'}</span>
              {saving ? 'กำลังบันทึก...' : saved ? 'บันทึกแล้ว' : 'บันทึกการเปลี่ยนแปลง'}
            </div>
          </div>
        </div>
      </div>

      {bankModal && (
        <BankModal
          bank={bankModal === 'new' ? null : bankModal}
          onClose={() => setBankModal(null)}
          onSaved={() => { setBankModal(null); loadBanks() }}
        />
      )}

      {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} />}
    </div>
  )
}

function BankModal({ bank, onClose, onSaved }: { bank: Bank | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(bank?.bank || '')
  const [accountNo, setAccountNo] = useState(bank?.accountNo || '')
  const [holder, setHolder] = useState(bank?.name || '')
  const [isDefault, setIsDefault] = useState(bank?.isDefault || false)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const body = { bank: name, accountNo, name: holder, isDefault }
      if (bank) {
        await fetch(`/api/banks/${bank.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      } else {
        await fetch('/api/banks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      }
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!bank) return
    if (!confirm(`ลบบัญชี ${bank.bank} ?`)) return
    setSaving(true)
    try {
      await fetch(`/api/banks/${bank.id}`, { method: 'DELETE' })
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(40,55,70,.32)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 440, maxWidth: '100%', background: '#fff', borderRadius: 18, boxShadow: '0 24px 60px rgba(30,45,60,.28)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #f0f2f5' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#2f3b45' }}>{bank ? 'แก้ไขบัญชีธนาคาร' : 'เพิ่มบัญชีธนาคาร'}</div>
          <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#9aa7b2' }}>close</span>
          </div>
        </div>
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><div style={fieldLabel}>ธนาคาร</div><input value={name} onChange={e => setName(e.target.value)} placeholder="เช่น ธนาคารกสิกรไทย" style={setInput} /></div>
          <div><div style={fieldLabel}>เลขที่บัญชี</div><input value={accountNo} onChange={e => setAccountNo(e.target.value)} placeholder="xxx-x-xxxxx-x" style={setInput} /></div>
          <div><div style={fieldLabel}>ชื่อบัญชี</div><input value={holder} onChange={e => setHolder(e.target.value)} placeholder="ชื่อบัญชี" style={setInput} /></div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#5f7d99', cursor: 'pointer' }} />
            <span style={{ fontSize: 13.5, color: '#5b6b77' }}>ตั้งเป็นบัญชีหลัก</span>
          </label>
          <div style={{ display: 'flex', gap: 9, marginTop: 4 }}>
            {bank && (
              <button onClick={remove} disabled={saving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, padding: '0 16px', border: '1px solid #f0d4cc', borderRadius: 11, background: '#fff', color: '#c4593f', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>delete</span>ลบ
              </button>
            )}
            <button onClick={save} disabled={saving || !name.trim()} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 44, borderRadius: 11, background: !name.trim() ? '#c8d4de' : '#5f7d99', color: '#fff', fontSize: 14, fontWeight: 600, cursor: saving || !name.trim() ? 'not-allowed' : 'pointer', border: 'none', fontFamily: 'inherit' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>check</span>{saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(40,55,70,.32)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 420, maxWidth: '100%', background: '#fff', borderRadius: 18, boxShadow: '0 24px 60px rgba(30,45,60,.28)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #f0f2f5' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#2f3b45' }}>เชิญสมาชิก</div>
          <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#9aa7b2' }}>close</span>
          </div>
        </div>
        <div style={{ padding: '20px 22px' }}>
          {sent ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '14px 0', color: '#3d8a64' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 40 }}>mark_email_read</span>
              <div style={{ fontSize: 14, fontWeight: 600 }}>ส่งคำเชิญไปยัง {email} แล้ว</div>
            </div>
          ) : (
            <>
              <div style={fieldLabel}>อีเมลผู้ที่ต้องการเชิญ</div>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" style={setInput} />
              <button onClick={() => email.includes('@') && setSent(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 44, borderRadius: 11, background: '#5f7d99', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', marginTop: 14, fontFamily: 'inherit' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>send</span>ส่งคำเชิญ
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'

const PERMISSIONS = [
  { group: 'โปรเจกต์', items: [
    { key: 'projects.view', label: 'ดูโปรเจกต์' },
    { key: 'projects.create', label: 'สร้างโปรเจกต์' },
    { key: 'projects.edit', label: 'แก้ไขโปรเจกต์' },
    { key: 'projects.delete', label: 'ลบโปรเจกต์' },
    { key: 'projects.changeStatus', label: 'เปลี่ยนสถานะ' },
  ]},
  { group: 'ลูกค้า', items: [
    { key: 'customers.view', label: 'ดูลูกค้า' },
    { key: 'customers.create', label: 'เพิ่มลูกค้า' },
    { key: 'customers.edit', label: 'แก้ไขลูกค้า' },
    { key: 'customers.delete', label: 'ลบลูกค้า' },
  ]},
  { group: 'เอกสาร', items: [
    { key: 'docs.viewQuotation', label: 'ดูใบเสนอราคา' },
    { key: 'docs.createQuotation', label: 'สร้างใบเสนอราคา' },
    { key: 'docs.viewInvoice', label: 'ดูใบแจ้งหนี้' },
    { key: 'docs.createInvoice', label: 'สร้างใบแจ้งหนี้' },
    { key: 'docs.viewReceipt', label: 'ดูใบเสร็จ' },
    { key: 'docs.createReceipt', label: 'สร้างใบเสร็จ' },
  ]},
  { group: 'การเงิน', items: [
    { key: 'finance.view', label: 'ดูภาพรวมการเงิน' },
    { key: 'finance.viewExpenses', label: 'ดูค่าใช้จ่าย' },
    { key: 'finance.addExpense', label: 'บันทึกค่าใช้จ่าย' },
    { key: 'finance.viewRevenue', label: 'ดูรายได้' },
  ]},
  { group: 'การตั้งค่า', items: [
    { key: 'settings.company', label: 'แก้ไขข้อมูลบริษัท' },
    { key: 'settings.bank', label: 'จัดการบัญชีธนาคาร' },
    { key: 'settings.team', label: 'จัดการทีม' },
    { key: 'settings.roles', label: 'จัดการ Role' },
  ]},
]

type RoleKey = 'owner' | 'admin' | 'designer' | 'viewer'

const ROLES: { key: RoleKey; label: string; color: string; bg: string; description: string }[] = [
  { key: 'owner', label: 'Owner', color: '#c62828', bg: '#fce4ec', description: 'เจ้าของระบบ ทำได้ทุกอย่าง' },
  { key: 'admin', label: 'Admin', color: '#1565c0', bg: '#e3f2fd', description: 'ผู้ดูแลระบบ ทำได้เกือบทุกอย่าง' },
  { key: 'designer', label: 'Designer', color: '#2e7d32', bg: '#e8f5e9', description: 'ดูและแก้ไขงานออกแบบ' },
  { key: 'viewer', label: 'Viewer', color: '#5f7d99', bg: '#e8eef4', description: 'ดูข้อมูลได้อย่างเดียว' },
]

const DEFAULT_PERMISSIONS: Record<RoleKey, Record<string, boolean>> = {
  owner: Object.fromEntries(PERMISSIONS.flatMap(g => g.items.map(p => [p.key, true]))),
  admin: Object.fromEntries(PERMISSIONS.flatMap(g => g.items.map(p => [p.key, !p.key.includes('settings.roles')]))),
  designer: Object.fromEntries(PERMISSIONS.flatMap(g => g.items.map(p => [
    p.key,
    ['projects.view', 'projects.edit', 'projects.changeStatus', 'customers.view', 'docs.viewQuotation', 'docs.viewInvoice', 'docs.viewReceipt'].includes(p.key)
  ]))),
  viewer: Object.fromEntries(PERMISSIONS.flatMap(g => g.items.map(p => [
    p.key,
    p.key.endsWith('.view') || p.key.includes('view')
  ]))),
}

export default function RolesPage() {
  const [selected, setSelected] = useState<RoleKey>('admin')
  const [perms, setPerms] = useState(DEFAULT_PERMISSIONS)
  const [saved, setSaved] = useState(false)

  function toggle(key: string) {
    if (selected === 'owner') return
    setPerms(prev => ({
      ...prev,
      [selected]: { ...prev[selected], [key]: !prev[selected][key] }
    }))
  }

  function save() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const currentRole = ROLES.find(r => r.key === selected)!
  const currentPerms = perms[selected]

  return (
    <div style={{ padding: '32px', background: '#eef1f4', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <Link href="/settings" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#7a8893', textDecoration: 'none', fontSize: 14 }}>
          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>arrow_back</span>
          ตั้งค่า
        </Link>
        <span style={{ color: '#d0d8df' }}>/</span>
        <span style={{ fontSize: 14, color: '#2f3b45' }}>สิทธิ์การเข้าถึง</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#2f3b45', margin: 0 }}>จัดการ Role & สิทธิ์</h1>
          <p style={{ color: '#7a8893', margin: '4px 0 0', fontSize: 14 }}>กำหนดสิทธิ์การเข้าถึงของแต่ละ Role</p>
        </div>
        <button
          onClick={save}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: saved ? '#3d8a64' : '#5f7d99', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 22px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>{saved ? 'check' : 'save'}</span>
          {saved ? 'บันทึกแล้ว!' : 'บันทึก'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
        {/* Role list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ROLES.map(role => (
            <button
              key={role.key}
              onClick={() => setSelected(role.key)}
              style={{
                background: selected === role.key ? '#fff' : '#fff',
                border: selected === role.key ? '2px solid #5f7d99' : '1px solid #edf0f3',
                borderRadius: 14, padding: '16px 18px', cursor: 'pointer', textAlign: 'left',
                boxShadow: selected === role.key ? '0 2px 12px rgba(95,125,153,0.15)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, background: role.bg, color: role.color, padding: '3px 10px', borderRadius: 6 }}>{role.label}</span>
              </div>
              <div style={{ fontSize: 12, color: '#7a8893' }}>{role.description}</div>
              <div style={{ fontSize: 11, color: '#9aa7b2', marginTop: 4 }}>
                {Object.values(perms[role.key]).filter(Boolean).length} สิทธิ์
              </div>
            </button>
          ))}
        </div>

        {/* Permission matrix */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf0f3', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #edf0f3', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 700, background: currentRole.bg, color: currentRole.color, padding: '4px 14px', borderRadius: 8 }}>{currentRole.label}</span>
            <span style={{ fontSize: 14, color: '#7a8893' }}>{currentRole.description}</span>
            {selected === 'owner' && <span style={{ fontSize: 12, color: '#9aa7b2', marginLeft: 'auto' }}>Owner มีสิทธิ์ทุกอย่าง ไม่สามารถแก้ไขได้</span>}
          </div>

          {PERMISSIONS.map(group => (
            <div key={group.group} style={{ borderBottom: '1px solid #edf0f3' }}>
              <div style={{ padding: '12px 24px 8px', fontSize: 12, fontWeight: 700, color: '#9aa7b2', textTransform: 'uppercase', letterSpacing: 1 }}>{group.group}</div>
              {group.items.map(perm => (
                <div key={perm.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 24px', borderTop: '1px solid #f7f9fb' }}>
                  <span style={{ fontSize: 14, color: '#2f3b45' }}>{perm.label}</span>
                  <button
                    onClick={() => toggle(perm.key)}
                    disabled={selected === 'owner'}
                    style={{
                      width: 44, height: 24, borderRadius: 12, border: 'none', cursor: selected === 'owner' ? 'default' : 'pointer',
                      background: currentPerms[perm.key] ? '#5f7d99' : '#d0d8df',
                      position: 'relative', transition: 'background 0.2s',
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', background: '#fff',
                      position: 'absolute', top: 3,
                      left: currentPerms[perm.key] ? 23 : 3,
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

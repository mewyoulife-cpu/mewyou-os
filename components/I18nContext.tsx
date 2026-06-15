'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type Lang = 'th' | 'en'

// Thai -> English dictionary. t('ไทย') returns the English string when the
// language is EN, otherwise returns the original Thai. Keys are the Thai source
// strings so usages stay readable.
const EN: Record<string, string> = {
  // Sidebar
  'หน้าหลัก': 'Home',
  'จุดเงินรั่ว': 'Leaks',
  'ออกจากระบบ': 'Log out',
  'ออกจากระบบ?': 'Log out?',
  // Header
  'ค้นหาโปรเจกต์, ลูกค้า, เลขที่เอกสาร...': 'Search projects, clients, doc no...',
  'สร้างใหม่': 'Create',
  'โหมดปกติ': 'Normal mode',
  'โหมด Glassmorphism': 'Glassmorphism mode',
  // Dashboard — greeting
  'สวัสดี': 'Hi',
  'ยินดีต้อนรับเข้าสู่ระบบ Mewyou Design OS': 'Welcome to Mewyou Design OS',
  'กำลังโหลดข้อมูล...': 'Loading...',
  // KPI cards
  'โปรเจกต์ทั้งหมด': 'All Projects',
  'กำลังรอออกแบบ': 'In Design',
  'งานเสร็จสิ้นแล้ว': 'Completed',
  'ยอดขายรวม': 'Total Sales',
  'ยอดค้างชำระ': 'Outstanding',
  'โปรเจกต์': 'projects',
  'จากช่วงก่อนหน้า': 'vs previous',
  // Section titles
  'ภาพรวมโปรเจกต์': 'Projects Overview',
  'ยอดขาย': 'Sales',
  'โปรเจกต์ล่าสุด': 'Recent Projects',
  'ดูทั้งหมด': 'View all',
  'บาท': 'THB',
  // Table headers
  'รหัสโปรเจกต์': 'Code',
  'ชื่อลูกค้า': 'Client',
  'ประเภท': 'Type',
  'สถานะ': 'Status',
  'ความคืบหน้า': 'Progress',
  'กำหนดส่ง': 'Due',
  'มูลค่า': 'Value',
  'ไม่มีโปรเจกต์ในช่วงวันที่นี้': 'No projects in this range',
  // Donut / status labels
  'ออกแบบ': 'Design',
  'ผลิต': 'Production',
  'รออนุมัติ': 'Approval',
  'รอผลิต': 'Pre-production',
  'รอส่งมอบ': 'Delivery',
  'เสร็จสิ้น': 'Done',
  // Right column widgets
  'ใบกำกับภาษีรอส่ง': 'Tax invoices to send',
  'ออกแล้วแต่ยังไม่ได้ส่งให้ลูกค้า · รวม': 'Issued but not yet sent · total',
  'รายการ': 'items',
  'ปฏิทินงานวันนี้': "Today's schedule",
  'ภารกิจที่ต้องทำ': 'Tasks to do',
  'กิจกรรมล่าสุด': 'Recent activity',
  'สิ่งที่ต้องทำก่อน · 5 อันดับด่วนสุด': 'Top priorities · 5 most urgent',
  'คำนวณจากเงินที่กำลังรั่ว × ความเร่งด่วน': 'Ranked by leaking money × urgency',
  'ไม่มีงานเร่งด่วน': 'No urgent tasks',
  'ไม่มีเอกสารรอส่ง': 'Nothing to send',
  'ไม่มีนัดหมายวันนี้': 'No appointments today',
  'ยังไม่มีกิจกรรม': 'No activity yet',
  // Date-range filter
  'วันนี้': 'Today',
  'เมื่อวาน': 'Yesterday',
  '7 วันล่าสุด': 'Last 7 days',
  '30 วันล่าสุด': 'Last 30 days',
  'เดือนนี้': 'This month',
  'เดือนก่อน': 'Last month',
  'ไตรมาสนี้': 'This quarter',
  'ปีนี้': 'This year',
  'กำหนดเอง': 'Custom',
  'ตั้งแต่วันที่': 'From',
  'ถึงวันที่': 'To',
  'ใช้ช่วงวันที่นี้': 'Apply range',
}

const I18nCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (s: string) => string }>({
  lang: 'th',
  setLang: () => {},
  t: (s) => s,
})

export function useI18n() {
  return useContext(I18nCtx)
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('th')

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from persisted storage
      if (localStorage.getItem('mewyou_lang') === 'en') setLangState('en')
    } catch { /* ignore */ }
  }, [])

  const setLang = (l: Lang) => {
    setLangState(l)
    try { localStorage.setItem('mewyou_lang', l) } catch { /* ignore */ }
  }

  const t = (s: string) => (lang === 'en' ? EN[s] ?? s : s)

  return <I18nCtx.Provider value={{ lang, setLang, t }}>{children}</I18nCtx.Provider>
}

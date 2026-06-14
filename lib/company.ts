// Company information shown as "ผู้ออกเอกสาร / Issued By" on every document.
// Pulled from Settings > Company Information — never hardcoded in templates.

export interface CompanyInfo {
  name: string
  branch?: string
  address?: string
  province?: string
  postalCode?: string
  taxId?: string
  phone?: string
  email?: string
  website?: string
  logo?: string | null
  contactName?: string
}

// Sensible defaults used only until the studio fills in Settings. The document
// templates themselves contain no company data — they always read from here.
export const FALLBACK_COMPANY: CompanyInfo = {
  name: 'MEWYOU PACKAGING DESIGN',
  branch: 'สำนักงานใหญ่',
  address: 'บริษัท มิวอี้ ดีไซน์ ดิจิตอลเน็ตเวิร์ค จำกัด 111/159 ซอย ฉลองกรุง 53 แขวง ลาดกระบัง เขตลาดกระบัง',
  province: 'กรุงเทพมหานคร',
  postalCode: '10520',
  taxId: '0105560143099',
  phone: '099-669-6959',
  email: 'mewyoulife@gmail.com',
  website: '@mewyou.design',
  contactName: 'คุณ มิว',
  logo: null,
}

interface SettingsLike {
  companyName?: string
  branch?: string
  address?: string
  province?: string
  postalCode?: string
  website?: string
  taxId?: string
  phone?: string
  email?: string
  logo?: string | null
  ownerName?: string
}

// Map a Settings record into CompanyInfo, falling back per-field only when a
// value is missing so a freshly-installed studio still gets a complete document.
export function companyFromSettings(s: SettingsLike | null | undefined): CompanyInfo {
  if (!s) return FALLBACK_COMPANY
  return {
    name: s.companyName || FALLBACK_COMPANY.name,
    branch: s.branch || FALLBACK_COMPANY.branch,
    address: s.address || FALLBACK_COMPANY.address,
    province: s.province || FALLBACK_COMPANY.province,
    postalCode: s.postalCode || FALLBACK_COMPANY.postalCode,
    taxId: s.taxId || FALLBACK_COMPANY.taxId,
    phone: s.phone || FALLBACK_COMPANY.phone,
    email: s.email || FALLBACK_COMPANY.email,
    website: s.website || FALLBACK_COMPANY.website,
    logo: s.logo || null,
    contactName: s.ownerName || FALLBACK_COMPANY.contactName,
  }
}

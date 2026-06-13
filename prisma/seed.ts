import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const adapter = new PrismaBetterSqlite3({ url: 'file:dev.db' })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Seed bank accounts
  await prisma.bankAccount.upsert({ where: { id: 'bank1' }, update: {}, create: { id: 'bank1', bank: 'กสิกรไทย (KBank)', accountNo: '123-4-56789-0', name: 'บจก. มิวยู ดีไซน์', isDefault: true } })
  await prisma.bankAccount.upsert({ where: { id: 'bank2' }, update: {}, create: { id: 'bank2', bank: 'ไทยพาณิชย์ (SCB)', accountNo: '987-6-54321-0', name: 'บจก. มิวยู ดีไซน์' } })
  await prisma.bankAccount.upsert({ where: { id: 'bank3' }, update: {}, create: { id: 'bank3', bank: 'กรุงเทพ (BBL)', accountNo: '456-7-89012-3', name: 'บจก. มิวยู ดีไซน์' } })
  await prisma.bankAccount.upsert({ where: { id: 'bank4' }, update: {}, create: { id: 'bank4', bank: 'พร้อมเพย์', accountNo: '0812345678', name: 'บจก. มิวยู ดีไซน์' } })

  // Seed settings
  await prisma.settings.upsert({
    where: { id: 'settings' },
    update: {},
    create: {
      id: 'settings',
      companyName: 'mew.you',
      address: '123 ถ.สุขุมวิท แขวงคลองตัน เขตคลองเตย กรุงเทพฯ 10110',
      taxId: '0105566012345',
      vatRate: 7,
      phone: '02-xxx-xxxx',
      email: 'mewyoulife@gmail.com',
    },
  })

  // Seed customers
  const cust1 = await prisma.customer.upsert({
    where: { id: 'cust1' },
    update: {},
    create: { id: 'cust1', name: 'PERCARE', company: 'บริษัท เพอร์แคร์ จำกัด', phone: '081-234-5678', email: 'contact@percare.co.th', type: 'vip', address: '456 ถ.พระราม 9 กรุงเทพฯ 10310', taxId: '0105560012345' },
  })

  const cust2 = await prisma.customer.upsert({
    where: { id: 'cust2' },
    update: {},
    create: { id: 'cust2', name: 'JELLYS', company: 'บริษัท เจลลี่ส์ จำกัด', phone: '081-345-6789', email: 'info@jellys.co.th', type: 'normal', address: '789 ถ.รัชดาภิเษก กรุงเทพฯ 10400', taxId: '0105560012346' },
  })

  const cust3 = await prisma.customer.upsert({
    where: { id: 'cust3' },
    update: {},
    create: { id: 'cust3', name: 'GLOWME', company: 'บริษัท โกลว์มี จำกัด', phone: '082-456-7890', email: 'hello@glowme.th', type: 'new' },
  })

  const cust4 = await prisma.customer.upsert({
    where: { id: 'cust4' },
    update: {},
    create: { id: 'cust4', name: 'NATURE PLUS', company: 'บริษัท เนเจอร์พลัส จำกัด', phone: '083-567-8901', email: 'info@natureplus.co.th', type: 'normal' },
  })

  const cust5 = await prisma.customer.upsert({
    where: { id: 'cust5' },
    update: {},
    create: { id: 'cust5', name: 'LUXE', company: 'บริษัท ลักซ์ จำกัด', phone: '084-678-9012', email: 'contact@luxe.co.th', type: 'vip' },
  })

  // Seed projects
  const projects = [
    { id: 'pj1', code: 'PJ-2024-001', name: 'Packaging Design', customerId: cust1.id, type: 'Packaging Design', status: 'design', priority: 'high', value: 85000, cost: 32000, dueDate: '30 มิ.ย. 67' },
    { id: 'pj2', code: 'PJ-2024-002', name: 'Logo + Branding', customerId: cust2.id, type: 'Logo', status: 'revision', priority: 'normal', value: 45000, cost: 18000, dueDate: '15 มิ.ย. 67' },
    { id: 'pj3', code: 'PJ-2024-003', name: 'Label Design', customerId: cust3.id, type: 'Label Design', status: 'brief', priority: 'urgent', value: 72000, cost: 28000, dueDate: '20 มิ.ย. 67' },
    { id: 'pj4', code: 'PJ-2024-004', name: 'Box Design', customerId: cust4.id, type: 'Packaging Design', status: 'approved', priority: 'normal', value: 60000, cost: 68000, dueDate: '25 มิ.ย. 67' },
    { id: 'pj5', code: 'PJ-2024-005', name: 'Product Mockup', customerId: cust5.id, type: 'Mockup', status: 'deliver', priority: 'high', value: 150000, cost: 45000, dueDate: '10 มิ.ย. 67' },
    { id: 'pj6', code: 'PJ-2024-006', name: 'Logo Design', customerId: cust1.id, type: 'Logo', status: 'completed', priority: 'normal', value: 35000, cost: 12000, dueDate: '05 มิ.ย. 67' },
    { id: 'pj7', code: 'PJ-2024-007', name: 'Packaging Artwork', customerId: cust2.id, type: 'Artwork', status: 'payment', priority: 'normal', value: 55000, cost: 20000, dueDate: '28 มิ.ย. 67' },
    { id: 'pj8', code: 'PJ-2024-008', name: 'Sticker Design', customerId: cust3.id, type: 'Label Design', status: 'quotation', priority: 'low', value: 28000, cost: 8000, dueDate: '05 ก.ค. 67' },
  ]
  for (const p of projects) {
    await prisma.project.upsert({ where: { id: p.id }, update: {}, create: p })
  }

  // Seed quotations
  const items1 = JSON.stringify([
    { name: 'ออกแบบบรรจุภัณฑ์ (Packaging Design)', detail: 'ดีไซน์หน้า-หลัง-ข้าง', qty: 1, unit: 'งาน', price: 40000 },
    { name: 'จัดทำ Artwork พร้อมส่งโรงพิมพ์', detail: 'ไฟล์ AI + PDF print-ready', qty: 1, unit: 'งาน', price: 5000 },
  ])

  await prisma.quotation.upsert({
    where: { id: 'quo1' },
    update: {},
    create: {
      id: 'quo1', no: 'QO-2569-0001', customerId: cust1.id, status: 'approved',
      issueDate: '04/06/2569', expiry: '04/07/2569', items: items1,
      discount: 0, vatEnabled: true, paymentTerm: 'deposit50', bankIndex: 0,
      clientName: 'บริษัท เพอร์แคร์ จำกัด', clientAddress: '456 ถ.พระราม 9 กรุงเทพฯ 10310',
      clientTaxId: '0105560012345', clientContact: 'คุณสมชาย', clientPhone: '081-234-5678',
    },
  })

  await prisma.quotation.upsert({
    where: { id: 'quo2' },
    update: {},
    create: {
      id: 'quo2', no: 'QO-2569-0002', customerId: cust2.id, status: 'sent',
      issueDate: '10/06/2569', expiry: '10/07/2569',
      items: JSON.stringify([{ name: 'ออกแบบ Logo + Branding', detail: 'Logo 3 แนวทาง + Brand Guide', qty: 1, unit: 'งาน', price: 45000 }]),
      discount: 0, vatEnabled: true, paymentTerm: 'full', bankIndex: 0,
      clientName: 'บริษัท เจลลี่ส์ จำกัด', clientAddress: '789 ถ.รัชดาภิเษก กรุงเทพฯ 10400', clientTaxId: '0105560012346',
    },
  })

  await prisma.quotation.upsert({
    where: { id: 'quo3' },
    update: {},
    create: {
      id: 'quo3', no: 'QO-2569-0003', customerId: cust3.id, status: 'draft',
      issueDate: '13/06/2569',
      items: JSON.stringify([{ name: 'ออกแบบ Label', detail: 'ฉลากสินค้า 3 รูปแบบ', qty: 1, unit: 'งาน', price: 25000 }]),
      discount: 0, vatEnabled: false, paymentTerm: 'deposit50', bankIndex: 0,
    },
  })

  // Seed expenses
  const expenses = [
    { id: 'exp1', description: 'ค่าซอฟต์แวร์ Adobe CC', amount: 3500, category: 'ซอฟต์แวร์', date: '2024-06-01' },
    { id: 'exp2', description: 'ค่าอินเทอร์เน็ต', amount: 1200, category: 'ค่าสาธารณูปโภค', date: '2024-06-01' },
    { id: 'exp3', description: 'ค่าจ้างฟรีแลนซ์ (PERCARE)', amount: 15000, category: 'ค่าจ้างฟรีแลนซ์', date: '2024-06-05' },
    { id: 'exp4', description: 'ค่าพิมพ์ตัวอย่าง', amount: 2800, category: 'วัสดุ/สื่อสิ่งพิมพ์', date: '2024-06-10' },
    { id: 'exp5', description: 'ค่าจ้างฟรีแลนซ์ (JELLYS)', amount: 12000, category: 'ค่าจ้างฟรีแลนซ์', date: '2024-06-12' },
  ]
  for (const e of expenses) {
    await prisma.expense.upsert({ where: { id: e.id }, update: {}, create: e })
  }

  console.log('Seed data created successfully!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

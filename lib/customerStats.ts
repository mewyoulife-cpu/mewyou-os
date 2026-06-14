// Shared calculation of a customer's "ยอดซื้อรวม" (total purchases) from real documents.
// Counts issued sales documents (invoices + standalone receipts) and avoids
// double-counting receipts that are issued against an existing invoice.

interface DocLike {
  customerId?: string | null
  type?: string | null
  refInvoiceId?: string | null
  items: unknown
  discount?: number | null
  vatEnabled?: boolean | null
}

export function documentTotal(d: DocLike): number {
  let items: { qty?: number; price?: number }[] = []
  try {
    const parsed = typeof d.items === 'string' ? JSON.parse(d.items) : d.items
    if (Array.isArray(parsed)) items = parsed
  } catch {
    items = []
  }
  const sub = items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.price) || 0), 0)
  const afterDiscount = sub - (d.discount || 0)
  return d.vatEnabled ? afterDiscount * 1.07 : afterDiscount
}

function counts(d: DocLike): boolean {
  if (!d.customerId) return false
  if (d.type !== 'invoice' && d.type !== 'receipt') return false
  // A receipt issued against an invoice would double-count that sale.
  if (d.type === 'receipt' && d.refInvoiceId) return false
  return true
}

// Sum of total purchases for a single customer's documents.
export function customerPurchaseTotal(docs: DocLike[]): number {
  return docs.reduce((s, d) => (counts(d) ? s + documentTotal(d) : s), 0)
}

// Map of customerId -> total purchases, across all documents.
export function purchaseTotalsByCustomer(docs: DocLike[]): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const d of docs) {
    if (!counts(d)) continue
    const key = d.customerId as string
    totals[key] = (totals[key] || 0) + documentTotal(d)
  }
  return totals
}

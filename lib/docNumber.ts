import { prisma } from '@/lib/prisma'

// Allocate the next sequence number for a document-number key (e.g. "QO-2569").
//
// Backed by the persistent DocumentCounter table, so allocated numbers keep
// climbing and are never reused — even after documents are deleted. On the very
// first allocation for a key, the counter is seeded from `seedMax` (the highest
// existing sequence) so numbering continues smoothly from pre-counter data.
export async function nextDocSeq(key: string, seedMax: () => Promise<number>): Promise<number> {
  const existing = await prisma.documentCounter.findUnique({ where: { key } })
  if (!existing) {
    const start = await seedMax()
    try {
      await prisma.documentCounter.create({ data: { key, seq: start } })
    } catch {
      // Created concurrently by another request — fine, just increment below.
    }
  }
  const updated = await prisma.documentCounter.update({
    where: { key },
    data: { seq: { increment: 1 } },
  })
  return updated.seq
}

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  lead: { label: 'Lead', bg: '#eef2f5', color: '#8fa7bc' },
  brief: { label: 'Brief', bg: '#e8f1f9', color: '#6b96c2' },
  quotation: { label: 'Quotation', bg: '#f0eaf9', color: '#9575cd' },
  payment: { label: 'Payment', bg: '#fdf3e3', color: '#f4a431' },
  design: { label: 'Design', bg: '#e8eef4', color: '#5f7d99' },
  revision: { label: 'Revision', bg: '#fceee8', color: '#e07b54' },
  approved: { label: 'Approved', bg: '#e9f3ed', color: '#3d8a64' },
  billing: { label: 'Billing', bg: '#fdeede', color: '#e08a2b' },
  deliver: { label: 'Deliver', bg: '#e3f2fd', color: '#2196f3' },
  completed: { label: 'Completed', bg: '#e8f5e9', color: '#4caf50' },
  draft: { label: 'ร่าง', bg: '#f0f2f5', color: '#8a97a2' },
  sent: { label: 'ส่งแล้ว', bg: '#e8f1f9', color: '#6b96c2' },
  invoice: { label: 'Invoice', bg: '#e3f2fd', color: '#2196f3' },
  receipt: { label: 'ใบเสร็จ', bg: '#e9f3ed', color: '#3d8a64' },
  taxinvoice: { label: 'ใบกำกับภาษี', bg: '#f0eaf9', color: '#9575cd' },
};

export default function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] || { label: status, bg: '#f0f2f5', color: '#8a97a2' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', height: 26, padding: '0 10px',
      borderRadius: 8, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color
    }}>
      {s.label}
    </span>
  );
}

export default function Card({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#ffffff', borderRadius: 18, border: '1px solid #edf0f3', ...style }} className={className}>
      {children}
    </div>
  );
}

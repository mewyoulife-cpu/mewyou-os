type Variant = 'primary' | 'secondary' | 'danger';
const STYLES: Record<Variant, React.CSSProperties> = {
  primary: { background: '#5f7d99', color: '#fff', border: 'none', boxShadow: '0 4px 12px rgba(95,125,153,.3)' },
  secondary: { background: '#fff', color: '#5b6b77', border: '1px solid #e4e8ec' },
  danger: { background: '#c4593f', color: '#fff', border: 'none' },
};

export default function Button({ children, onClick, variant = 'primary', disabled, icon, style = {} }: {
  children: React.ReactNode; onClick?: () => void; variant?: Variant; disabled?: boolean; icon?: string; style?: React.CSSProperties;
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'flex', alignItems: 'center', gap: 7, height: 44, padding: '0 18px',
      borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'inherit', opacity: disabled ? 0.6 : 1, ...STYLES[variant], ...style
    }}>
      {icon && <span className="material-symbols-rounded" style={{ fontSize: 20, fontFamily: "'Material Symbols Rounded'", fontFeatureSettings: "'liga'" }}>{icon}</span>}
      {children}
    </button>
  );
}

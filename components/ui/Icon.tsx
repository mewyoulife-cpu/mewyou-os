export default function Icon({ name, size = 20, color, style = {} }: { name: string; size?: number; color?: string; style?: React.CSSProperties }) {
  return (
    <span
      className="material-symbols-rounded"
      style={{ fontSize: size, color, lineHeight: 1, fontFamily: "'Material Symbols Rounded'", fontWeight: 400, fontStyle: 'normal', letterSpacing: 'normal', textTransform: 'none', display: 'inline-block', whiteSpace: 'nowrap', wordWrap: 'normal', direction: 'ltr', fontFeatureSettings: "'liga'", WebkitFontFeatureSettings: "'liga'", ...style }}
    >
      {name}
    </span>
  );
}

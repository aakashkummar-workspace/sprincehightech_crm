// Richer, more saturated tint rotation so icon tiles read as colorful glass
// chips rather than washed-out pastel squares.
const TINTS = [
  { grad: 'from-violet-400 to-indigo-500', glow: 'shadow-violet-500/30' },
  { grad: 'from-sky-400 to-blue-500', glow: 'shadow-sky-500/30' },
  { grad: 'from-emerald-400 to-teal-500', glow: 'shadow-emerald-500/30' },
  { grad: 'from-amber-400 to-orange-500', glow: 'shadow-amber-500/30' },
  { grad: 'from-rose-400 to-pink-500', glow: 'shadow-rose-500/30' },
  { grad: 'from-cyan-400 to-sky-500', glow: 'shadow-cyan-500/30' },
];

export default function KpiCard({ label, value, hint, icon, tintIndex = 0, onClick }) {
  const tint = TINTS[tintIndex % TINTS.length];
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      className={`card text-left ${onClick ? 'cursor-pointer transition-shadow hover:shadow-lg' : ''}`}
      onClick={onClick}
    >
      <div className={`icon-tile mb-3 bg-gradient-to-br ${tint.grad} text-white shadow-lg ${tint.glow}`}>
        {icon || <DefaultIcon />}
      </div>
      <div className="text-sm font-semibold text-gray-800">{label}</div>
      <div className="mt-1 text-xl font-bold text-gray-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-gray-500">{hint}</div>}
    </Tag>
  );
}

function DefaultIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M3 3a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V3zM3 13a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4zM11 3a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V3zM11 13a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  );
}

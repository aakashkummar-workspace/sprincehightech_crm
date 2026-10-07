// Gold/red tint rotation matching the S Prince Hightech logo palette
// (crown-red + gold coin) instead of a generic rainbow cycle.
const TINTS = [
  { grad: 'from-amber-400 to-orange-500', glow: 'shadow-amber-500/30' },
  { grad: 'from-red-400 to-red-600', glow: 'shadow-red-500/30' },
  { grad: 'from-yellow-400 to-amber-500', glow: 'shadow-yellow-500/30' },
  { grad: 'from-orange-400 to-red-500', glow: 'shadow-orange-500/30' },
  { grad: 'from-amber-500 to-red-600', glow: 'shadow-amber-600/30' },
  { grad: 'from-red-400 to-orange-500', glow: 'shadow-red-400/30' },
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
      <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</div>
      <div className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
      {hint && <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</div>}
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

// Shared filter bar: a row of select/date filters + an optional search box,
// rendered as a glass pill-row. Each page passes its own `filters` config
// and owns the actual filter state — this is just the UI shell.
export default function FilterBar({ filters, search, onSearchChange, searchPlaceholder = 'Search…' }) {
  return (
    <div className="card flex flex-wrap items-center gap-3 py-3">
      {onSearchChange && (
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full max-w-xs rounded-full border border-gray-200 bg-white/70 px-4 py-1.5 text-sm"
        />
      )}
      {filters.map((f) => (
        <select
          key={f.label}
          value={f.value}
          onChange={(e) => f.onChange(e.target.value)}
          className="rounded-full border border-gray-200 bg-white/70 px-3 py-1.5 text-sm text-gray-700"
        >
          <option value="">{f.label}: All</option>
          {f.options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ))}
      {(search || filters.some((f) => f.value)) && (
        <button
          onClick={() => {
            onSearchChange?.('');
            filters.forEach((f) => f.onChange(''));
          }}
          className="rounded-full px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-white/60"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

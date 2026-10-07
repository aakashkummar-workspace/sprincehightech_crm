// Shared clickable row used inside KPI drill-down Modal popups across
// Dashboard, Projects, Subcontractors, Employees, Finance, Daily Work Updates.
export default function RowLink({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/40 bg-white/40 px-3 py-2 text-left text-sm transition-colors hover:bg-white/70"
    >
      {children}
    </button>
  );
}

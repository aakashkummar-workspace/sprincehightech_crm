// Shared text/number/date/textarea input used inside "Add New …" forms
// across Tenders, Projects, Subcontractors, Employees, Finance. Extracted
// once here so every page reuses it instead of each file redeclaring its
// own local `Field` helper.
export default function FormField({ label, value, onChange, type = 'text', required, className = '', textarea }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
          rows={2}
        />
      ) : (
        <input
          type={type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
        />
      )}
    </div>
  );
}

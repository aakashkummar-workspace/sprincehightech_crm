// Shared label/value pair used inside card-grid `<dl>` blocks (Tenders,
// Projects, Subcontractors, Finance list cards). Extracted once here so
// every page reuses it instead of each file redeclaring its own
// `DetailField`/`Field` helper and risking a naming collision.
export default function DetailField({ label, value, wide }) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <dt className="text-gray-400">{label}</dt>
      <dd className="truncate font-medium text-gray-700" title={typeof value === 'string' ? value : undefined}>
        {value}
      </dd>
    </div>
  );
}

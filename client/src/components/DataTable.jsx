import { useNavigate } from 'react-router-dom';

// Generic list table: columns = [{ key, label, render? }], rows = array of objects.
// If linkTo is provided, clicking a row navigates to linkTo(row).
export default function DataTable({ columns, rows, linkTo, idKey = 'id', emptyText = 'No records yet.' }) {
  const navigate = useNavigate();

  if (!rows || rows.length === 0) {
    return <div className="card text-sm text-gray-500 dark:text-gray-400">{emptyText}</div>;
  }

  return (
    <div className="card overflow-x-auto scrollbar-hide p-0">
      <table className="min-w-full divide-y divide-white/40 text-sm dark:divide-white/10">
        <thead className="bg-white/20 dark:bg-white/5">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/30 dark:divide-white/10">
          {rows.map((row) => (
            <tr
              key={row[idKey]}
              onClick={linkTo ? () => navigate(linkTo(row)) : undefined}
              className={linkTo ? 'cursor-pointer transition-colors hover:bg-white/30 dark:hover:bg-white/5' : ''}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-2 text-gray-700 dark:text-gray-300">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

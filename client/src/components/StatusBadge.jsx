export default function StatusBadge({ status }) {
  if (!status) return null;
  const label = String(status).replace(/_/g, ' ');
  return <span className={`status-badge status-${status}`}>{label}</span>;
}

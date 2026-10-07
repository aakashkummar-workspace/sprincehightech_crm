// Shared urgency logic for tender submission deadlines.
// Used by the Dashboard deadline list and the header reminder bell.
export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

// 'overdue' | 'urgent' (<=3 days) | 'soon' (<=7 days) | 'normal'
export function urgencyLevel(dateStr) {
  const days = daysUntil(dateStr);
  if (days === null) return 'normal';
  if (days < 0) return 'overdue';
  if (days <= 3) return 'urgent';
  if (days <= 7) return 'soon';
  return 'normal';
}

export const URGENCY_STYLES = {
  overdue: 'bg-red-50 text-red-700 border-red-200',
  urgent: 'bg-red-50 text-red-700 border-red-200',
  soon: 'bg-amber-50 text-amber-700 border-amber-200',
  normal: 'bg-gray-50 text-gray-600 border-gray-200',
};

export function urgencyLabel(dateStr) {
  const days = daysUntil(dateStr);
  if (days === null) return '';
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `${days}d left`;
}

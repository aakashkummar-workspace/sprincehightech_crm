const PREFS_KEY = 'sprince_notification_prefs';

// Categories correspond to the urgency-flagged items ReminderBell surfaces.
// All default to enabled so existing behavior is unchanged until a user
// opts out from Settings.
export const NOTIFICATION_CATEGORIES = [
  { key: 'tender_deadlines', label: 'Tender submission deadlines' },
  { key: 'payroll_due', label: 'Payroll due dates' },
  { key: 'gst_due', label: 'GST filing due dates' },
  { key: 'subcontractor_bills', label: 'Subcontractor bill aging' },
];

const DEFAULT_PREFS = Object.fromEntries(NOTIFICATION_CATEGORIES.map((c) => [c.key, true]));

export function getNotificationPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function setNotificationPrefs(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {}
}

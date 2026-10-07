// Mirrors the role x module table in the plan's Part 5 (UI/UX Design).
// Each entry: which roles may see the nav link at all, plus a module accent
// color/icon used for the sidebar, page headers, and primary actions.
export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', roles: ['director', 'regional_head', 'project_manager', 'accounts_officer', 'tender_officer', 'hr_officer'], color: 'slate', icon: 'grid', group: 'Overview' },
  { to: '/tenders', label: 'Tenders', roles: ['director', 'regional_head', 'tender_officer'], color: 'violet', icon: 'document', group: 'Pipeline' },
  { to: '/projects', label: 'Projects', roles: ['director', 'regional_head', 'project_manager', 'accounts_officer'], color: 'sky', icon: 'briefcase', group: 'Pipeline' },
  { to: '/subcontractors', label: 'Subcontractors', roles: ['director', 'regional_head', 'project_manager', 'accounts_officer'], color: 'amber', icon: 'users', group: 'Pipeline' },
  { to: '/employees', label: 'Employees & Payroll', roles: ['director', 'regional_head', 'accounts_officer', 'hr_officer'], color: 'emerald', icon: 'badge', group: 'People & Finance' },
  { to: '/finance', label: 'GST & Finance', roles: ['director', 'regional_head', 'accounts_officer'], color: 'rose', icon: 'receipt', group: 'People & Finance' },
  { to: '/daily-updates', label: 'Daily Work Updates', roles: ['director', 'regional_head', 'project_manager', 'site_supervisor'], color: 'cyan', icon: 'clipboard', group: 'Activity' },
  { to: '/reports', label: 'Reports', roles: ['director', 'regional_head', 'accounts_officer'], color: 'indigo', icon: 'chart', group: 'Activity' },
];

// Display order for grouped sidebar sections (Grouped Sections nav style).
export const NAV_GROUPS = ['Overview', 'Pipeline', 'People & Finance', 'Activity'];

// Tailwind-safe color classes per module accent (kept as full class strings
// so Tailwind's content scanner picks them up — no dynamic class building).
export const MODULE_COLORS = {
  slate: { solid: 'bg-slate-800', text: 'text-slate-700', soft: 'bg-slate-100/80', ring: 'ring-slate-300', grad: 'from-slate-200/80 to-slate-50/60' },
  violet: { solid: 'bg-violet-600', text: 'text-violet-700', soft: 'bg-violet-100/80', ring: 'ring-violet-300', grad: 'from-violet-200/80 to-indigo-50/60' },
  sky: { solid: 'bg-sky-600', text: 'text-sky-700', soft: 'bg-sky-100/80', ring: 'ring-sky-300', grad: 'from-sky-200/80 to-blue-50/60' },
  amber: { solid: 'bg-amber-500', text: 'text-amber-700', soft: 'bg-amber-100/80', ring: 'ring-amber-300', grad: 'from-amber-200/80 to-orange-50/60' },
  emerald: { solid: 'bg-emerald-600', text: 'text-emerald-700', soft: 'bg-emerald-100/80', ring: 'ring-emerald-300', grad: 'from-emerald-200/80 to-teal-50/60' },
  rose: { solid: 'bg-rose-600', text: 'text-rose-700', soft: 'bg-rose-100/80', ring: 'ring-rose-300', grad: 'from-rose-200/80 to-pink-50/60' },
  cyan: { solid: 'bg-cyan-600', text: 'text-cyan-700', soft: 'bg-cyan-100/80', ring: 'ring-cyan-300', grad: 'from-cyan-200/80 to-sky-50/60' },
  indigo: { solid: 'bg-indigo-600', text: 'text-indigo-700', soft: 'bg-indigo-100/80', ring: 'ring-indigo-300', grad: 'from-indigo-200/80 to-violet-50/60' },
};

export const ROLE_LABELS = {
  director: 'Director',
  regional_head: 'Regional Head',
  project_manager: 'Project Manager',
  site_supervisor: 'Site Supervisor',
  accounts_officer: 'Accounts Officer',
  tender_officer: 'Tender Officer',
  hr_officer: 'HR Officer',
};

export const REGION_LABELS = {
  korba: 'Korba',
  delhi: 'Delhi',
  maharashtra: 'Maharashtra',
};

// One representative demo account per distinct role, for the role-card
// login screen — matches the seed data in server/src/mock-server.js and
// server/src/db/seed.sql (all demo accounts share the password 'demo123').
// Picking a card logs in as that account directly, no typing required.
export const DEMO_ACCOUNTS = [
  { role: 'director', email: 'director@sprincehightech.com', name: 'Dr. A. Joseph Stalin', region: null, color: 'slate', icon: 'grid', description: 'Full company visibility, approvals' },
  { role: 'regional_head', email: 'regionalhead.maharashtra@sprincehightech.com', name: 'Antony Bala Prince', region: 'maharashtra', color: 'indigo', icon: 'chart', description: 'Regional oversight & approvals' },
  { role: 'project_manager', email: 'pm.korba@sprincehightech.com', name: 'Ramesh Iyer', region: 'korba', color: 'sky', icon: 'briefcase', description: 'Project & site management' },
  { role: 'site_supervisor', email: 'supervisor.korba@sprincehightech.com', name: 'Murugan Palanisamy', region: 'korba', color: 'cyan', icon: 'clipboard', description: 'Daily work & attendance entry' },
  { role: 'accounts_officer', email: 'accounts@sprincehightech.com', name: 'Lakshmi Meenakshisundaram', region: null, color: 'rose', icon: 'receipt', description: 'GST, payroll & payments' },
  { role: 'tender_officer', email: 'tenders@sprincehightech.com', name: 'Meena Krishnan', region: null, color: 'violet', icon: 'document', description: 'Tender register & bidding' },
  { role: 'hr_officer', email: 'hr@sprincehightech.com', name: 'Kavitha Ramasamy', region: null, color: 'emerald', icon: 'badge', description: 'Employee master & HR records' },
];

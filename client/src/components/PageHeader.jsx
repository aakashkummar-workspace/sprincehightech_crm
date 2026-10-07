import { NAV_ITEMS, MODULE_COLORS } from '../config/navigation.js';
import BackButton from './BackButton.jsx';

// Colored page header matching the sidebar's module accent — ties each
// page's title back to its nav color so the whole app reads as one
// coherent, colorful system rather than a flat gray admin tool.
// `showBack` renders a "back to last action" control using browser history,
// so every page (list or detail) offers a way back without relying on the
// sidebar or the browser's own back button.
export default function PageHeader({ path, title, subtitle, action, showBack = true }) {
  const item = NAV_ITEMS.find((n) => n.to === path);
  const c = MODULE_COLORS[item?.color || 'slate'];

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {showBack && <BackButton />}
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${c.solid}`} />
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl dark:text-gray-100">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function moduleColor(path) {
  const item = NAV_ITEMS.find((n) => n.to === path);
  return MODULE_COLORS[item?.color || 'slate'];
}

import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { NAV_ITEMS, NAV_GROUPS, ROLE_LABELS, REGION_LABELS, MODULE_COLORS } from '../config/navigation.js';
import ReminderBell from './ReminderBell.jsx';
import NavIcon from './NavIcons.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import logo from '../assets/sprince-logo.png';

const COLLAPSE_KEY = 'sprince_sidebar_collapsed';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(user.role));
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });

  function toggleCollapsed() {
    setCollapsed((v) => {
      const next = !v;
      try { localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0'); } catch {}
      return next;
    });
  }

  // Grouped Sections style: nav items split into labeled groups.
  const navLinksGrouped = (
    <nav className="space-y-4">
      {NAV_GROUPS.map((group) => {
        const groupItems = items.filter((i) => i.group === group);
        if (groupItems.length === 0) return null;
        return (
          <div key={group}>
            <div className="px-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{group}</div>
            <div className="space-y-0.5">
              {groupItems.map((item) => {
                const c = MODULE_COLORS[item.color];
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileNavOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        isActive ? `${c.solid} text-white shadow-lg` : 'text-gray-700 hover:bg-white/40 dark:text-gray-300 dark:hover:bg-white/10'
                      }`
                    }
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${c.solid}`} />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );

  // Compact Icon Rail style: icon-only, current page name shown below.
  const navLinksRail = (
    <nav className="flex flex-col items-center gap-2">
      {items.map((item) => {
        const c = MODULE_COLORS[item.color];
        const isActive = location.pathname === item.to;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            title={item.label}
            aria-label={item.label}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
              isActive ? `${c.solid} text-white shadow-lg` : 'text-gray-500 hover:bg-white/50 dark:text-gray-400 dark:hover:bg-white/10'
            }`}
          >
            <NavIcon name={item.icon} />
          </NavLink>
        );
      })}
    </nav>
  );

  // Account block, pinned to the bottom of the sidebar instead of the top header.
  const accountBlock = (
    <div className="space-y-2 border-t border-white/40 pt-3 dark:border-white/10">
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="w-fit rounded-full bg-white/70 px-3 py-1 text-xs text-gray-600 dark:bg-white/10 dark:text-gray-300">
          {ROLE_LABELS[user.role]}
          {user.region ? ` · ${REGION_LABELS[user.region]}` : ' · All Regions'}
        </div>
        <ReminderBell />
      </div>
      <div className="flex items-center gap-2 px-1">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-red-600 text-xs font-semibold text-white shadow-sm">
          {user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
        </div>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</span>
      </div>
      <div className="space-y-0.5 rounded-2xl bg-white/40 p-1 dark:bg-white/5">
        <NavLink
          to="/settings"
          onClick={() => setMobileNavOpen(false)}
          className={({ isActive }) =>
            `flex w-full items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive ? 'bg-red-600 text-white shadow-sm' : 'text-gray-500 hover:bg-white/60 dark:text-gray-300 dark:hover:bg-white/10'
            }`
          }
        >
          <NavIcon name="gear" className="h-4 w-4" />
          <span>Settings</span>
        </NavLink>
        <ThemeToggle />
      </div>
      <button
        className="flex w-full items-center justify-center gap-2 rounded-full bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
        onClick={() => { logout(); navigate('/login'); }}
      >
        <LogoutIcon />
        Log out
      </button>
    </div>
  );

  // Compact rail's account footer: avatar only, with a logout icon button.
  const accountBlockRail = (
    <div className="flex flex-col items-center gap-2 border-t border-white/40 pt-3 dark:border-white/10">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-red-600 text-xs font-semibold text-white shadow-sm"
        title={user.name}
      >
        {user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
      </div>
      <NavLink
        to="/settings"
        title="Settings"
        aria-label="Settings"
        className={({ isActive }) =>
          `flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
            isActive ? 'bg-red-600 text-white shadow-sm' : 'text-gray-500 hover:bg-white/50 dark:text-gray-400 dark:hover:bg-white/10'
          }`
        }
      >
        <NavIcon name="gear" className="h-4 w-4" />
      </NavLink>
      <ThemeToggle compact />
      <button
        onClick={() => { logout(); navigate('/login'); }}
        title="Log out"
        aria-label="Log out"
        className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-white/50 dark:text-gray-400 dark:hover:bg-white/10"
      >
        <LogoutIcon />
      </button>
    </div>
  );

  const currentItem = items.find((i) => i.to === location.pathname);
  const currentLabel = currentItem?.label || 'Menu';

  const mobileDrawerContent = (
    <>
      <div className="flex items-center gap-2 px-2 pb-4">
        <img src={logo} alt="S Prince Hightech" className="h-9 w-9 shrink-0 object-contain" />
        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">S Prince Hightech</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Management CRM</div>
        </div>
      </div>
      {navLinksGrouped}
      <div className="mt-4">{accountBlock}</div>
    </>
  );

  return (
    <div className="min-h-screen p-2 sm:p-4">
      {/* Desktop sidebar — fixed to the viewport so it stays in place while
          the main content scrolls independently. Hidden below lg, replaced
          by the drawer below. Toggles between the full grouped nav and a
          collapsed icon-only rail; the choice persists across reloads. */}
      <aside
        className={`glass fixed bottom-4 left-4 top-4 z-30 hidden flex-col justify-between overflow-y-auto scrollbar-hide rounded-2xl transition-[width] duration-200 lg:flex ${
          collapsed ? 'w-[72px] p-3' : 'w-64 p-4'
        }`}
      >
        <div className={collapsed ? 'flex flex-col items-center' : ''}>
          <div className={`flex items-center gap-2 pb-4 ${collapsed ? 'justify-center px-0' : 'px-2'}`}>
            <img src={logo} alt="S Prince Hightech" className="h-9 w-9 shrink-0 object-contain" />
            {!collapsed && (
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">S Prince Hightech</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Management CRM</div>
              </div>
            )}
          </div>
          {collapsed ? navLinksRail : navLinksGrouped}
        </div>

        <div className={collapsed ? 'flex flex-col items-center gap-3' : ''}>
          {collapsed ? accountBlockRail : accountBlock}
          <button
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`mt-2 flex items-center justify-center rounded-full text-gray-500 hover:bg-white/50 dark:text-gray-400 dark:hover:bg-white/10 ${
              collapsed ? 'h-8 w-8' : 'w-full gap-2 px-3 py-1.5 text-xs font-medium'
            }`}
          >
            <CollapseIcon flipped={collapsed} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Mobile/tablet top bar — just the menu toggle + logo, account info
          moved into the drawer below instead of a separate header row. */}
      <div className="glass mb-4 flex items-center justify-between rounded-2xl p-3 lg:hidden">
        <button
          onClick={() => setMobileNavOpen(true)}
          className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-white/40 dark:text-gray-200 dark:hover:bg-white/10"
          aria-label="Open menu"
        >
          <MenuIcon />
          <span>{currentLabel}</span>
        </button>
        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <ReminderBell />
          <img src={logo} alt="S Prince Hightech" className="h-7 w-7 object-contain" />
        </div>
      </div>

      {/* Mobile drawer — nav + account block together */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)} />
          <aside className="glass absolute left-2 top-2 bottom-2 flex w-64 max-w-[80vw] flex-col overflow-y-auto scrollbar-hide rounded-2xl p-4">
            <div className="mb-2 flex justify-end">
              <button
                onClick={() => setMobileNavOpen(false)}
                className="rounded-full p-1.5 text-gray-500 hover:bg-white/50 dark:text-gray-400 dark:hover:bg-white/10"
                aria-label="Close menu"
              >
                <CloseIcon />
              </button>
            </div>
            {mobileDrawerContent}
          </aside>
        </div>
      )}

      {/* Reserves the fixed sidebar's width + offsets on desktop (left-4 + sidebar width + gap)
          so content doesn't render underneath it. Adjusts when collapsed.
          pb-8 keeps the last card clear of the fixed SiteFooter bar. */}
      <main className={`min-w-0 pb-8 transition-[margin] duration-200 ${collapsed ? 'lg:ml-[104px]' : 'lg:ml-[288px]'}`}>
        <Outlet />
      </main>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3 5h14a1 1 0 100-2H3a1 1 0 000 2zm0 6h14a1 1 0 100-2H3a1 1 0 000 2zm0 6h14a1 1 0 100-2H3a1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 100-2H4V5h7a1 1 0 100-2H3zm12.293 4.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L17.586 11H9a1 1 0 110-2h8.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}

function CollapseIcon({ flipped }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`h-4 w-4 transition-transform ${flipped ? 'rotate-180' : ''}`}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path fillRule="evenodd" d="M12.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L8.414 9.5H16a1 1 0 110 2H8.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
    </svg>
  );
}

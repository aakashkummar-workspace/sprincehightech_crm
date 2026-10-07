import { useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { useTheme } from '../theme/ThemeContext.jsx';
import { ROLE_LABELS, REGION_LABELS } from '../config/navigation.js';
import { NOTIFICATION_CATEGORIES, getNotificationPrefs, setNotificationPrefs } from '../utils/notificationPrefs.js';
import PageHeader from '../components/PageHeader.jsx';
import DetailField from '../components/DetailField.jsx';

const DENSITY_KEY = 'sprince_density';

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [prefs, setPrefs] = useState(getNotificationPrefs);
  const [density, setDensity] = useState(() => {
    try {
      return localStorage.getItem(DENSITY_KEY) || 'comfortable';
    } catch {
      return 'comfortable';
    }
  });

  function togglePref(key) {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      setNotificationPrefs(next);
      return next;
    });
  }

  function changeDensity(value) {
    setDensity(value);
    try {
      localStorage.setItem(DENSITY_KEY, value);
      document.documentElement.classList.toggle('density-compact', value === 'compact');
    } catch {}
  }

  return (
    <div>
      <PageHeader path="/settings" title="Settings" subtitle="Manage your profile, appearance, and notification preferences." showBack={false} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Profile & account */}
        <section className="card">
          <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">Profile & Account</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <DetailField label="Name" value={user.name} />
            <DetailField label="Email" value={user.email} />
            <DetailField label="Role" value={ROLE_LABELS[user.role]} />
            <DetailField label="Region" value={user.region ? REGION_LABELS[user.region] : 'All Regions'} />
          </dl>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Profile details are managed by your HR administrator. Contact HR to update your name, email, or role.
          </p>
        </section>

        {/* Theme & display */}
        <section className="card">
          <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">Theme & Display</h2>
          <div className="mb-4">
            <div className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">Appearance</div>
            <div className="flex gap-2">
              {[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    theme === opt.value
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'border border-gray-200 bg-white/70 text-gray-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/20'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">Density</div>
            <div className="flex gap-2">
              {[
                { value: 'comfortable', label: 'Comfortable' },
                { value: 'compact', label: 'Compact' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => changeDensity(opt.value)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    density === opt.value
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'border border-gray-200 bg-white/70 text-gray-700 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/20'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="card">
          <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">Notifications</h2>
          <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
            Choose which reminders appear in the notification bell.
          </p>
          <div className="space-y-2">
            {NOTIFICATION_CATEGORIES.map((cat) => (
              <label
                key={cat.key}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-white/40 bg-white/40 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10"
              >
                <span className="text-gray-700 dark:text-gray-300">{cat.label}</span>
                <input
                  type="checkbox"
                  checked={prefs[cat.key]}
                  onChange={() => togglePref(cat.key)}
                  className="h-4 w-4 rounded accent-red-600"
                />
              </label>
            ))}
          </div>
        </section>

        {/* Company / app info */}
        <section className="card">
          <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">Company & App Info</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <DetailField label="Application" value="S Prince Hightech Management CRM" wide />
            <DetailField label="Version" value="1.0.0" />
            <DetailField label="Company" value="S Prince Hightech Pvt Ltd" wide />
          </dl>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Developed by <span className="font-bold">SIRAH DIGITAL</span>
          </p>
        </section>
      </div>
    </div>
  );
}

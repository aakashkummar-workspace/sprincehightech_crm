import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { DEMO_ACCOUNTS, MODULE_COLORS, ROLE_LABELS, REGION_LABELS } from '../config/navigation.js';
import NavIcon from '../components/NavIcons.jsx';
import logo from '../assets/sprince-logo.png';

// Demo-mode login: every seeded account shares this password, so picking a
// role card logs straight in — no typing required. Still goes through the
// real /auth/login endpoint and gets a real JWT scoped to that role/region.
const DEMO_PASSWORD = 'demo123';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [pendingRole, setPendingRole] = useState(null);
  const [error, setError] = useState('');

  async function handleSelect(account) {
    setError('');
    setPendingRole(account.role);
    try {
      await login(account.email, DEMO_PASSWORD);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || `Could not sign in as ${ROLE_LABELS[account.role]}.`);
      setPendingRole(null);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-3xl">
        <div className="glass rounded-3xl p-6 sm:p-10">
          <div className="mb-8 flex items-center gap-3">
            <img src={logo} alt="S Prince Hightech" className="h-11 w-11 shrink-0 object-contain" />
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">S Prince Hightech</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Management CRM</p>
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Choose how you'd like to sign in</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Pick a role below to open its dashboard — this demo build signs you straight in.
          </p>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">{error}</div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {DEMO_ACCOUNTS.map((account) => {
              const c = MODULE_COLORS[account.color];
              const isPending = pendingRole === account.role;
              return (
                <button
                  key={account.role}
                  onClick={() => handleSelect(account)}
                  disabled={pendingRole !== null}
                  className="card flex items-start gap-3 text-left transition-shadow hover:shadow-lg disabled:opacity-60"
                >
                  <div className={`icon-tile shrink-0 bg-gradient-to-br ${c.grad} ${c.text}`}>
                    {isPending ? <Spinner /> : <NavIcon name={account.icon} />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{ROLE_LABELS[account.role]}</div>
                    <div className="truncate text-xs text-gray-500 dark:text-gray-400">{account.name}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-gray-400 dark:text-gray-500">{account.description}</span>
                    </div>
                    {account.region && (
                      <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${c.soft} ${c.text}`}>
                        {REGION_LABELS[account.region]}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

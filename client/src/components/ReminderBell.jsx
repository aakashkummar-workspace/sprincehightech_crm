import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { urgencyLevel, urgencyLabel, URGENCY_STYLES } from '../utils/deadlines.js';
import { getNotificationPrefs } from '../utils/notificationPrefs.js';

const POLL_INTERVAL_MS = 5 * 60 * 1000; // re-check every 5 minutes while the app is open

export default function ReminderBell() {
  const [deadlines, setDeadlines] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  function load() {
    if (!getNotificationPrefs().tender_deadlines) {
      setDeadlines([]);
      return;
    }
    api.get('/dashboard')
      .then((res) => setDeadlines(res.data.upcoming_tender_deadlines || []))
      .catch(() => {}); // silent — the bell is a convenience, not critical path
  }

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dueSoon = deadlines.filter((t) => ['overdue', 'urgent', 'soon'].includes(urgencyLevel(t.submission_date)));
  const sorted = [...deadlines].sort((a, b) => new Date(a.submission_date) - new Date(b.submission_date));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { load(); setOpen((v) => !v); }}
        className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
        aria-label="Tender deadline reminders"
      >
        <BellIcon />
        {dueSoon.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-semibold text-white">
            {dueSoon.length}
          </span>
        )}
      </button>

      {open && (
        <div className="glass fixed inset-x-3 top-16 z-50 rounded-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80">
          <div className="border-b border-white/40 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-white/10 dark:text-gray-300">
            Tender Submission Deadlines
          </div>
          <div className="max-h-80 overflow-y-auto scrollbar-hide p-2">
            {sorted.length === 0 ? (
              <p className="px-2 py-3 text-sm text-gray-500 dark:text-gray-400">No upcoming deadlines.</p>
            ) : (
              sorted.map((t) => {
                const level = urgencyLevel(t.submission_date);
                return (
                  <button
                    key={t.tender_code}
                    onClick={() => { setOpen(false); navigate('/tenders'); }}
                    className={`mb-1 w-full rounded-xl border px-3 py-2 text-left text-xs last:mb-0 ${URGENCY_STYLES[level]}`}
                  >
                    <div className="font-medium">{t.tender_name}</div>
                    <div className="mt-0.5 flex justify-between text-[11px] opacity-80">
                      <span>{t.tender_code}</span>
                      <span>{urgencyLabel(t.submission_date)}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 15h14a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM8.5 16a1.5 1.5 0 003 0h-3z" />
    </svg>
  );
}

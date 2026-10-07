import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import KpiCard from '../components/KpiCard.jsx';
import Modal from '../components/Modal.jsx';
import RowLink from '../components/RowLink.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { urgencyLevel, urgencyLabel, URGENCY_STYLES } from '../utils/deadlines.js';

const currency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '—');

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [activeDrilldown, setActiveDrilldown] = useState(null); // kpi key or null
  const [drilldownData, setDrilldownData] = useState(null);
  const [drilldownLoading, setDrilldownLoading] = useState(false);

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load dashboard'));
  }, []);

  if (error) return <div className="card text-sm text-red-700 dark:text-red-400">{error}</div>;
  if (!data) return <div className="text-sm text-gray-500 dark:text-gray-400">Loading dashboard…</div>;

  const won = data.won_lost_tenders.find((t) => t.status === 'won')?.count || 0;
  const lost = data.won_lost_tenders.find((t) => t.status === 'lost')?.count || 0;

  async function openDrilldown(key) {
    setActiveDrilldown(key);
    setDrilldownLoading(true);
    try {
      const rows = await DRILLDOWNS[key].fetch();
      setDrilldownData(rows);
    } catch {
      setDrilldownData([]);
    } finally {
      setDrilldownLoading(false);
    }
  }

  function closeDrilldown() {
    setActiveDrilldown(null);
    setDrilldownData(null);
  }

  // Each entry: how to fetch + filter the underlying records, and how to
  // render each row in the popup. Mirrors the same filters the /dashboard
  // endpoint uses to compute the KPI number, so the list matches the count.
  const DRILLDOWNS = {
    active_tenders: {
      title: 'Active Tenders',
      fetch: async () => {
        const { data: rows } = await api.get('/tenders');
        return rows.filter((t) => !['won', 'lost'].includes(t.status));
      },
      row: (t) => (
        <RowLink key={t.id} onClick={() => navigate(`/tenders/${t.id}`)}>
          <div className="min-w-0">
            <div className="truncate font-medium text-gray-900 dark:text-gray-100">{t.tender_name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{t.tender_code} · {t.organisation}</div>
          </div>
          <StatusBadge status={t.status} />
        </RowLink>
      ),
    },
    won_lost_tenders: {
      title: 'Won / Lost Tenders',
      fetch: async () => {
        const { data: rows } = await api.get('/tenders');
        return rows.filter((t) => ['won', 'lost'].includes(t.status));
      },
      row: (t) => (
        <RowLink key={t.id} onClick={() => navigate(`/tenders/${t.id}`)}>
          <div className="min-w-0">
            <div className="truncate font-medium text-gray-900 dark:text-gray-100">{t.tender_name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{t.tender_code} · {t.organisation}</div>
          </div>
          <StatusBadge status={t.status} />
        </RowLink>
      ),
    },
    active_projects: {
      title: 'Active Projects',
      fetch: async () => {
        const { data: rows } = await api.get('/projects');
        return rows.filter((p) => p.work_status !== 'completed');
      },
      row: (p) => (
        <RowLink key={p.id} onClick={() => navigate(`/projects/${p.id}`)}>
          <div className="min-w-0">
            <div className="truncate font-medium text-gray-900 dark:text-gray-100">{p.client}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{p.site} · {currency(p.project_value)}</div>
          </div>
          <StatusBadge status={p.work_status} />
        </RowLink>
      ),
    },
    project_value: {
      title: 'Active Project Value',
      fetch: async () => {
        const { data: rows } = await api.get('/projects');
        return rows.filter((p) => p.work_status !== 'completed');
      },
      row: (p) => (
        <RowLink key={p.id} onClick={() => navigate(`/projects/${p.id}`)}>
          <div className="min-w-0">
            <div className="truncate font-medium text-gray-900 dark:text-gray-100">{p.client}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{p.site}</div>
          </div>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{currency(p.project_value)}</span>
        </RowLink>
      ),
    },
    subcontractor_work_pending: {
      title: 'Subcontractor Work Pending',
      fetch: async () => {
        const { data: subs } = await api.get('/subcontractors');
        const all = (await Promise.all(subs.map((s) => api.get(`/subcontractors/${s.id}`).then((r) => r.data.assignments))))
          .flat();
        return all.filter((a) => a.work_progress_percent < 100);
      },
      row: (a) => (
        <RowLink key={a.id} onClick={() => navigate('/subcontractors')}>
          <div className="min-w-0">
            <div className="truncate font-medium text-gray-900 dark:text-gray-100">{a.assigned_work}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{a.client} · {a.site}</div>
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-300">{a.work_progress_percent}%</span>
        </RowLink>
      ),
    },
    subcontractor_pending_payments: {
      title: 'Subcontractor Pending Payments',
      fetch: async () => {
        const { data: subs } = await api.get('/subcontractors');
        const all = (await Promise.all(subs.map((s) => api.get(`/subcontractors/${s.id}`).then((r) => r.data.assignments))))
          .flat();
        return all.filter((a) => a.balance > 0);
      },
      row: (a) => (
        <RowLink key={a.id} onClick={() => navigate('/subcontractors')}>
          <div className="min-w-0">
            <div className="truncate font-medium text-gray-900 dark:text-gray-100">{a.assigned_work}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{a.client} · {a.site}</div>
          </div>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{currency(a.balance)}</span>
        </RowLink>
      ),
    },
    subcontractor_bills_pending: {
      title: 'Subcontractor Bills Pending',
      fetch: async () => {
        const { data: subs } = await api.get('/subcontractors');
        const all = (await Promise.all(subs.map((s) => api.get(`/subcontractors/${s.id}`).then((r) => r.data.assignments))))
          .flat();
        return all.filter((a) => !a.bill_submitted);
      },
      row: (a) => (
        <RowLink key={a.id} onClick={() => navigate('/subcontractors')}>
          <div className="min-w-0">
            <div className="truncate font-medium text-gray-900 dark:text-gray-100">{a.assigned_work}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{a.client} · {a.site}</div>
          </div>
          <StatusBadge status="pending" />
        </RowLink>
      ),
    },
    employee_count: {
      title: 'Active Employees',
      fetch: async () => {
        const { data: rows } = await api.get('/employees');
        return rows.filter((e) => e.is_active);
      },
      row: (e) => (
        <RowLink key={e.id} onClick={() => navigate('/employees')}>
          <div className="min-w-0">
            <div className="truncate font-medium text-gray-900 dark:text-gray-100">{e.full_name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{e.designation} · {e.site}</div>
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-300">{currency(e.base_salary)}</span>
        </RowLink>
      ),
    },
    salary_pending: {
      title: 'Salary Pending',
      fetch: async () => {
        const { data: rows } = await api.get('/payroll');
        return rows.filter((r) => r.payment_status === 'pending');
      },
      row: (r) => (
        <RowLink key={r.id} onClick={() => navigate('/employees')}>
          <div className="min-w-0">
            <div className="truncate font-medium text-gray-900 dark:text-gray-100">{r.full_name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{r.period_month}/{r.period_year}</div>
          </div>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{currency(r.net_salary)}</span>
        </RowLink>
      ),
    },
    customer_receivables: {
      title: 'Customer Receivables',
      fetch: async () => {
        const { data: rows } = await api.get('/invoices');
        return rows.filter((i) => i.payment_status !== 'paid');
      },
      row: (i) => (
        <RowLink key={i.id} onClick={() => navigate('/finance')}>
          <div className="min-w-0">
            <div className="truncate font-medium text-gray-900 dark:text-gray-100">{i.invoice_number}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{i.customer} · {formatDate(i.invoice_date)}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 dark:text-gray-100">{currency(i.total_amount)}</span>
            <StatusBadge status={i.payment_status} />
          </div>
        </RowLink>
      ),
    },
    revenue: {
      title: 'Revenue (All Invoices)',
      fetch: async () => (await api.get('/invoices')).data,
      row: (i) => (
        <RowLink key={i.id} onClick={() => navigate('/finance')}>
          <div className="min-w-0">
            <div className="truncate font-medium text-gray-900 dark:text-gray-100">{i.invoice_number}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{i.customer} · {formatDate(i.invoice_date)}</div>
          </div>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{currency(i.total_amount)}</span>
        </RowLink>
      ),
    },
    expenses: {
      title: 'Expenses (Subcontractor Payments Made)',
      fetch: async () => {
        const { data: subs } = await api.get('/subcontractors');
        const all = (await Promise.all(subs.map((s) => api.get(`/subcontractors/${s.id}`).then((r) => r.data.assignments))))
          .flat();
        return all.filter((a) => a.paid_amount > 0);
      },
      row: (a) => (
        <RowLink key={a.id} onClick={() => navigate('/subcontractors')}>
          <div className="min-w-0">
            <div className="truncate font-medium text-gray-900 dark:text-gray-100">{a.assigned_work}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{a.client} · {a.site}</div>
          </div>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{currency(a.paid_amount)}</span>
        </RowLink>
      ),
    },
  };

  const kpis = [
    { key: 'active_tenders', label: 'Active Tenders', value: data.active_tenders },
    { key: 'won_lost_tenders', label: 'Won / Lost Tenders', value: `${won} / ${lost}` },
    { key: 'active_projects', label: 'Active Projects', value: data.active_projects },
    { key: 'project_value', label: 'Project Value', value: currency(data.project_value) },
    { key: 'subcontractor_work_pending', label: 'Subcontractor Work Pending', value: data.subcontractor_work_pending },
    { key: 'subcontractor_pending_payments', label: 'Subcontractor Pending Payments', value: currency(data.subcontractor_pending_payments) },
    { key: 'subcontractor_bills_pending', label: 'Subcontractor Bills Pending', value: data.subcontractor_bills_pending },
    { key: 'employee_count', label: 'Employee Count', value: data.employee_count },
    { key: 'salary_pending', label: 'Salary Pending', value: currency(data.salary_pending) },
    { key: null, label: 'PF (Current Month)', value: currency(data.pf_status_current_month) },
    { key: 'customer_receivables', label: 'Customer Receivables', value: currency(data.customer_receivables) },
    { key: 'revenue', label: 'Revenue', value: currency(data.revenue_expenses.revenue) },
    { key: 'expenses', label: 'Expenses', value: currency(data.revenue_expenses.expenses) },
  ];

  const active = activeDrilldown ? DRILLDOWNS[activeDrilldown] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Company-wide overview across tenders, projects, people and finance. Click a card for details.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <KpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            tintIndex={i}
            onClick={kpi.key ? () => openDrilldown(kpi.key) : undefined}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Upcoming Tender Deadlines</h2>
          {data.upcoming_tender_deadlines.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming deadlines.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {[...data.upcoming_tender_deadlines]
                .sort((a, b) => new Date(a.submission_date) - new Date(b.submission_date))
                .map((t) => {
                  const level = urgencyLevel(t.submission_date);
                  return (
                    <li
                      key={t.tender_code}
                      className={`flex items-center justify-between rounded-xl border px-2.5 py-1.5 ${URGENCY_STYLES[level]}`}
                    >
                      <span>{t.tender_name} ({t.tender_code})</span>
                      <span className="flex items-center gap-2 font-medium">
                        {new Date(t.submission_date).toLocaleDateString('en-IN')}
                        <span className="text-xs">· {urgencyLabel(t.submission_date)}</span>
                      </span>
                    </li>
                  );
                })}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">GST Filing Status</h2>
          <ul className="space-y-1 text-sm">
            {data.gst_filing_status.map((g) => (
              <li key={g.gst_filing_status} className="flex justify-between">
                <span className="capitalize">{g.gst_filing_status.replace('_', ' ')}</span>
                <span className="text-gray-500 dark:text-gray-400">{g.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {active && (
        <Modal title={active.title} onClose={closeDrilldown}>
          {drilldownLoading ? (
            <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">Loading…</p>
          ) : !drilldownData || drilldownData.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">No records.</p>
          ) : (
            <div className="space-y-1.5">{drilldownData.map(active.row)}</div>
          )}
        </Modal>
      )}
    </div>
  );
}

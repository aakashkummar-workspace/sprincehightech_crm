import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import KpiCard from '../components/KpiCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Modal from '../components/Modal.jsx';
import FilterBar from '../components/FilterBar.jsx';
import { formatDate } from '../utils/format.js';

const APPROVAL_OPTIONS = [
  { value: 'pending', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
];

export default function DailyWorkUpdates() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [form, setForm] = useState({
    project_id: '', site: '', work_date: new Date().toISOString().slice(0, 10),
    work_done: '', manpower_deployed: '', materials_used: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [approvingId, setApprovingId] = useState(null);
  const [progressDelta, setProgressDelta] = useState('');
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('');
  const [drilldown, setDrilldown] = useState(null);

  // Director can do everything every other role can, including logging a
  // daily work update directly (not just approving one).
  const canEnter = ['site_supervisor', 'project_manager', 'director'].includes(user.role);
  const canApprove = ['project_manager', 'director', 'regional_head'].includes(user.role);

  function loadUpdates() {
    api.get('/daily-work-updates').then((res) => setUpdates(res.data));
  }

  useEffect(() => {
    api.get('/projects').then((res) => setProjects(res.data));
    loadUpdates();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/daily-work-updates', {
        ...form,
        manpower_deployed: Number(form.manpower_deployed) || 0,
      });
      setForm({ ...form, work_done: '', manpower_deployed: '', materials_used: '' });
      setSuccess('Update logged.');
      loadUpdates();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to log update');
    }
  }

  async function confirmApprove() {
    try {
      await api.patch(`/daily-work-updates/${approvingId}/approve`, { progress_delta: Number(progressDelta) || 0 });
      setApprovingId(null);
      setProgressDelta('');
      loadUpdates();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve update');
    }
  }

  const pendingApprovalUpdates = updates.filter((u) => !u.approved_at);
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayUpdates = updates.filter((u) => u.work_date === todayStr);
  const todayManpower = todayUpdates.reduce((a, u) => a + Number(u.manpower_deployed || 0), 0);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeekUpdates = updates.filter((u) => new Date(u.work_date) >= weekAgo);

  const projectLabel = (id) => {
    const p = projects.find((x) => x.id === id);
    return p ? `${p.client} — ${p.site}` : id;
  };

  const updateRow = (u) => (
    <div key={u.id} className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/40 bg-white/40 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10">
      <div className="min-w-0">
        <div className="truncate font-medium text-gray-900 dark:text-gray-100">{formatDate(u.work_date)} — {projectLabel(u.project_id)}</div>
        <div className="truncate text-xs text-gray-500 dark:text-gray-400">{u.work_done}</div>
      </div>
      <StatusBadge status={u.approved_at ? 'completed' : 'pending'} />
    </div>
  );

  const filtered = useMemo(() => {
    return updates.filter((u) => {
      if (projectFilter && u.project_id !== projectFilter) return false;
      if (approvalFilter === 'pending' && u.approved_at) return false;
      if (approvalFilter === 'approved' && !u.approved_at) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = `${u.work_done} ${u.materials_used || ''} ${u.site || ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [updates, projectFilter, approvalFilter, search]);

  return (
    <div className="space-y-6">
      <PageHeader path="/daily-updates" title="Daily Work Updates" subtitle="Site activity rolled up for management, without anyone needing to ask." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Pending Approval" value={pendingApprovalUpdates.length} tintIndex={3}
          onClick={() => setDrilldown({ title: 'Updates Pending Approval', rows: pendingApprovalUpdates.map(updateRow) })}
        />
        <KpiCard
          label="Manpower Deployed Today" value={todayManpower} tintIndex={5}
          onClick={() => setDrilldown({ title: "Today's Updates", rows: todayUpdates.map(updateRow) })}
        />
        <KpiCard
          label="Updates This Week" value={thisWeekUpdates.length} tintIndex={2}
          onClick={() => setDrilldown({ title: 'Updates This Week', rows: thisWeekUpdates.map(updateRow) })}
        />
      </div>

      {canEnter && (
        <form onSubmit={handleSubmit} className="card space-y-3 max-w-lg">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Log Today's Work</h2>
          {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">{error}</div>}
          {success && <div className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-emerald-500/10 dark:text-emerald-400">{success}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project</label>
            <select
              required
              value={form.project_id}
              onChange={(e) => setForm({ ...form, project_id: e.target.value })}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
            >
              <option value="">Select project…</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.client} — {p.site}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
            <input
              type="date" required value={form.work_date}
              onChange={(e) => setForm({ ...form, work_date: e.target.value })}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Work Done</label>
            <textarea
              required rows={3} value={form.work_done}
              onChange={(e) => setForm({ ...form, work_done: e.target.value })}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Manpower Deployed</label>
              <input
                type="number" value={form.manpower_deployed}
                onChange={(e) => setForm({ ...form, manpower_deployed: e.target.value })}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Materials Used</label>
              <input
                value={form.materials_used}
                onChange={(e) => setForm({ ...form, materials_used: e.target.value })}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
              />
            </div>
          </div>
          <button type="submit" className="btn btn-cyan w-full">Submit Update</button>
        </form>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Recent Updates</h2>

        <div className="mb-4">
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by work description, materials, site…"
            filters={[
              {
                label: 'Project',
                value: projectFilter,
                onChange: setProjectFilter,
                options: projects.map((p) => ({ value: p.id, label: `${p.client} — ${p.site}` })),
              },
              { label: 'Approval', value: approvalFilter, onChange: setApprovalFilter, options: APPROVAL_OPTIONS },
            ]}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="card text-sm text-gray-500 dark:text-gray-400">
            {updates.length === 0 ? 'No updates yet.' : 'No updates match the current filters.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((u) => (
              <div key={u.id} className="card">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatDate(u.work_date)}</div>
                    <div className="truncate text-xs text-gray-500 dark:text-gray-400">{projectLabel(u.project_id)}</div>
                  </div>
                  <StatusBadge status={u.approved_at ? 'completed' : 'pending'} />
                </div>
                <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">{u.work_done}</p>
                <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  {u.manpower_deployed} worker(s) deployed
                  {u.materials_used ? ` · ${u.materials_used}` : ''}
                </div>
                {canApprove && !u.approved_at && (
                  <button
                    className="btn btn-secondary w-full"
                    onClick={() => { setApprovingId(u.id); setProgressDelta(''); }}
                  >
                    Approve
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {approvingId && (
        <Modal title="Approve Daily Work Update" onClose={() => setApprovingId(null)}>
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              How much should this update add to the project's overall progress percentage?
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Progress % to add</label>
              <input
                type="number"
                autoFocus
                value={progressDelta}
                onChange={(e) => setProgressDelta(e.target.value)}
                placeholder="e.g. 2"
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
              />
            </div>
            {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">{error}</div>}
            <button className="btn btn-cyan w-full" onClick={confirmApprove}>Confirm Approval</button>
          </div>
        </Modal>
      )}

      {drilldown && (
        <Modal title={drilldown.title} onClose={() => setDrilldown(null)}>
          {drilldown.rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">No records.</p>
          ) : (
            <div className="space-y-1.5">{drilldown.rows}</div>
          )}
        </Modal>
      )}
    </div>
  );
}

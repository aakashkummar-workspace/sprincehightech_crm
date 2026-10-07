import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import StatusBadge from '../components/StatusBadge.jsx';
import BackButton from '../components/BackButton.jsx';

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [subcontractors, setSubcontractors] = useState([]);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignForm, setAssignForm] = useState({ subcontractor_id: '', assigned_work: '', contract_value: '' });
  const [error, setError] = useState('');

  function load() {
    api.get(`/projects/${id}`).then((res) => setProject(res.data));
  }

  useEffect(load, [id]);
  useEffect(() => {
    api.get('/subcontractors').then((res) => setSubcontractors(res.data));
  }, []);

  async function handleAssign(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/projects/${id}/subcontractor-assignments`, assignForm);
      setAssignForm({ subcontractor_id: '', assigned_work: '', contract_value: '' });
      setShowAssignForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign subcontractor');
    }
  }

  if (!project) return <div className="text-sm text-gray-500">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-xl font-semibold">{project.client}</h1>
            <p className="text-sm text-gray-500">{project.site} · {project.work_order || 'No work order'}</p>
          </div>
        </div>
        <StatusBadge status={project.work_status} />
      </div>

      <div className="card grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Detail label="Project Manager" value={project.project_manager_name || 'Unassigned'} />
        <Detail label="Project Value" value={`₹${Number(project.project_value || 0).toLocaleString('en-IN')}`} />
        <Detail label="Billing" value={`₹${Number(project.billing || 0).toLocaleString('en-IN')}`} />
        <Detail label="Payment Received" value={`₹${Number(project.payment_received || 0).toLocaleString('en-IN')}`} />
        <Detail label="Start Date" value={project.start_date ? new Date(project.start_date).toLocaleDateString('en-IN') : '—'} />
        <Detail label="End Date" value={project.end_date ? new Date(project.end_date).toLocaleDateString('en-IN') : '—'} />
        <Detail label="Progress" value={`${project.progress_percent}%`} />
      </div>

      {/* Subcontractors — Project A style breakdown */}
      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Subcontractors on this Project</h2>
          <button className="btn btn-secondary" onClick={() => setShowAssignForm((v) => !v)}>
            {showAssignForm ? 'Cancel' : 'Add Subcontractor'}
          </button>
        </div>

        {error && <div className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        {showAssignForm && (
          <form onSubmit={handleAssign} className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Subcontractor</label>
              <select
                required
                value={assignForm.subcontractor_id}
                onChange={(e) => setAssignForm({ ...assignForm, subcontractor_id: e.target.value })}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm"
              >
                <option value="">Select…</option>
                {subcontractors.map((s) => (
                  <option key={s.id} value={s.id}>{s.company_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Assigned Work</label>
              <input
                required
                placeholder="e.g. Civil Work, Painting"
                value={assignForm.assigned_work}
                onChange={(e) => setAssignForm({ ...assignForm, assigned_work: e.target.value })}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contract Value (₹)</label>
              <input
                type="number"
                value={assignForm.contract_value}
                onChange={(e) => setAssignForm({ ...assignForm, contract_value: e.target.value })}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-3">
              <button type="submit" className="btn btn-sky">Assign</button>
            </div>
          </form>
        )}

        {project.subcontractor_assignments.length === 0 ? (
          <p className="text-sm text-gray-500">No subcontractors assigned yet.</p>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4">Work</th>
                  <th className="py-2 pr-4">Subcontractor</th>
                  <th className="py-2 pr-4">Contract Value</th>
                  <th className="py-2 pr-4">Start Date</th>
                  <th className="py-2 pr-4">End Date</th>
                  <th className="py-2 pr-4">Progress</th>
                  <th className="py-2 pr-4">Bill Submitted</th>
                  <th className="py-2 pr-4">Bill Amount</th>
                  <th className="py-2 pr-4">Paid</th>
                  <th className="py-2 pr-4">Balance</th>
                  <th className="py-2 pr-4">Payment Date</th>
                  <th className="py-2">Documents</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {project.subcontractor_assignments.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2 pr-4">{a.assigned_work}</td>
                    <td className="py-2 pr-4">{a.company_name}</td>
                    <td className="py-2 pr-4">₹{Number(a.contract_value).toLocaleString('en-IN')}</td>
                    <td className="py-2 pr-4">{a.work_start_date ? new Date(a.work_start_date).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="py-2 pr-4">{a.work_end_date ? new Date(a.work_end_date).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="py-2 pr-4">{a.work_progress_percent}%</td>
                    <td className="py-2 pr-4">
                      <span className={`status-badge ${a.bill_submitted ? 'status-completed' : 'status-pending'}`}>
                        {a.bill_submitted ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="py-2 pr-4">₹{Number(a.bill_amount).toLocaleString('en-IN')}</td>
                    <td className="py-2 pr-4">₹{Number(a.paid_amount).toLocaleString('en-IN')}</td>
                    <td className="py-2 pr-4 font-medium">₹{Number(a.balance).toLocaleString('en-IN')}</td>
                    <td className="py-2 pr-4">{a.payment_date ? new Date(a.payment_date).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="py-2">{a.documents && a.documents.length ? `${a.documents.length} file(s)` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent daily work updates */}
      <div className="card">
        <h2 className="mb-2 text-sm font-semibold text-gray-700">Recent Daily Work Updates</h2>
        {project.recent_daily_updates.length === 0 ? (
          <p className="text-sm text-gray-500">No updates logged yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {project.recent_daily_updates.map((u) => (
              <li key={u.id} className="border-b border-gray-100 pb-2 last:border-0">
                <div className="flex justify-between">
                  <span className="font-medium">{new Date(u.work_date).toLocaleDateString('en-IN')}</span>
                  <span className="text-gray-500">{u.manpower_deployed} workers</span>
                </div>
                <p className="text-gray-700">{u.work_done}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-sm text-gray-900">{value}</div>
    </div>
  );
}

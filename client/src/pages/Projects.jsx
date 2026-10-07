import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import StatusBadge from '../components/StatusBadge.jsx';
import PageHeader from '../components/PageHeader.jsx';
import KpiCard from '../components/KpiCard.jsx';
import DetailField from '../components/DetailField.jsx';
import FilterBar from '../components/FilterBar.jsx';
import Modal from '../components/Modal.jsx';
import RowLink from '../components/RowLink.jsx';
import { currency, formatDate } from '../utils/format.js';

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
];
const REGION_OPTIONS = [
  { value: 'korba', label: 'Korba' },
  { value: 'delhi', label: 'Delhi' },
  { value: 'maharashtra', label: 'Maharashtra' },
];

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [drilldown, setDrilldown] = useState(null); // { title, rows }

  useEffect(() => {
    api.get('/projects').then((res) => setProjects(res.data));
  }, []);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter && p.work_status !== statusFilter) return false;
      if (regionFilter && p.region !== regionFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = `${p.client} ${p.site || ''} ${p.work_order || ''} ${p.project_manager_name || ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [projects, statusFilter, regionFilter, search]);

  const activeProjects = projects.filter((p) => p.work_status !== 'completed');
  const totalValue = projects.reduce((a, p) => a + Number(p.project_value || 0), 0);
  const totalBilling = projects.reduce((a, p) => a + Number(p.billing || 0), 0);
  const totalReceived = projects.reduce((a, p) => a + Number(p.payment_received || 0), 0);

  const projectRow = (p) => (
    <RowLink key={p.id} onClick={() => navigate(`/projects/${p.id}`)}>
      <div className="min-w-0">
        <div className="truncate font-medium text-gray-900 dark:text-gray-100">{p.client}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{p.site || 'No site'}</div>
      </div>
      <StatusBadge status={p.work_status} />
    </RowLink>
  );

  return (
    <div className="space-y-4">
      <PageHeader path="/projects" title="Projects" subtitle="Lifecycle tracking from tender award to completion." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Active Projects" value={activeProjects.length} tintIndex={1}
          onClick={() => setDrilldown({ title: 'Active Projects', rows: activeProjects.map(projectRow) })}
        />
        <KpiCard
          label="Total Project Value" value={currency(totalValue)} tintIndex={3}
          onClick={() => setDrilldown({ title: 'All Projects by Value', rows: [...projects].sort((a, b) => b.project_value - a.project_value).map(projectRow) })}
        />
        <KpiCard
          label="Total Billing" value={currency(totalBilling)} tintIndex={0}
          onClick={() => setDrilldown({ title: 'Billing by Project', rows: projects.filter((p) => p.billing > 0).map(projectRow) })}
        />
        <KpiCard
          label="Payment Received" value={currency(totalReceived)} tintIndex={2}
          onClick={() => setDrilldown({ title: 'Payment Received by Project', rows: projects.filter((p) => p.payment_received > 0).map(projectRow) })}
        />
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by client, site, work order…"
        filters={[
          { label: 'Status', value: statusFilter, onChange: setStatusFilter, options: STATUS_OPTIONS },
          { label: 'Region', value: regionFilter, onChange: setRegionFilter, options: REGION_OPTIONS },
        ]}
      />

      {filtered.length === 0 ? (
        <div className="card text-sm text-gray-500 dark:text-gray-400">
          {projects.length === 0 ? 'No projects yet.' : 'No projects match the current filters.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`} className="card block transition-shadow hover:shadow-lg">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{p.client}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{p.site || 'No site'} · {p.work_order || 'No work order'}</div>
                </div>
                <StatusBadge status={p.work_status} />
              </div>

              <div className="mb-3">
                <div className="mb-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Progress</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{p.progress_percent}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/50 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-sky-500"
                    style={{ width: `${Math.min(100, p.progress_percent)}%` }}
                  />
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                <DetailField label="Project Value" value={currency(p.project_value)} />
                <DetailField label="Project Manager" value={p.project_manager_name || 'Unassigned'} />
                <DetailField label="Start Date" value={formatDate(p.start_date)} />
                <DetailField label="End Date" value={formatDate(p.end_date)} />
                <DetailField label="Billing" value={currency(p.billing)} />
                <DetailField label="Payment" value={currency(p.payment_received)} />
              </dl>
            </Link>
          ))}
        </div>
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

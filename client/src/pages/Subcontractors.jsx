import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import PageHeader from '../components/PageHeader.jsx';
import KpiCard from '../components/KpiCard.jsx';
import DetailField from '../components/DetailField.jsx';
import FormField from '../components/FormField.jsx';
import FilterBar from '../components/FilterBar.jsx';
import Modal from '../components/Modal.jsx';
import RowLink from '../components/RowLink.jsx';
import { currency } from '../utils/format.js';

const PENDING_OPTIONS = [
  { value: 'work', label: 'Has Work Pending' },
  { value: 'bills', label: 'Has Bills Pending' },
  { value: 'payable', label: 'Has Payable Balance' },
];

export default function Subcontractors() {
  const navigate = useNavigate();
  const [subcontractors, setSubcontractors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ company_name: '', contact_name: '', contact_phone: '', contact_email: '' });
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [pendingFilter, setPendingFilter] = useState('');
  const [drilldown, setDrilldown] = useState(null);

  // Enrich the master list with each company's assignment rollup (payable,
  // work pending, bills pending) so the cards carry real signal, not just
  // contact details — mirrors what the detail page already computes.
  async function load() {
    const { data: list } = await api.get('/subcontractors');
    const enriched = await Promise.all(
      list.map(async (s) => {
        const { data: detail } = await api.get(`/subcontractors/${s.id}`);
        const assignments = detail.assignments || [];
        return {
          ...s,
          projectCount: assignments.length,
          payable: assignments.reduce((a, x) => a + Number(x.balance || 0), 0),
          workPending: assignments.filter((x) => Number(x.work_progress_percent) < 100).length,
          billsPending: assignments.filter((x) => !x.bill_submitted).length,
        };
      })
    );
    setSubcontractors(enriched);
  }
  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/subcontractors', form);
      setForm({ company_name: '', contact_name: '', contact_phone: '', contact_email: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add subcontractor');
    }
  }

  const totalPayable = subcontractors.reduce((a, s) => a + s.payable, 0);
  const totalWorkPending = subcontractors.reduce((a, s) => a + s.workPending, 0);
  const totalBillsPending = subcontractors.reduce((a, s) => a + s.billsPending, 0);

  const subRow = (s) => (
    <RowLink key={s.id} onClick={() => navigate(`/subcontractors/${s.id}`)}>
      <div className="min-w-0">
        <div className="truncate font-medium text-gray-900 dark:text-gray-100">{s.company_name}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{s.contact_name || 'No contact'}</div>
      </div>
      <span className="text-sm text-gray-600 dark:text-gray-300">{currency(s.payable)}</span>
    </RowLink>
  );

  const filtered = useMemo(() => {
    return subcontractors.filter((s) => {
      if (pendingFilter === 'work' && s.workPending === 0) return false;
      if (pendingFilter === 'bills' && s.billsPending === 0) return false;
      if (pendingFilter === 'payable' && s.payable === 0) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = `${s.company_name} ${s.contact_name || ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [subcontractors, pendingFilter, search]);

  return (
    <div className="space-y-4">
      <PageHeader
        path="/subcontractors"
        title="Subcontractors"
        subtitle="Companies working across one or more of your projects."
        action={
          <button className="btn btn-amber" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : 'Add Subcontractor'}
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Subcontractors" value={subcontractors.length} tintIndex={3}
          onClick={() => setDrilldown({ title: 'All Subcontractors', rows: subcontractors.map(subRow) })}
        />
        <KpiCard
          label="Total Payable" value={currency(totalPayable)} tintIndex={4}
          onClick={() => setDrilldown({ title: 'Subcontractors with Payable Balance', rows: subcontractors.filter((s) => s.payable > 0).map(subRow) })}
        />
        <KpiCard
          label="Work Pending" value={totalWorkPending} tintIndex={1}
          onClick={() => setDrilldown({ title: 'Subcontractors with Work Pending', rows: subcontractors.filter((s) => s.workPending > 0).map(subRow) })}
        />
        <KpiCard
          label="Bills Pending" value={totalBillsPending} tintIndex={2}
          onClick={() => setDrilldown({ title: 'Subcontractors with Bills Pending', rows: subcontractors.filter((s) => s.billsPending > 0).map(subRow) })}
        />
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card grid grid-cols-1 gap-3 sm:grid-cols-2">
          {error && <div className="sm:col-span-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">{error}</div>}
          <FormField label="Company / Name" value={form.company_name} onChange={(v) => setForm({ ...form, company_name: v })} required />
          <FormField label="Contact Name" value={form.contact_name} onChange={(v) => setForm({ ...form, contact_name: v })} />
          <FormField label="Phone" value={form.contact_phone} onChange={(v) => setForm({ ...form, contact_phone: v })} />
          <FormField label="Email" value={form.contact_email} onChange={(v) => setForm({ ...form, contact_email: v })} />
          <div className="sm:col-span-2">
            <button type="submit" className="btn btn-amber">Save</button>
          </div>
        </form>
      )}

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by company or contact name…"
        filters={[
          { label: 'Pending', value: pendingFilter, onChange: setPendingFilter, options: PENDING_OPTIONS },
        ]}
      />

      {filtered.length === 0 ? (
        <div className="card text-sm text-gray-500 dark:text-gray-400">
          {subcontractors.length === 0 ? 'No subcontractors yet.' : 'No subcontractors match the current filters.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <Link key={s.id} to={`/subcontractors/${s.id}`} className="card block transition-shadow hover:shadow-lg">
              <div className="mb-2 min-w-0">
                <div className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{s.company_name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{s.contact_name || 'No contact'}</div>
              </div>

              <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                <DetailField label="Phone" value={s.contact_phone || '—'} />
                <DetailField label="Email" value={s.contact_email || '—'} />
                <DetailField label="Projects" value={s.projectCount} />
                <DetailField label="Payable" value={currency(s.payable)} />
                <DetailField label="Work Pending" value={`${s.workPending} assignment(s)`} wide />
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

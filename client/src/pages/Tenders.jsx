import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import StatusBadge from '../components/StatusBadge.jsx';
import PageHeader from '../components/PageHeader.jsx';
import DetailField from '../components/DetailField.jsx';
import FormField from '../components/FormField.jsx';
import FilterBar from '../components/FilterBar.jsx';
import { currency, formatDate, capitalize } from '../utils/format.js';

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'under_evaluation', label: 'Under Evaluation' },
  { value: 'bid_preparing', label: 'Bid Preparing' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];
const REGION_OPTIONS = [
  { value: 'korba', label: 'Korba' },
  { value: 'delhi', label: 'Delhi' },
  { value: 'maharashtra', label: 'Maharashtra' },
];

const emptyForm = {
  tender_code: '', organisation: '', tender_name: '', work_description: '',
  tender_value: '', emd: '', tender_fee: '', submission_date: '', opening_date: '',
  eligibility: '', region: '',
};

export default function Tenders() {
  const [tenders, setTenders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');

  function load() {
    api.get('/tenders').then((res) => setTenders(res.data));
  }

  useEffect(load, []);

  const filtered = useMemo(() => {
    return tenders.filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false;
      if (regionFilter && t.region !== regionFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = `${t.tender_name} ${t.tender_code} ${t.organisation}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [tenders, statusFilter, regionFilter, search]);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/tenders', form);
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create tender');
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        path="/tenders"
        title="Tender Register"
        subtitle="Track bids from submission through award."
        action={
          <button className="btn btn-violet" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : 'Add New Tender'}
          </button>
        }
      />

      {showForm && (
        <form onSubmit={handleCreate} className="card grid grid-cols-1 gap-3 sm:grid-cols-2">
          {error && <div className="sm:col-span-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <FormField label="Tender ID" value={form.tender_code} onChange={(v) => setForm({ ...form, tender_code: v })} required />
          <FormField label="Organisation" value={form.organisation} onChange={(v) => setForm({ ...form, organisation: v })} required />
          <FormField label="Tender Name" value={form.tender_name} onChange={(v) => setForm({ ...form, tender_name: v })} required className="sm:col-span-2" />
          <FormField label="Work Description" value={form.work_description} onChange={(v) => setForm({ ...form, work_description: v })} className="sm:col-span-2" textarea />
          <FormField label="Tender Value (₹)" type="number" value={form.tender_value} onChange={(v) => setForm({ ...form, tender_value: v })} />
          <FormField label="EMD (₹)" type="number" value={form.emd} onChange={(v) => setForm({ ...form, emd: v })} />
          <FormField label="Tender Fee (₹)" type="number" value={form.tender_fee} onChange={(v) => setForm({ ...form, tender_fee: v })} />
          <FormField label="Eligibility" value={form.eligibility} onChange={(v) => setForm({ ...form, eligibility: v })} />
          <FormField label="Submission Date" type="date" value={form.submission_date} onChange={(v) => setForm({ ...form, submission_date: v })} />
          <FormField label="Opening Date" type="date" value={form.opening_date} onChange={(v) => setForm({ ...form, opening_date: v })} />
          <div>
            <label className="block text-sm font-medium text-gray-700">Region</label>
            <select
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm"
            >
              <option value="">Select region</option>
              <option value="korba">Korba</option>
              <option value="delhi">Delhi</option>
              <option value="maharashtra">Maharashtra</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn btn-primary">Save Tender</button>
          </div>
        </form>
      )}

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, ID, organisation…"
        filters={[
          { label: 'Status', value: statusFilter, onChange: setStatusFilter, options: STATUS_OPTIONS },
          { label: 'Region', value: regionFilter, onChange: setRegionFilter, options: REGION_OPTIONS },
        ]}
      />

      {filtered.length === 0 ? (
        <div className="card text-sm text-gray-500">
          {tenders.length === 0 ? 'No tenders yet.' : 'No tenders match the current filters.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t) => (
            <Link key={t.id} to={`/tenders/${t.id}`} className="card block transition-shadow hover:shadow-lg">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-gray-900">{t.tender_name}</div>
                  <div className="text-xs text-gray-500">{t.tender_code} · {t.organisation}</div>
                </div>
                <StatusBadge status={t.status} />
              </div>

              {t.work_description && (
                <p className="mb-3 line-clamp-2 text-xs text-gray-500">{t.work_description}</p>
              )}

              <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                <DetailField label="Tender Value" value={currency(t.tender_value)} />
                <DetailField label="EMD" value={currency(t.emd)} />
                <DetailField label="Tender Fee" value={currency(t.tender_fee)} />
                <DetailField label="Region" value={capitalize(t.region)} />
                <DetailField label="Submission Date" value={formatDate(t.submission_date)} />
                <DetailField label="Opening Date" value={formatDate(t.opening_date)} />
                <DetailField label="Eligibility" value={t.eligibility || '—'} wide />
                <DetailField label="Documents" value={t.documents?.length ? `${t.documents.length} file(s)` : '—'} />
              </dl>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

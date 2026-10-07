import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import StatusBadge from '../components/StatusBadge.jsx';
import BackButton from '../components/BackButton.jsx';

const STAGES = ['new', 'under_evaluation', 'bid_preparing', 'submitted', 'won', 'lost'];
const STAGE_LABELS = {
  new: 'New', under_evaluation: 'Under Evaluation', bid_preparing: 'Bid Preparing',
  submitted: 'Submitted', won: 'Won', lost: 'Lost',
};

export default function TenderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tender, setTender] = useState(null);
  const [error, setError] = useState('');
  const [converting, setConverting] = useState(false);

  function load() {
    api.get(`/tenders/${id}`).then((res) => setTender(res.data));
  }

  useEffect(load, [id]);

  async function updateStatus(status) {
    setError('');
    try {
      await api.patch(`/tenders/${id}/status`, { status });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status');
    }
  }

  async function handleConvert() {
    setError('');
    try {
      const { data } = await api.post(`/tenders/${id}/convert-to-project`, {});
      navigate(`/projects/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to convert tender');
    } finally {
      setConverting(false);
    }
  }

  if (!tender) return <div className="text-sm text-gray-500">Loading…</div>;

  const linearStages = ['new', 'under_evaluation', 'bid_preparing', 'submitted'];
  const currentIdx = linearStages.indexOf(tender.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-xl font-semibold">{tender.tender_name}</h1>
            <p className="text-sm text-gray-500">{tender.tender_code} · {tender.organisation}</p>
          </div>
        </div>
        <StatusBadge status={tender.status} />
      </div>

      {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {/* Workflow stepper */}
      <div className="card">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Tender Status Workflow</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {linearStages.map((stage, idx) => (
            <button
              key={stage}
              onClick={() => updateStatus(stage)}
              disabled={tender.status === 'won' || tender.status === 'lost'}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                idx <= currentIdx && currentIdx >= 0
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 text-gray-500'
              } disabled:opacity-50`}
            >
              {STAGE_LABELS[stage]}
            </button>
          ))}
          <span className="text-gray-300">→</span>
          <button
            onClick={() => updateStatus('won')}
            className="rounded-full bg-green-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            Won
          </button>
          <button
            onClick={() => updateStatus('lost')}
            className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            Lost
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="card grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Detail label="Tender Value" value={`₹${Number(tender.tender_value || 0).toLocaleString('en-IN')}`} />
        <Detail label="EMD" value={`₹${Number(tender.emd || 0).toLocaleString('en-IN')}`} />
        <Detail label="Tender Fee" value={`₹${Number(tender.tender_fee || 0).toLocaleString('en-IN')}`} />
        <Detail label="Eligibility" value={tender.eligibility || '—'} />
        <Detail label="Submission Date" value={tender.submission_date ? new Date(tender.submission_date).toLocaleDateString('en-IN') : '—'} />
        <Detail label="Opening Date" value={tender.opening_date ? new Date(tender.opening_date).toLocaleDateString('en-IN') : '—'} />
        <Detail label="Region" value={tender.region || '—'} />
        <div className="sm:col-span-2">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Work Description</div>
          <p className="mt-1 text-sm text-gray-700">{tender.work_description || '—'}</p>
        </div>
      </div>

      {/* Documents */}
      <div className="card">
        <h2 className="mb-2 text-sm font-semibold text-gray-700">Documents</h2>
        {tender.documents.length === 0 ? (
          <p className="text-sm text-gray-500">No documents uploaded.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {tender.documents.map((d) => (
              <li key={d.id}><a href={d.file_url} className="text-violet-600 hover:underline">{d.file_name}</a></li>
            ))}
          </ul>
        )}
      </div>

      {tender.status === 'won' && (
        <div className="card flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-700">Ready to start work</div>
            <p className="text-sm text-gray-500">Convert this won tender into a Project.</p>
          </div>
          <button onClick={handleConvert} disabled={converting} className="btn btn-violet">
            {converting ? 'Converting…' : 'Convert to Project'}
          </button>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-sm text-gray-900 capitalize">{value}</div>
    </div>
  );
}

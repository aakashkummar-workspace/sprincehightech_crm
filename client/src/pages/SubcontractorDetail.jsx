import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import KpiCard from '../components/KpiCard.jsx';
import BackButton from '../components/BackButton.jsx';

const currency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '—');

export default function SubcontractorDetail() {
  const { id } = useParams();
  const [sub, setSub] = useState(null);

  function load() {
    api.get(`/subcontractors/${id}`).then((res) => setSub(res.data));
  }
  useEffect(load, [id]);

  if (!sub) return <div className="text-sm text-gray-500 dark:text-gray-400">Loading…</div>;

  const totalPayable = sub.assignments.reduce((acc, a) => acc + Number(a.balance), 0);
  const workPending = sub.assignments.filter((a) => Number(a.work_progress_percent) < 100).length;
  const billsPending = sub.assignments.filter((a) => !a.bill_submitted).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="text-xl font-semibold">{sub.company_name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{sub.contact_name} · {sub.contact_phone} · {sub.contact_email}</p>
        </div>
      </div>

      {/* Subcontractor Dashboard — Payable / Work Pending / Bills Pending */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Subcontractor Payable" value={currency(totalPayable)} />
        <KpiCard label="Work Pending" value={`${workPending} assignment(s)`} />
        <KpiCard label="Bills Pending" value={`${billsPending} assignment(s)`} />
      </div>

      <div className="card overflow-x-auto scrollbar-hide">
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Work Across Projects ({sub.assignments.length})
        </h2>
        {sub.assignments.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No project assignments yet.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-white/10">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400">
                <th className="py-2 pr-4">Project / Site</th>
                <th className="py-2 pr-4">Work</th>
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
            <tbody className="divide-y divide-gray-100 dark:divide-white/10">
              {sub.assignments.map((a) => (
                <tr key={a.id}>
                  <td className="py-2 pr-4">{a.client} — {a.site}</td>
                  <td className="py-2 pr-4">{a.assigned_work}</td>
                  <td className="py-2 pr-4">{currency(a.contract_value)}</td>
                  <td className="py-2 pr-4">{formatDate(a.work_start_date)}</td>
                  <td className="py-2 pr-4">{formatDate(a.work_end_date)}</td>
                  <td className="py-2 pr-4">{a.work_progress_percent}%</td>
                  <td className="py-2 pr-4">
                    <span className={`status-badge ${a.bill_submitted ? 'status-completed' : 'status-pending'}`}>
                      {a.bill_submitted ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="py-2 pr-4">{currency(a.bill_amount)}</td>
                  <td className="py-2 pr-4">{currency(a.paid_amount)}</td>
                  <td className="py-2 pr-4 font-medium">{currency(a.balance)}</td>
                  <td className="py-2 pr-4">{formatDate(a.payment_date)}</td>
                  <td className="py-2">
                    {a.documents && a.documents.length ? `${a.documents.length} file(s)` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

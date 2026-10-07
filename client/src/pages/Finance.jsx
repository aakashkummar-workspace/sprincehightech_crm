import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import StatusBadge from '../components/StatusBadge.jsx';
import PageHeader from '../components/PageHeader.jsx';
import KpiCard from '../components/KpiCard.jsx';
import DetailField from '../components/DetailField.jsx';
import FormField from '../components/FormField.jsx';
import FilterBar from '../components/FilterBar.jsx';
import Modal from '../components/Modal.jsx';
import { currency, formatDate } from '../utils/format.js';

const PAYMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
];
const GST_STATUS_OPTIONS = [
  { value: 'filed', label: 'Filed' },
  { value: 'not_filed', label: 'Not Filed' },
];

export default function Finance() {
  const [invoices, setInvoices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    invoice_number: '', invoice_date: '', customer: '', gstin: '',
    taxable_value: '', is_inter_state: false, due_date: '',
  });
  const [calc, setCalc] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [gstFilter, setGstFilter] = useState('');
  const [drilldown, setDrilldown] = useState(null);

  function load() {
    api.get('/invoices').then((res) => setInvoices(res.data));
  }
  useEffect(load, []);

  async function handleCalculate() {
    setError('');
    try {
      const { data } = await api.post('/invoices/calculate', {
        taxable_value: Number(form.taxable_value) || 0,
        is_inter_state: form.is_inter_state,
      });
      setCalc(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to calculate GST');
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/invoices', {
        ...form,
        taxable_value: Number(form.taxable_value) || 0,
        cgst: calc?.cgst || 0,
        sgst: calc?.sgst || 0,
        igst: calc?.igst || 0,
      });
      setForm({ invoice_number: '', invoice_date: '', customer: '', gstin: '', taxable_value: '', is_inter_state: false, due_date: '' });
      setCalc(null);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create invoice');
    }
  }

  async function updateStatus(id, field, value) {
    setError('');
    // Optimistic update so the dropdown feels instant; reconciled by the
    // PATCH response (or reverted via reload on failure).
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, [field]: value } : inv)));
    try {
      await api.patch(`/invoices/${id}`, { [field]: value });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status');
      load();
    }
  }

  const totalRevenue = invoices.reduce((a, i) => a + Number(i.total_amount || 0), 0);
  const receivableInvoices = invoices.filter((i) => i.payment_status !== 'paid');
  const receivables = receivableInvoices.reduce((a, i) => a + Number(i.total_amount || 0), 0);
  const filedInvoices = invoices.filter((i) => i.gst_filing_status === 'filed');
  const notFiledInvoices = invoices.filter((i) => i.gst_filing_status !== 'filed');

  const invoiceRow = (inv) => (
    <div key={inv.id} className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/40 bg-white/40 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10">
      <div className="min-w-0">
        <div className="truncate font-medium text-gray-900 dark:text-gray-100">{inv.invoice_number}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{inv.customer} · {formatDate(inv.invoice_date)}</div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-300">{currency(inv.total_amount)}</span>
        <StatusBadge status={inv.payment_status} />
      </div>
    </div>
  );

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      if (paymentFilter && inv.payment_status !== paymentFilter) return false;
      if (gstFilter && inv.gst_filing_status !== gstFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = `${inv.invoice_number} ${inv.customer} ${inv.gstin || ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [invoices, paymentFilter, gstFilter, search]);

  return (
    <div className="space-y-4">
      <PageHeader
        path="/finance"
        title="GST & Finance"
        subtitle="Invoice and GST tracking layer — not a filing system."
        action={
          <button className="btn btn-rose" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : 'New Invoice'}
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Revenue" value={currency(totalRevenue)} tintIndex={0}
          onClick={() => setDrilldown({ title: 'All Invoices (Revenue)', rows: invoices.map(invoiceRow) })}
        />
        <KpiCard
          label="Receivables" value={currency(receivables)} tintIndex={4}
          onClick={() => setDrilldown({ title: 'Outstanding Receivables', rows: receivableInvoices.map(invoiceRow) })}
        />
        <KpiCard
          label="GST Filed" value={filedInvoices.length} tintIndex={2}
          onClick={() => setDrilldown({ title: 'GST Filed Invoices', rows: filedInvoices.map(invoiceRow) })}
        />
        <KpiCard
          label="GST Not Filed" value={notFiledInvoices.length} tintIndex={3}
          onClick={() => setDrilldown({ title: 'GST Not Filed Invoices', rows: notFiledInvoices.map(invoiceRow) })}
        />
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card grid grid-cols-1 gap-3 sm:grid-cols-3">
          {error && <div className="sm:col-span-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">{error}</div>}
          <FormField label="Invoice Number" value={form.invoice_number} onChange={(v) => setForm({ ...form, invoice_number: v })} required />
          <FormField label="Invoice Date" type="date" value={form.invoice_date} onChange={(v) => setForm({ ...form, invoice_date: v })} required />
          <FormField label="Customer" value={form.customer} onChange={(v) => setForm({ ...form, customer: v })} required />
          <FormField label="GSTIN" value={form.gstin} onChange={(v) => setForm({ ...form, gstin: v })} />
          <FormField label="Taxable Value (₹)" type="number" value={form.taxable_value} onChange={(v) => setForm({ ...form, taxable_value: v })} required />
          <FormField label="Due Date" type="date" value={form.due_date} onChange={(v) => setForm({ ...form, due_date: v })} />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_inter_state}
              onChange={(e) => setForm({ ...form, is_inter_state: e.target.checked })}
            />
            <label className="text-sm text-gray-700 dark:text-gray-300">Inter-state (IGST applies)</label>
          </div>
          <div className="sm:col-span-3 flex items-center gap-3">
            <button type="button" className="btn btn-secondary" onClick={handleCalculate}>
              Calculate GST (18%)
            </button>
            {calc && (
              <span className="rounded-full bg-white/60 px-3 py-1.5 text-xs text-gray-700 dark:bg-white/10 dark:text-gray-300">
                CGST {currency(calc.cgst)} · SGST {currency(calc.sgst)} · IGST {currency(calc.igst)} ·
                <strong> Total {currency(calc.total_amount)}</strong>
              </span>
            )}
          </div>
          <div className="sm:col-span-3">
            <button type="submit" className="btn btn-rose">Save Invoice</button>
          </div>
        </form>
      )}

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by invoice #, customer, GSTIN…"
        filters={[
          { label: 'Payment Status', value: paymentFilter, onChange: setPaymentFilter, options: PAYMENT_STATUS_OPTIONS },
          { label: 'GST Filing', value: gstFilter, onChange: setGstFilter, options: GST_STATUS_OPTIONS },
        ]}
      />

      {filtered.length === 0 ? (
        <div className="card text-sm text-gray-500 dark:text-gray-400">
          {invoices.length === 0 ? 'No invoices yet.' : 'No invoices match the current filters.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((inv) => (
            <div key={inv.id} className="card">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{inv.invoice_number}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{inv.customer} · {formatDate(inv.invoice_date)}</div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <StatusSelect
                    value={inv.payment_status}
                    options={PAYMENT_STATUS_OPTIONS}
                    onChange={(v) => updateStatus(inv.id, 'payment_status', v)}
                  />
                  <StatusSelect
                    value={inv.gst_filing_status}
                    options={GST_STATUS_OPTIONS}
                    onChange={(v) => updateStatus(inv.id, 'gst_filing_status', v)}
                  />
                </div>
              </div>

              <div className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-100">{currency(inv.total_amount)}</div>

              <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                <DetailField label="GSTIN" value={inv.gstin || '—'} wide />
                <DetailField label="Taxable Value" value={currency(inv.taxable_value)} />
                <DetailField label="Due Date" value={formatDate(inv.due_date)} />
                <DetailField label="CGST" value={currency(inv.cgst)} />
                <DetailField label="SGST" value={currency(inv.sgst)} />
                <DetailField label="IGST" value={currency(inv.igst)} wide />
              </dl>
            </div>
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

// A <select> styled to look like a status-badge pill, so changing a status
// in place doesn't break the card's visual language. Stops the click from
// bubbling to the card (no row-level onClick here, but kept defensive in
// case one is added later).
function StatusSelect({ value, options, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      className={`status-badge status-${value} cursor-pointer appearance-none border-0 bg-transparent bg-[length:0] pr-1 capitalize outline-none`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">
          {opt.label}
        </option>
      ))}
    </select>
  );
}

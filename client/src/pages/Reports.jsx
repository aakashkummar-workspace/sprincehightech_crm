import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import PageHeader from '../components/PageHeader.jsx';
import KpiCard from '../components/KpiCard.jsx';
import { currency, formatDate } from '../utils/format.js';
import { downloadCsv } from '../utils/csv.js';

// jsPDF + autotable (and its transitive html2canvas/dompurify deps) are
// only needed when someone actually clicks "Download PDF" — lazy-load so
// the ~230KB isn't fetched on every page load for a feature most visits
// won't use.
async function downloadPdf(...args) {
  const { downloadPdf: run } = await import('../utils/pdf.js');
  return run(...args);
}

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [tenders, setTenders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    (async () => {
      const [t, p, e, inv, pr, subs] = await Promise.all([
        api.get('/tenders'),
        api.get('/projects'),
        api.get('/employees'),
        api.get('/invoices'),
        api.get('/payroll'),
        api.get('/subcontractors'),
      ]);
      const assignmentLists = await Promise.all(
        subs.data.map((s) => api.get(`/subcontractors/${s.id}`).then((r) => r.data.assignments || []))
      );
      setTenders(t.data);
      setProjects(p.data);
      setEmployees(e.data);
      setInvoices(inv.data);
      setPayroll(pr.data);
      setAssignments(assignmentLists.flat());
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="text-sm text-gray-500">Loading reports…</div>;

  // --- Tender win rate ---
  const closedTenders = tenders.filter((t) => ['won', 'lost'].includes(t.status));
  const wonTenders = tenders.filter((t) => t.status === 'won');
  const winRate = closedTenders.length ? Math.round((wonTenders.length / closedTenders.length) * 100) : 0;
  const wonValue = wonTenders.reduce((a, t) => a + Number(t.tender_value || 0), 0);

  // --- Region comparison ---
  const regions = ['korba', 'delhi', 'maharashtra'];
  const regionStats = regions.map((region) => {
    const regionProjects = projects.filter((p) => p.region === region);
    const regionTenders = tenders.filter((t) => t.region === region);
    const regionEmployees = employees.filter((e) => e.region === region && e.is_active);
    return {
      region,
      projectCount: regionProjects.length,
      projectValue: regionProjects.reduce((a, p) => a + Number(p.project_value || 0), 0),
      tenderCount: regionTenders.length,
      employeeCount: regionEmployees.length,
    };
  });

  // --- Project profitability (tender/project value vs. cost so far) ---
  const projectProfitability = projects.map((p) => {
    const subCost = assignments
      .filter((a) => a.project_id === p.id)
      .reduce((a, x) => a + Number(x.paid_amount || 0), 0);
    const totalCost = subCost; // payroll isn't tied to a project in this schema, so subcontractor spend is the visible cost driver
    const margin = Number(p.billing || 0) - totalCost;
    return { ...p, subCost, margin };
  });

  // --- Payroll cost by month ---
  const payrollByPeriod = {};
  payroll.forEach((r) => {
    const key = `${r.period_month}/${r.period_year}`;
    if (!payrollByPeriod[key]) payrollByPeriod[key] = { key, gross: 0, net: 0, count: 0 };
    payrollByPeriod[key].gross += Number(r.gross_salary || 0);
    payrollByPeriod[key].net += Number(r.net_salary || 0);
    payrollByPeriod[key].count += 1;
  });
  const payrollTrend = Object.values(payrollByPeriod).sort((a, b) => a.key.localeCompare(b.key));

  // --- GST summary ---
  const totalGst = invoices.reduce((a, i) => a + Number(i.cgst || 0) + Number(i.sgst || 0) + Number(i.igst || 0), 0);
  const totalInvoiced = invoices.reduce((a, i) => a + Number(i.total_amount || 0), 0);

  // --- Report column definitions (shared by both the on-screen table and
  //     the CSV/PDF export, so each report's fields are declared once) ---
  const tenderColumns = [
    { label: 'Tender ID', value: (r) => r.tender_code },
    { label: 'Organisation', value: (r) => r.organisation },
    { label: 'Name', value: (r) => r.tender_name },
    { label: 'Value', value: (r) => currency(r.tender_value) },
    { label: 'Status', value: (r) => r.status.replace('_', ' ') },
    { label: 'Region', value: (r) => r.region },
    { label: 'Submission Date', value: (r) => formatDate(r.submission_date) },
  ];

  const regionColumns = [
    { label: 'Region', value: (r) => r.region },
    { label: 'Projects', value: (r) => r.projectCount },
    { label: 'Project Value', value: (r) => currency(r.projectValue) },
    { label: 'Tenders', value: (r) => r.tenderCount },
    { label: 'Active Employees', value: (r) => r.employeeCount },
  ];

  const profitabilityColumns = [
    { label: 'Client', value: (r) => r.client },
    { label: 'Site', value: (r) => r.site },
    { label: 'Project Value', value: (r) => currency(r.project_value) },
    { label: 'Billing', value: (r) => currency(r.billing) },
    { label: 'Subcontractor Cost', value: (r) => currency(r.subCost) },
    { label: 'Margin', value: (r) => currency(r.margin) },
  ];

  const payrollColumns = [
    { label: 'Period', value: (r) => r.key },
    { label: 'Employees Paid', value: (r) => r.count },
    { label: 'Gross Total', value: (r) => currency(r.gross) },
    { label: 'Net Total', value: (r) => currency(r.net) },
  ];

  const gstColumns = [
    { label: 'Invoice #', value: (r) => r.invoice_number },
    { label: 'Customer', value: (r) => r.customer },
    { label: 'Date', value: (r) => formatDate(r.invoice_date) },
    { label: 'Taxable Value', value: (r) => currency(r.taxable_value) },
    { label: 'CGST', value: (r) => currency(r.cgst) },
    { label: 'SGST', value: (r) => currency(r.sgst) },
    { label: 'IGST', value: (r) => currency(r.igst) },
    { label: 'Total', value: (r) => currency(r.total_amount) },
    { label: 'Payment Status', value: (r) => r.payment_status.replace('_', ' ') },
    { label: 'GST Filing Status', value: (r) => r.gst_filing_status.replace('_', ' ') },
  ];

  return (
    <div className="space-y-6">
      <PageHeader path="/reports" title="Reports" subtitle="Cross-module summaries — win rate, profitability, regional comparison, payroll trends." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Tender Win Rate" value={`${winRate}%`} hint={`${wonTenders.length} of ${closedTenders.length} closed`} tintIndex={0} />
        <KpiCard label="Won Tender Value" value={currency(wonValue)} tintIndex={2} />
        <KpiCard label="Total GST Collected" value={currency(totalGst)} tintIndex={3} />
        <KpiCard label="Total Invoiced" value={currency(totalInvoiced)} tintIndex={4} />
      </div>

      <ReportSection
        title="Tender Pipeline"
        subtitle="Every tender, current stage and value."
        filename="tender-pipeline"
        columns={tenderColumns}
        rows={tenders}
      />

      <ReportSection
        title="Region Comparison"
        subtitle="Projects, tenders, value and workforce by region."
        filename="region-comparison"
        columns={regionColumns}
        rows={regionStats}
      />

      <ReportSection
        title="Project Profitability"
        subtitle="Billing vs. subcontractor spend so far, per project."
        filename="project-profitability"
        columns={profitabilityColumns}
        rows={projectProfitability}
      />

      <ReportSection
        title="Payroll Cost by Period"
        subtitle="Gross vs. net payout per pay period run so far."
        filename="payroll-trend"
        columns={payrollColumns}
        rows={payrollTrend}
        emptyText="No payroll runs yet."
      />

      <ReportSection
        title="GST Summary"
        subtitle="Taxable value, tax collected and filing status per invoice."
        filename="gst-summary"
        columns={gstColumns}
        rows={invoices}
      />

      <div className="text-xs text-gray-400">Totals above reflect the data currently loaded — {formatDate(new Date())}.</div>
    </div>
  );
}

function ReportSection({ title, subtitle, filename, columns, rows, emptyText = 'No records yet.' }) {
  return (
    <div className="card">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button className="btn btn-secondary text-xs" onClick={() => downloadCsv(filename, columns, rows)}>
            Export CSV
          </button>
          <button
            className="btn btn-indigo text-xs"
            onClick={() => downloadPdf(filename, title, columns, rows, { subtitle })}
          >
            Download PDF
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyText}</p>
      ) : (
        <div className="overflow-x-auto scrollbar-hide">
          <table className="min-w-full divide-y divide-white/40 text-sm">
            <thead className="bg-white/20">
              <tr className="text-left text-gray-600">
                {columns.map((c) => (
                  <th key={c.label} className="whitespace-nowrap py-2 pl-3 pr-4 first:pl-3">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/30">
              {rows.map((row, i) => (
                <tr key={row.id || row.region || row.key || i}>
                  {columns.map((c) => (
                    <td key={c.label} className="whitespace-nowrap py-2 pl-3 pr-4 capitalize first:font-medium first:text-gray-800">
                      {c.value(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

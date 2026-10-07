import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import StatusBadge from '../components/StatusBadge.jsx';
import PageHeader from '../components/PageHeader.jsx';
import KpiCard from '../components/KpiCard.jsx';
import DetailField from '../components/DetailField.jsx';
import FormField from '../components/FormField.jsx';
import FilterBar from '../components/FilterBar.jsx';
import Modal from '../components/Modal.jsx';
import { currency, formatDate, capitalize } from '../utils/format.js';

const REGION_OPTIONS = [
  { value: 'korba', label: 'Korba' },
  { value: 'delhi', label: 'Delhi' },
  { value: 'maharashtra', label: 'Maharashtra' },
];
const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function Employees() {
  const [tab, setTab] = useState('employees'); // employees | attendance | payroll
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: '', designation: '', department: '', region: '', site: '', joining_date: '', base_salary: '' });
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [drilldown, setDrilldown] = useState(null);

  function load() {
    api.get('/employees').then((res) => setEmployees(res.data));
  }
  useEffect(load, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/employees', form);
      setForm({ full_name: '', designation: '', department: '', region: '', site: '', joining_date: '', base_salary: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add employee');
    }
  }

  const activeEmployees = employees.filter((e) => e.is_active);
  const inactiveEmployees = employees.filter((e) => !e.is_active);
  const totalSalary = activeEmployees.reduce((a, e) => a + Number(e.base_salary || 0), 0);
  const departments = [...new Set(employees.map((e) => e.department).filter(Boolean))];

  const empRow = (e) => (
    <div key={e.id} className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/40 bg-white/40 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10">
      <div className="min-w-0">
        <div className="truncate font-medium text-gray-900 dark:text-gray-100">{e.full_name}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{e.designation || 'No designation'} · {capitalize(e.region)}</div>
      </div>
      <span className="text-sm text-gray-600 dark:text-gray-300">{currency(e.base_salary)}</span>
    </div>
  );

  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      if (regionFilter && e.region !== regionFilter) return false;
      if (statusFilter === 'active' && !e.is_active) return false;
      if (statusFilter === 'inactive' && e.is_active) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = `${e.full_name} ${e.designation || ''} ${e.department || ''} ${e.site || ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [employees, regionFilter, statusFilter, search]);

  return (
    <div className="space-y-4">
      <PageHeader
        path="/employees"
        title="Employees & Payroll"
        subtitle="Master records, attendance, and payroll in one place."
        action={
          tab === 'employees' && (
            <button className="btn btn-emerald" onClick={() => setShowForm((v) => !v)}>
              {showForm ? 'Cancel' : 'Add Employee'}
            </button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Active Employees" value={activeEmployees.length} tintIndex={2}
          onClick={() => setDrilldown({ title: 'Active Employees', rows: activeEmployees.map(empRow) })}
        />
        <KpiCard
          label="Inactive Employees" value={inactiveEmployees.length} tintIndex={3}
          onClick={() => setDrilldown({ title: 'Inactive Employees', rows: inactiveEmployees.map(empRow) })}
        />
        <KpiCard
          label="Total Monthly Salary" value={currency(totalSalary)} tintIndex={0}
          onClick={() => setDrilldown({ title: 'Salary by Employee (Active)', rows: [...activeEmployees].sort((a, b) => b.base_salary - a.base_salary).map(empRow) })}
        />
        <KpiCard
          label="Departments" value={departments.length} tintIndex={1}
          onClick={() => setDrilldown({
            title: 'Employees by Department',
            rows: departments.map((d) => (
              <div key={d} className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/40 bg-white/40 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/10">
                <span className="font-medium text-gray-900 dark:text-gray-100">{d}</span>
                <span className="text-sm text-gray-600 dark:text-gray-300">{employees.filter((e) => e.department === d).length} employee(s)</span>
              </div>
            )),
          })}
        />
      </div>

      <div className="flex gap-2 rounded-full bg-white/50 p-1 dark:bg-white/5">
        {['employees', 'attendance', 'payroll'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
              tab === t ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:bg-white/70 dark:text-gray-300 dark:hover:bg-white/10'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'employees' && (
        <>
          {showForm && (
            <form onSubmit={handleCreate} className="card grid grid-cols-1 gap-3 sm:grid-cols-3">
              {error && <div className="sm:col-span-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">{error}</div>}
              <FormField label="Full Name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} required />
              <FormField label="Designation" value={form.designation} onChange={(v) => setForm({ ...form, designation: v })} />
              <FormField label="Department" value={form.department} onChange={(v) => setForm({ ...form, department: v })} />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Region</label>
                <select
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
                >
                  <option value="">Select region</option>
                  <option value="korba">Korba</option>
                  <option value="delhi">Delhi</option>
                  <option value="maharashtra">Maharashtra</option>
                </select>
              </div>
              <FormField label="Site" value={form.site} onChange={(v) => setForm({ ...form, site: v })} />
              <FormField label="Joining Date" type="date" value={form.joining_date} onChange={(v) => setForm({ ...form, joining_date: v })} />
              <FormField label="Base Salary (₹)" type="number" value={form.base_salary} onChange={(v) => setForm({ ...form, base_salary: v })} />
              <div className="sm:col-span-3">
                <button type="submit" className="btn btn-emerald">Save Employee</button>
              </div>
            </form>
          )}

          <FilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by name, designation, department…"
            filters={[
              { label: 'Region', value: regionFilter, onChange: setRegionFilter, options: REGION_OPTIONS },
              { label: 'Status', value: statusFilter, onChange: setStatusFilter, options: STATUS_OPTIONS },
            ]}
          />

          {filteredEmployees.length === 0 ? (
            <div className="card text-sm text-gray-500 dark:text-gray-400">
              {employees.length === 0 ? 'No employees yet.' : 'No employees match the current filters.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredEmployees.map((emp) => (
                <div key={emp.id} className="card">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{emp.full_name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{emp.designation || 'No designation'}</div>
                    </div>
                    <StatusBadge status={emp.is_active ? 'completed' : 'lost'} />
                  </div>

                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                    <DetailField label="Department" value={emp.department || '—'} />
                    <DetailField label="Region" value={capitalize(emp.region)} />
                    <DetailField label="Site" value={emp.site || '—'} wide />
                    <DetailField label="Joining Date" value={formatDate(emp.joining_date)} />
                    <DetailField label="Salary" value={currency(emp.base_salary)} />
                  </dl>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'attendance' && <AttendanceGrid employees={employees} />}
      {tab === 'payroll' && <PayrollPanel employees={employees} />}

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

function AttendanceGrid({ employees }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [site, setSite] = useState('');
  const [statuses, setStatuses] = useState({});
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setError('');
    setSaved(false);
    const entries = Object.entries(statuses).map(([employee_id, status]) => ({ employee_id, status }));
    if (!entries.length) {
      setError('Mark at least one employee before saving.');
      return;
    }
    try {
      await api.post('/attendance/bulk', { site, attendance_date: date, entries });
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save attendance');
    }
  }

  return (
    <div className="card space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-gray-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Site</label>
          <input value={site} onChange={(e) => setSite(e.target.value)} className="mt-1 rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-gray-100" />
        </div>
        <button className="btn btn-emerald" onClick={handleSave}>Save Attendance</button>
      </div>

      {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">{error}</div>}
      {saved && <div className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-emerald-500/10 dark:text-emerald-400">Attendance saved.</div>}

      <div className="overflow-x-auto scrollbar-hide">
        <table className="min-w-full divide-y divide-white/40 text-sm dark:divide-white/10">
          <thead className="bg-white/20 dark:bg-white/5">
            <tr className="text-left text-gray-600 dark:text-gray-300">
              <th className="py-2 pl-3 pr-4">Employee</th>
              <th className="py-2 pr-4">Present</th>
              <th className="py-2 pr-4">Absent</th>
              <th className="py-2 pr-4">Half Day</th>
              <th className="py-2">Leave</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/30 dark:divide-white/10">
            {employees.map((emp) => (
              <tr key={emp.id}>
                <td className="whitespace-nowrap py-2 pl-3 pr-4 font-medium text-gray-800 dark:text-gray-200">{emp.full_name}</td>
                {['present', 'absent', 'half_day', 'leave'].map((s) => (
                  <td key={s} className="py-2 pr-4">
                    <input
                      type="radio"
                      name={`att-${emp.id}`}
                      checked={statuses[emp.id] === s}
                      onChange={() => setStatuses({ ...statuses, [emp.id]: s })}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PayrollPanel({ employees }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [employeeId, setEmployeeId] = useState('');
  const [advance, setAdvance] = useState(0);
  const [deduction, setDeduction] = useState(0);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [runs, setRuns] = useState([]);

  function loadRuns() {
    api.get('/payroll').then((res) => setRuns(res.data));
  }
  useEffect(loadRuns, []);

  async function handlePreview() {
    setError('');
    setConfirmed(false);
    try {
      const { data } = await api.post('/payroll/preview', {
        employee_id: employeeId, period_month: Number(month), period_year: Number(year),
        advance: Number(advance), deduction: Number(deduction),
      });
      setPreview(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to preview payroll');
    }
  }

  async function handleConfirm() {
    setError('');
    try {
      await api.post('/payroll/run', preview);
      setConfirmed(true);
      loadRuns();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save payroll run');
    }
  }

  async function handleMarkPaid(id) {
    setError('');
    try {
      await api.patch(`/payroll/${id}/mark-paid`, {});
      loadRuns();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark as paid');
    }
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Employee</label>
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="mt-1 rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-gray-100">
              <option value="">Select…</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Month</label>
            <input type="number" min="1" max="12" value={month} onChange={(e) => setMonth(e.target.value)} className="mt-1 w-20 rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Year</label>
            <input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="mt-1 w-24 rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Advance (₹)</label>
            <input type="number" value={advance} onChange={(e) => setAdvance(e.target.value)} className="mt-1 w-28 rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Deduction (₹)</label>
            <input type="number" value={deduction} onChange={(e) => setDeduction(e.target.value)} className="mt-1 w-28 rounded-xl border border-gray-200 bg-white/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5 dark:text-gray-100" />
          </div>
          <button className="btn btn-secondary" onClick={handlePreview} disabled={!employeeId}>Preview</button>
        </div>

        {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">{error}</div>}

        {preview && (
          <div className="rounded-xl border border-gray-200 bg-white/50 p-4 text-sm dark:border-white/10 dark:bg-white/5">
            <h3 className="mb-2 font-semibold text-gray-700 dark:text-gray-300">Review before confirming</h3>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <DetailField label="Gross Salary" value={currency(preview.gross_salary)} />
              <DetailField label="Advance" value={currency(preview.advance)} />
              <DetailField label="Deduction" value={currency(preview.deduction)} />
              <DetailField label="PF" value={currency(preview.pf_amount)} />
              <DetailField label="ESI" value={currency(preview.esi_amount)} />
              <DetailField label="Net Salary" value={currency(preview.net_salary)} />
            </dl>
            <button className="btn btn-emerald mt-3" onClick={handleConfirm}>Confirm &amp; Run Payroll</button>
            {confirmed && <span className="ml-3 text-sm text-green-700 dark:text-emerald-400">Payroll run saved.</span>}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Payroll History &amp; Payment Status</h2>
        {runs.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No payroll runs yet.</p>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <table className="min-w-full divide-y divide-white/40 text-sm dark:divide-white/10">
              <thead className="bg-white/20 dark:bg-white/5">
                <tr className="text-left text-gray-600 dark:text-gray-300">
                  <th className="whitespace-nowrap py-2 pl-3 pr-4">Employee</th>
                  <th className="whitespace-nowrap py-2 pr-4">Period</th>
                  <th className="whitespace-nowrap py-2 pr-4">Net Salary</th>
                  <th className="whitespace-nowrap py-2 pr-4">Payment Status</th>
                  <th className="whitespace-nowrap py-2 pr-4">Payment Date</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/30 dark:divide-white/10">
                {runs.map((r) => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap py-2 pl-3 pr-4 font-medium text-gray-800 dark:text-gray-200">{r.full_name}</td>
                    <td className="whitespace-nowrap py-2 pr-4">{r.period_month}/{r.period_year}</td>
                    <td className="whitespace-nowrap py-2 pr-4">{currency(r.net_salary)}</td>
                    <td className="whitespace-nowrap py-2 pr-4"><StatusBadge status={r.payment_status} /></td>
                    <td className="whitespace-nowrap py-2 pr-4">{formatDate(r.payment_date)}</td>
                    <td className="py-2">
                      {r.payment_status !== 'paid' && (
                        <button className="btn btn-secondary" onClick={() => handleMarkPaid(r.id)}>Mark Paid</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Vercel serverless function wrapping the demo API — same in-memory mock
// data and routes as server/src/mock-server.js, adapted to run as a single
// serverless handler (no app.listen(), exported as the default handler).
//
// IMPORTANT: serverless functions are stateless between invocations — this
// in-memory data resets on cold starts and is NOT shared across concurrent
// requests reliably. Fine for a demo/showcase; not for real multi-user data.
// For persistent data, point DATABASE_URL at a real Postgres instance and
// use server/src/index.js + server/src/modules instead of this file.
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret';
const app = express();
app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------
// In-memory seed data — spans all 7 roles, all 3 regions, every module
// ---------------------------------------------------------------------
const users = [
  { id: 'u1', name: 'Dr. A. Joseph Stalin', email: 'director@sprincehightech.com', password: 'demo123', role: 'director', region: null },
  { id: 'u2', name: 'Ramesh Iyer', email: 'pm.korba@sprincehightech.com', password: 'demo123', role: 'project_manager', region: 'korba' },
  { id: 'u3', name: 'Lakshmi Meenakshisundaram', email: 'accounts@sprincehightech.com', password: 'demo123', role: 'accounts_officer', region: null },
  { id: 'u4', name: 'Antony Bala Prince', email: 'regionalhead.maharashtra@sprincehightech.com', password: 'demo123', role: 'regional_head', region: 'maharashtra' },
  { id: 'u5', name: 'Karthik Subramaniam', email: 'pm.delhi@sprincehightech.com', password: 'demo123', role: 'project_manager', region: 'delhi' },
  { id: 'u6', name: 'Murugan Palanisamy', email: 'supervisor.korba@sprincehightech.com', password: 'demo123', role: 'site_supervisor', region: 'korba' },
  { id: 'u7', name: 'Meena Krishnan', email: 'tenders@sprincehightech.com', password: 'demo123', role: 'tender_officer', region: null },
  { id: 'u8', name: 'Kavitha Ramasamy', email: 'hr@sprincehightech.com', password: 'demo123', role: 'hr_officer', region: null },
];

const tenders = [
  { id: 't1', tender_code: 'TND-2026-001', organisation: 'NTPC Ltd', tender_name: 'Ash Slurry Pipeline Replacement', work_description: 'Cast basalt pipeline install, Unit 4', tender_value: 48000000, emd: 480000, tender_fee: 25000, submission_date: '2026-10-20', opening_date: '2026-10-25', eligibility: 'ISO 9001, 5yr experience', status: 'submitted', region: 'korba', documents: [
    { id: 'doc1', file_name: 'Technical_Bid.pdf', file_url: '#', uploaded_at: '2026-10-01T10:00:00Z' },
    { id: 'doc2', file_name: 'EMD_Receipt.pdf', file_url: '#', uploaded_at: '2026-10-01T10:05:00Z' },
  ] },
  { id: 't2', tender_code: 'TND-2026-002', organisation: 'MSPGCL', tender_name: 'Steel Structure Restoration – Phase 2', work_description: 'Corrosion coating, conveyor gantry', tender_value: 32000000, emd: 320000, tender_fee: 20000, submission_date: '2026-11-05', opening_date: '2026-11-10', eligibility: 'ISO 9001', status: 'bid_preparing', region: 'maharashtra', documents: [] },
  { id: 't3', tender_code: 'TND-2026-003', organisation: 'GSECL', tender_name: 'Township Civil Works', work_description: 'Employee housing, admin block', tender_value: 75000000, emd: 750000, tender_fee: 40000, submission_date: '2026-09-15', opening_date: '2026-09-20', eligibility: 'Civil EPC license', status: 'won', region: 'delhi', documents: [] },
  { id: 't4', tender_code: 'TND-2026-004', organisation: 'IOCL', tender_name: 'Coal Handling Plant Painting', work_description: 'Full plant repainting & corrosion treatment', tender_value: 15000000, emd: 150000, tender_fee: 10000, submission_date: '2026-08-01', opening_date: '2026-08-05', eligibility: 'ISO 9001', status: 'lost', region: 'korba', documents: [] },
  { id: 't5', tender_code: 'TND-2026-005', organisation: 'KPCL', tender_name: 'Cast Basalt Pipeline – Ash Handling Plant', work_description: '2.5km abrasion-resistant slurry pipeline, design + supply + install', tender_value: 61000000, emd: 610000, tender_fee: 30000, submission_date: '2026-10-15', opening_date: '2026-10-18', eligibility: 'ISO 9001, prior KPCL vendor', status: 'under_evaluation', region: 'maharashtra', documents: [] },
  { id: 't6', tender_code: 'TND-2026-006', organisation: 'CSPGCL', tender_name: 'Coal Conveyor Stone Picking Manpower', work_description: 'Deployment of 60 workers for belt stone extraction, 2-year contract', tender_value: 18500000, emd: 185000, tender_fee: 8000, submission_date: '2026-10-30', opening_date: '2026-11-02', eligibility: 'Labour license, PF/ESI registration', status: 'new', region: 'korba', documents: [] },
  { id: 't7', tender_code: 'TND-2026-007', organisation: 'GIPCL', tender_name: 'Pre-Engineered Building – Store Shed', work_description: 'EPC for steel PEB structure, 4500 sqm', tender_value: 29000000, emd: 290000, tender_fee: 15000, submission_date: '2026-11-20', opening_date: '2026-11-25', eligibility: 'EPC license, structural steel experience', status: 'new', region: 'delhi', documents: [] },
  { id: 't8', tender_code: 'TND-2026-008', organisation: 'LICL', tender_name: 'Employee Township – Phase 1 Housing', work_description: 'G+3 residential blocks, 120 units', tender_value: 92000000, emd: 920000, tender_fee: 45000, submission_date: '2026-07-10', opening_date: '2026-07-15', eligibility: 'Civil EPC license, township experience', status: 'won', region: 'maharashtra', documents: [] },
];

const projects = [
  { id: 'p1', tender_id: 't3', client: 'GSECL', work_order: 'WO-GSECL-2026-11', project_value: 75000000, start_date: '2026-10-01', end_date: '2027-06-30', site: 'Gandhinagar Township Site', region: 'delhi', project_manager_id: 'u5', work_status: 'in_progress', progress_percent: 18, billing: 13500000, payment_received: 9000000 },
  { id: 'p2', tender_id: 't8', client: 'LICL', work_order: 'WO-LICL-2026-07', project_value: 92000000, start_date: '2026-08-01', end_date: '2027-12-31', site: 'Bhandup Township Site', region: 'maharashtra', project_manager_id: 'u4', work_status: 'in_progress', progress_percent: 32, billing: 29000000, payment_received: 25000000 },
  { id: 'p3', tender_id: null, client: 'NTPC Ltd', work_order: 'WO-NTPC-2025-44', project_value: 41000000, start_date: '2025-11-01', end_date: '2026-09-30', site: 'Korba Super Thermal Power Station', region: 'korba', project_manager_id: 'u2', work_status: 'completed', progress_percent: 100, billing: 41000000, payment_received: 41000000 },
];

const subcontractors = [
  { id: 's1', company_name: 'Balaji Civil Contractors', contact_name: 'Suresh Balaji', contact_phone: '9876543210', contact_email: 'suresh@balajicivil.in' },
  { id: 's2', company_name: 'Everest Stone Picking Co.', contact_name: 'Murugesan Thangavel', contact_phone: '9876501234', contact_email: 'murugesan@evereststone.in' },
  { id: 's3', company_name: 'Shree Coating Works', contact_name: 'Rajesh Kannan', contact_phone: '9876512345', contact_email: 'rajesh@shreecoating.in' },
  { id: 's4', company_name: 'Konkan Steel Fabricators', contact_name: 'Ravikumar Elango', contact_phone: '9820011223', contact_email: 'ravikumar@konkansteel.in' },
  { id: 's5', company_name: 'Precision Electricals', contact_name: 'Imran Basheer', contact_phone: '9811002233', contact_email: 'imran@precisionelec.in' },
];

const subcontractorAssignments = [
  { id: 'sa1', subcontractor_id: 's1', project_id: 'p1', assigned_work: 'Civil Work', contract_value: 20000000, work_start_date: '2026-10-05', work_end_date: '2027-03-31', work_progress_percent: 22, bill_submitted: true, bill_amount: 4000000, paid_amount: 2500000, balance: 1500000, payment_date: '2026-10-25', company_name: 'Balaji Civil Contractors', contact_name: 'Suresh Balaji', contact_phone: '9876543210', client: 'GSECL', site: 'Gandhinagar Township Site', region: 'delhi', documents: [
    { id: 'sdoc1', file_name: 'Civil_Work_Bill_Sept.pdf', file_url: '#', uploaded_at: '2026-10-20T09:00:00Z' },
  ] },
  { id: 'sa2', subcontractor_id: 's3', project_id: 'p1', assigned_work: 'Painting', contract_value: 6000000, work_start_date: '2026-11-01', work_end_date: '2027-02-28', work_progress_percent: 5, bill_submitted: false, bill_amount: 0, paid_amount: 0, balance: 0, payment_date: null, company_name: 'Shree Coating Works', contact_name: 'Rajesh Kannan', contact_phone: '9876512345', client: 'GSECL', site: 'Gandhinagar Township Site', region: 'delhi', documents: [] },
  { id: 'sa3', subcontractor_id: 's4', project_id: 'p2', assigned_work: 'Steel Structure Fabrication', contract_value: 28000000, work_start_date: '2026-08-15', work_end_date: '2027-06-30', work_progress_percent: 40, bill_submitted: true, bill_amount: 11000000, paid_amount: 9500000, balance: 1500000, payment_date: '2026-10-10', company_name: 'Konkan Steel Fabricators', contact_name: 'Ravikumar Elango', contact_phone: '9820011223', client: 'LICL', site: 'Bhandup Township Site', region: 'maharashtra', documents: [] },
  { id: 'sa4', subcontractor_id: 's5', project_id: 'p2', assigned_work: 'Electrical Wiring', contract_value: 9500000, work_start_date: '2026-09-01', work_end_date: '2027-05-31', work_progress_percent: 28, bill_submitted: true, bill_amount: 2600000, paid_amount: 2600000, balance: 0, payment_date: '2026-10-02', company_name: 'Precision Electricals', contact_name: 'Imran Basheer', contact_phone: '9811002233', client: 'LICL', site: 'Bhandup Township Site', region: 'maharashtra', documents: [] },
  { id: 'sa5', subcontractor_id: 's2', project_id: 'p3', assigned_work: 'Stone Picking', contract_value: 7200000, work_start_date: '2025-11-10', work_end_date: '2026-09-15', work_progress_percent: 100, bill_submitted: true, bill_amount: 7200000, paid_amount: 7200000, balance: 0, payment_date: '2026-09-20', company_name: 'Everest Stone Picking Co.', contact_name: 'Murugesan Thangavel', contact_phone: '9876501234', client: 'NTPC Ltd', site: 'Korba Super Thermal Power Station', region: 'korba', documents: [] },
];

const employees = [
  { id: 'e1', full_name: 'Mani Chezhian', designation: 'Site Supervisor', department: 'Operations', region: 'korba', site: 'Korba TPS', joining_date: '2022-04-01', base_salary: 32000, pf_applicable: true, esi_applicable: true, is_active: true },
  { id: 'e2', full_name: 'Kavitha Ramasamy', designation: 'HR Officer', department: 'HR', region: null, site: 'HQ Mumbai', joining_date: '2021-01-15', base_salary: 45000, pf_applicable: true, esi_applicable: false, is_active: true },
  { id: 'e3', full_name: 'Senthil Kumar', designation: 'Site Engineer', department: 'Engineering', region: 'delhi', site: 'Gandhinagar Township Site', joining_date: '2023-07-10', base_salary: 38000, pf_applicable: true, esi_applicable: true, is_active: true },
  { id: 'e4', full_name: 'Ramesh Iyer', designation: 'Project Manager', department: 'Operations', region: 'korba', site: 'Korba TPS', joining_date: '2019-06-01', base_salary: 68000, pf_applicable: true, esi_applicable: false, is_active: true },
  { id: 'e5', full_name: 'Karthik Subramaniam', designation: 'Project Manager', department: 'Operations', region: 'delhi', site: 'Gandhinagar Township Site', joining_date: '2020-02-15', base_salary: 65000, pf_applicable: true, esi_applicable: false, is_active: true },
  { id: 'e6', full_name: 'Murugan Palanisamy', designation: 'Site Supervisor', department: 'Operations', region: 'korba', site: 'Korba TPS', joining_date: '2022-09-01', base_salary: 30000, pf_applicable: true, esi_applicable: true, is_active: true },
  { id: 'e7', full_name: 'Lakshmi Narayanan', designation: 'Accounts Executive', department: 'Finance', region: null, site: 'HQ Mumbai', joining_date: '2021-11-01', base_salary: 36000, pf_applicable: true, esi_applicable: false, is_active: true },
  { id: 'e8', full_name: 'Abdul Rahman', designation: 'Welder', department: 'Fabrication', region: 'maharashtra', site: 'Bhandup Township Site', joining_date: '2024-01-10', base_salary: 22000, pf_applicable: true, esi_applicable: true, is_active: true },
  { id: 'e9', full_name: 'Valli Murugesan', designation: 'Store Keeper', department: 'Operations', region: 'maharashtra', site: 'Bhandup Township Site', joining_date: '2023-03-20', base_salary: 24000, pf_applicable: true, esi_applicable: true, is_active: true },
  { id: 'e10', full_name: 'Arun Prakash', designation: 'Electrician', department: 'Fabrication', region: 'delhi', site: 'Gandhinagar Township Site', joining_date: '2024-05-01', base_salary: 26000, pf_applicable: true, esi_applicable: true, is_active: true },
  { id: 'e11', full_name: 'Selvam Raju', designation: 'Driver', department: 'Logistics', region: 'korba', site: 'Korba TPS', joining_date: '2020-08-12', base_salary: 20000, pf_applicable: true, esi_applicable: true, is_active: false },
];

const invoices = [
  { id: 'i1', project_id: 'p1', gstin: '27AAACS1234F1Z5', invoice_number: 'INV-2026-0091', invoice_date: '2026-09-28', customer: 'GSECL', taxable_value: 4500000, cgst: 405000, sgst: 405000, igst: 0, total_amount: 5310000, payment_status: 'partially_paid', gst_filing_status: 'filed', due_date: '2026-10-28' },
  { id: 'i2', project_id: 'p1', gstin: '27AAACS1234F1Z5', invoice_number: 'INV-2026-0098', invoice_date: '2026-10-05', customer: 'GSECL', taxable_value: 3000000, cgst: 0, sgst: 0, igst: 540000, total_amount: 3540000, payment_status: 'pending', gst_filing_status: 'not_filed', due_date: '2026-11-04' },
  { id: 'i3', project_id: 'p2', gstin: '27AAACS1234F1Z5', invoice_number: 'INV-2026-0075', invoice_date: '2026-09-01', customer: 'LICL', taxable_value: 12000000, cgst: 1080000, sgst: 1080000, igst: 0, total_amount: 14160000, payment_status: 'paid', gst_filing_status: 'filed', due_date: '2026-10-01' },
  { id: 'i4', project_id: 'p2', gstin: '27AAACS1234F1Z5', invoice_number: 'INV-2026-0102', invoice_date: '2026-10-10', customer: 'LICL', taxable_value: 8500000, cgst: 765000, sgst: 765000, igst: 0, total_amount: 10030000, payment_status: 'pending', gst_filing_status: 'not_filed', due_date: '2026-11-09' },
  { id: 'i5', project_id: 'p3', gstin: '27AAACS1234F1Z5', invoice_number: 'INV-2026-0060', invoice_date: '2026-08-20', customer: 'NTPC Ltd', taxable_value: 20000000, cgst: 0, sgst: 0, igst: 3600000, total_amount: 23600000, payment_status: 'paid', gst_filing_status: 'filed', due_date: '2026-09-19' },
  { id: 'i6', project_id: 'p3', gstin: '27AAACS1234F1Z5', invoice_number: 'INV-2026-0068', invoice_date: '2026-09-10', customer: 'NTPC Ltd', taxable_value: 18000000, cgst: 0, sgst: 0, igst: 3240000, total_amount: 21240000, payment_status: 'overdue', gst_filing_status: 'filed', due_date: '2026-10-10' },
];

const dailyWorkUpdates = [
  { id: 'd1', project_id: 'p1', site: 'Gandhinagar Township Site', work_date: '2026-10-05', entered_by: 'u5', work_done: 'Foundation casting completed for Block C, admin wing shuttering started.', manpower_deployed: 42, materials_used: 'Cement 120 bags, steel 2.4T', photo_url: null, approved_by: 'u5', approved_at: '2026-10-05T18:00:00Z' },
  { id: 'd2', project_id: 'p1', site: 'Gandhinagar Township Site', work_date: '2026-10-06', entered_by: 'u5', work_done: 'Block C shuttering 60% done, electrical conduit laying started in Block A.', manpower_deployed: 38, materials_used: 'PVC conduit 400m', photo_url: null, approved_by: null, approved_at: null },
  { id: 'd3', project_id: 'p2', site: 'Bhandup Township Site', work_date: '2026-10-04', entered_by: 'u4', work_done: 'Steel column erection for Block D completed, welding inspection passed.', manpower_deployed: 55, materials_used: 'Structural steel 8T, welding rods 40kg', photo_url: null, approved_by: 'u4', approved_at: '2026-10-04T19:00:00Z' },
  { id: 'd4', project_id: 'p2', site: 'Bhandup Township Site', work_date: '2026-10-06', entered_by: 'u4', work_done: 'Electrical first-fix wiring started in Blocks A and B.', manpower_deployed: 30, materials_used: 'Copper wiring 1200m, conduit boxes 80 units', photo_url: null, approved_by: null, approved_at: null },
  { id: 'd5', project_id: 'p3', site: 'Korba Super Thermal Power Station', work_date: '2026-09-12', entered_by: 'u2', work_done: 'Final stone-picking handover completed, belt inspection signed off by NTPC engineer.', manpower_deployed: 18, materials_used: 'N/A', photo_url: null, approved_by: 'u2', approved_at: '2026-09-12T17:30:00Z' },
];

const payrollRuns = [
  { id: 'pr1', employee_id: 'e1', period_month: 9, period_year: 2026, gross_salary: 32000, advance: 2000, deduction: 500, pf_amount: 3840, esi_amount: 240, net_salary: 25420, payment_status: 'paid', payment_date: '2026-10-01' },
  { id: 'pr2', employee_id: 'e3', period_month: 9, period_year: 2026, gross_salary: 38000, advance: 0, deduction: 0, pf_amount: 4560, esi_amount: 285, net_salary: 33155, payment_status: 'pending', payment_date: null },
  { id: 'pr3', employee_id: 'e4', period_month: 9, period_year: 2026, gross_salary: 68000, advance: 5000, deduction: 0, pf_amount: 8160, esi_amount: 0, net_salary: 54840, payment_status: 'paid', payment_date: '2026-10-01' },
  { id: 'pr4', employee_id: 'e5', period_month: 9, period_year: 2026, gross_salary: 65000, advance: 0, deduction: 1000, pf_amount: 7800, esi_amount: 0, net_salary: 56200, payment_status: 'paid', payment_date: '2026-10-01' },
  { id: 'pr5', employee_id: 'e8', period_month: 9, period_year: 2026, gross_salary: 22000, advance: 0, deduction: 0, pf_amount: 2640, esi_amount: 165, net_salary: 19195, payment_status: 'pending', payment_date: null },
  { id: 'pr6', employee_id: 'e9', period_month: 9, period_year: 2026, gross_salary: 24000, advance: 1500, deduction: 0, pf_amount: 2880, esi_amount: 180, net_salary: 19440, payment_status: 'partially_paid', payment_date: null },
];

// ---------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials (try director@sprincehightech.com / demo123)' });
  const token = jwt.sign({ id: user.id, role: user.role, region: user.region, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, region: user.region } });
});

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Mirrors server/src/middleware/auth.js — Director/Regional Head see the
// whole company; every other role is scoped to their own region.
const MANAGEMENT_ROLES = new Set(['director', 'regional_head']);
function regionFilter(user) {
  return MANAGEMENT_ROLES.has(user.role) ? null : user.region;
}

app.get('/api/health', (req, res) => res.json({ status: 'ok', mode: 'mock-vercel' }));

app.get('/api/auth/me', authenticate, (req, res) => res.json({ user: req.user }));

app.get('/api/users', authenticate, (req, res) => {
  if (req.user.role !== 'director') return res.status(403).json({ error: 'Director access only' });
  res.json(users.map(({ password, ...u }) => u));
});

// ---------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------
app.get('/api/dashboard', authenticate, (req, res) => {
  const scopeRegion = regionFilter(req.user);
  const scopedTenders = scopeRegion ? tenders.filter((t) => t.region === scopeRegion) : tenders;
  const scopedProjects = scopeRegion ? projects.filter((p) => p.region === scopeRegion) : projects;
  const scopedProjectIds = new Set(scopedProjects.map((p) => p.id));
  const scopedAssignments = scopeRegion
    ? subcontractorAssignments.filter((a) => scopedProjectIds.has(a.project_id))
    : subcontractorAssignments;
  const scopedEmployees = scopeRegion ? employees.filter((e) => e.region === scopeRegion) : employees;

  res.json({
    active_tenders: scopedTenders.filter((t) => !['won', 'lost'].includes(t.status)).length,
    upcoming_tender_deadlines: scopedTenders
      .filter((t) => !['won', 'lost'].includes(t.status))
      .map((t) => ({ tender_code: t.tender_code, tender_name: t.tender_name, submission_date: t.submission_date })),
    won_lost_tenders: [
      { status: 'won', count: String(scopedTenders.filter((t) => t.status === 'won').length) },
      { status: 'lost', count: String(scopedTenders.filter((t) => t.status === 'lost').length) },
    ],
    active_projects: scopedProjects.filter((p) => p.work_status !== 'completed').length,
    project_value: scopedProjects.reduce((a, p) => a + p.project_value, 0),
    subcontractor_work_pending: scopedAssignments.filter((a) => a.work_progress_percent < 100).length,
    subcontractor_pending_payments: scopedAssignments.reduce((a, s) => a + s.balance, 0),
    subcontractor_bills_pending: scopedAssignments.filter((a) => !a.bill_submitted).length,
    employee_count: scopedEmployees.filter((e) => e.is_active).length,
    salary_pending: payrollRuns.filter((p) => p.payment_status === 'pending').reduce((a, p) => a + p.net_salary, 0),
    pf_status_current_month: 0,
    gst_filing_status: [
      { gst_filing_status: 'filed', count: String(invoices.filter((i) => i.gst_filing_status === 'filed').length) },
      { gst_filing_status: 'not_filed', count: String(invoices.filter((i) => i.gst_filing_status === 'not_filed').length) },
    ],
    customer_receivables: invoices.filter((i) => i.payment_status !== 'paid').reduce((a, i) => a + i.total_amount, 0),
    revenue_expenses: {
      revenue: invoices.reduce((a, i) => a + i.total_amount, 0),
      expenses: subcontractorAssignments.reduce((a, s) => a + s.paid_amount, 0),
    },
  });
});

// ---------------------------------------------------------------------
// Tenders
// ---------------------------------------------------------------------
app.get('/api/tenders', authenticate, (req, res) => {
  const scopeRegion = regionFilter(req.user);
  const { status } = req.query;
  let rows = tenders;
  if (scopeRegion) rows = rows.filter((t) => t.region === scopeRegion);
  if (status) rows = rows.filter((t) => t.status === status);
  res.json(rows);
});
app.get('/api/tenders/:id', authenticate, (req, res) => {
  const t = tenders.find((x) => x.id === req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  res.json(t);
});
app.post('/api/tenders', authenticate, (req, res) => {
  const t = { id: 't' + (tenders.length + 1), status: 'new', documents: [], ...req.body };
  tenders.push(t);
  res.status(201).json(t);
});
app.patch('/api/tenders/:id/status', authenticate, (req, res) => {
  const t = tenders.find((x) => x.id === req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  t.status = req.body.status;
  res.json(t);
});
app.post('/api/tenders/:id/convert-to-project', authenticate, (req, res) => {
  const t = tenders.find((x) => x.id === req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  if (t.status !== 'won') return res.status(400).json({ error: 'Only a Won tender can be converted' });
  const p = {
    id: 'p' + (projects.length + 1), tender_id: t.id, client: t.organisation, work_order: null,
    project_value: t.tender_value, start_date: null, end_date: null, site: null, region: t.region,
    project_manager_id: null, work_status: 'not_started', progress_percent: 0, billing: 0, payment_received: 0,
  };
  projects.push(p);
  res.status(201).json(p);
});

// ---------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------
app.get('/api/projects', authenticate, (req, res) => {
  const scopeRegion = regionFilter(req.user);
  let rows = projects;
  if (req.user.role === 'project_manager') rows = rows.filter((p) => p.project_manager_id === req.user.id);
  if (scopeRegion) rows = rows.filter((p) => p.region === scopeRegion);
  const withManager = rows.map((p) => ({
    ...p,
    project_manager_name: users.find((u) => u.id === p.project_manager_id)?.name || null,
  }));
  res.json(withManager);
});
app.get('/api/projects/:id', authenticate, (req, res) => {
  const p = projects.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json({
    ...p,
    project_manager_name: users.find((u) => u.id === p.project_manager_id)?.name || null,
    subcontractor_assignments: subcontractorAssignments.filter((a) => a.project_id === p.id),
    recent_daily_updates: dailyWorkUpdates.filter((d) => d.project_id === p.id),
  });
});
app.post('/api/projects/:projectId/subcontractor-assignments', authenticate, (req, res) => {
  const sub = subcontractors.find((s) => s.id === req.body.subcontractor_id);
  const a = {
    id: 'sa' + (subcontractorAssignments.length + 1),
    project_id: req.params.projectId,
    subcontractor_id: req.body.subcontractor_id,
    assigned_work: req.body.assigned_work,
    contract_value: Number(req.body.contract_value) || 0,
    work_start_date: req.body.work_start_date || null,
    work_end_date: req.body.work_end_date || null,
    work_progress_percent: 0, bill_submitted: false, bill_amount: 0, paid_amount: 0, balance: 0, payment_date: null,
    company_name: sub?.company_name, contact_name: sub?.contact_name, contact_phone: sub?.contact_phone,
  };
  subcontractorAssignments.push(a);
  res.status(201).json(a);
});

// ---------------------------------------------------------------------
// Subcontractors
// ---------------------------------------------------------------------
app.get('/api/subcontractors', authenticate, (req, res) => res.json(subcontractors));
app.get('/api/subcontractors/:id', authenticate, (req, res) => {
  const s = subcontractors.find((x) => x.id === req.params.id);
  if (!s) return res.status(404).json({ error: 'Not found' });
  res.json({ ...s, assignments: subcontractorAssignments.filter((a) => a.subcontractor_id === s.id) });
});
app.post('/api/subcontractors', authenticate, (req, res) => {
  const s = { id: 's' + (subcontractors.length + 1), ...req.body };
  subcontractors.push(s);
  res.status(201).json(s);
});

// ---------------------------------------------------------------------
// Employees / Attendance / Payroll
// ---------------------------------------------------------------------
app.get('/api/employees', authenticate, (req, res) => {
  const scopeRegion = regionFilter(req.user);
  const rows = scopeRegion ? employees.filter((e) => e.region === scopeRegion) : employees;
  res.json(rows);
});
app.post('/api/employees', authenticate, (req, res) => {
  const e = { id: 'e' + (employees.length + 1), is_active: true, pf_applicable: true, esi_applicable: false, ...req.body, base_salary: Number(req.body.base_salary) || 0 };
  employees.push(e);
  res.status(201).json(e);
});
app.post('/api/attendance/bulk', authenticate, (req, res) => res.status(201).json(req.body.entries));
app.post('/api/payroll/preview', authenticate, (req, res) => {
  const emp = employees.find((e) => e.id === req.body.employee_id);
  const gross_salary = Number(emp?.base_salary || 0);
  const pf_amount = emp?.pf_applicable ? Number((gross_salary * 0.12).toFixed(2)) : 0;
  const esi_amount = emp?.esi_applicable ? Number((gross_salary * 0.0075).toFixed(2)) : 0;
  const advance = Number(req.body.advance) || 0;
  const deduction = Number(req.body.deduction) || 0;
  const net_salary = gross_salary - advance - deduction - pf_amount - esi_amount;
  res.json({ ...req.body, gross_salary, advance, deduction, pf_amount, esi_amount, net_salary });
});
app.post('/api/payroll/run', authenticate, (req, res) => {
  const run = { id: 'pr' + (payrollRuns.length + 1), payment_status: 'pending', payment_date: null, ...req.body };
  payrollRuns.push(run);
  res.status(201).json(run);
});
app.get('/api/payroll', authenticate, (req, res) => {
  const { period_month, period_year, employee_id } = req.query;
  let rows = payrollRuns;
  if (period_month) rows = rows.filter((r) => String(r.period_month) === String(period_month));
  if (period_year) rows = rows.filter((r) => String(r.period_year) === String(period_year));
  if (employee_id) rows = rows.filter((r) => r.employee_id === employee_id);
  const withEmployee = rows.map((r) => {
    const emp = employees.find((e) => e.id === r.employee_id);
    return { ...r, full_name: emp?.full_name, designation: emp?.designation, region: emp?.region };
  });
  res.json(withEmployee);
});
app.patch('/api/payroll/:id/mark-paid', authenticate, (req, res) => {
  const run = payrollRuns.find((r) => r.id === req.params.id);
  if (!run) return res.status(404).json({ error: 'Payroll run not found' });
  run.payment_status = 'paid';
  run.payment_date = req.body.payment_date || new Date().toISOString().slice(0, 10);
  res.json(run);
});

// ---------------------------------------------------------------------
// Finance / GST
// ---------------------------------------------------------------------
app.get('/api/invoices', authenticate, (req, res) => res.json(invoices));
app.post('/api/invoices/calculate', authenticate, (req, res) => {
  const { taxable_value, is_inter_state, gst_rate = 0.18 } = req.body;
  const taxAmount = Number(taxable_value) * Number(gst_rate);
  let cgst = 0, sgst = 0, igst = 0;
  if (is_inter_state) igst = taxAmount; else { cgst = taxAmount / 2; sgst = taxAmount / 2; }
  res.json({ taxable_value, cgst, sgst, igst, total_amount: Number(taxable_value) + cgst + sgst + igst });
});
app.post('/api/invoices', authenticate, (req, res) => {
  const taxable_value = Number(req.body.taxable_value) || 0;
  const cgst = Number(req.body.cgst) || 0, sgst = Number(req.body.sgst) || 0, igst = Number(req.body.igst) || 0;
  const inv = {
    id: 'i' + (invoices.length + 1), payment_status: 'pending', gst_filing_status: 'not_filed',
    ...req.body, taxable_value, cgst, sgst, igst, total_amount: taxable_value + cgst + sgst + igst,
  };
  invoices.push(inv);
  res.status(201).json(inv);
});

// ---------------------------------------------------------------------
// Daily Work Updates
// ---------------------------------------------------------------------
app.get('/api/daily-work-updates', authenticate, (req, res) => res.json(dailyWorkUpdates));
app.post('/api/daily-work-updates', authenticate, (req, res) => {
  const u = {
    id: 'd' + (dailyWorkUpdates.length + 1), entered_by: req.user.id, approved_by: null, approved_at: null,
    ...req.body, manpower_deployed: Number(req.body.manpower_deployed) || 0,
  };
  dailyWorkUpdates.unshift(u);
  res.status(201).json(u);
});
app.patch('/api/daily-work-updates/:id/approve', authenticate, (req, res) => {
  const u = dailyWorkUpdates.find((x) => x.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'Not found' });
  u.approved_by = req.user.id;
  u.approved_at = new Date().toISOString();
  const p = projects.find((x) => x.id === u.project_id);
  if (p) p.progress_percent = Math.min(100, p.progress_percent + (Number(req.body.progress_delta) || 0));
  res.json(u);
});

// No app.listen() — Vercel invokes this exported Express app directly per request.
export default app;

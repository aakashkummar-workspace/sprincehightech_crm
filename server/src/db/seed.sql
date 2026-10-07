-- S. Prince Hightech CRM — sample seed data for the real Postgres-backed server.
-- Mirrors the mock server's dataset (src/mock-server.js) so the same demo
-- story works whether you run against the mock API or a real database.
--
-- Usage (after running migrations):
--   psql "$DATABASE_URL" -f src/db/seed.sql
-- or:
--   node src/db/migrate.js && psql "$DATABASE_URL" -f src/db/seed.sql
--
-- All demo accounts use the password: demo123
-- (bcrypt hash below is for 'demo123', cost factor 10)

BEGIN;

-- ---------------------------------------------------------------------
-- Users — one per role, across all 3 regions
-- ---------------------------------------------------------------------
INSERT INTO users (id, name, email, password_hash, role, region) VALUES
  (gen_random_uuid(), 'Dr. A. Joseph Stalin', 'director@sprincehightech.com', '$2a$10$3Y65mEkTrbJxSO5poWfbzO6SaQiYRBG.hNfOm5toygKDIi1oSwzGu', 'director', NULL),
  (gen_random_uuid(), 'Antony Bala Prince', 'regionalhead.maharashtra@sprincehightech.com', '$2a$10$3Y65mEkTrbJxSO5poWfbzO6SaQiYRBG.hNfOm5toygKDIi1oSwzGu', 'regional_head', 'maharashtra'),
  (gen_random_uuid(), 'Ramesh Iyer', 'pm.korba@sprincehightech.com', '$2a$10$3Y65mEkTrbJxSO5poWfbzO6SaQiYRBG.hNfOm5toygKDIi1oSwzGu', 'project_manager', 'korba'),
  (gen_random_uuid(), 'Karthik Subramaniam', 'pm.delhi@sprincehightech.com', '$2a$10$3Y65mEkTrbJxSO5poWfbzO6SaQiYRBG.hNfOm5toygKDIi1oSwzGu', 'project_manager', 'delhi'),
  (gen_random_uuid(), 'Murugan Palanisamy', 'supervisor.korba@sprincehightech.com', '$2a$10$3Y65mEkTrbJxSO5poWfbzO6SaQiYRBG.hNfOm5toygKDIi1oSwzGu', 'site_supervisor', 'korba'),
  (gen_random_uuid(), 'Lakshmi Meenakshisundaram', 'accounts@sprincehightech.com', '$2a$10$3Y65mEkTrbJxSO5poWfbzO6SaQiYRBG.hNfOm5toygKDIi1oSwzGu', 'accounts_officer', NULL),
  (gen_random_uuid(), 'Meena Krishnan', 'tenders@sprincehightech.com', '$2a$10$3Y65mEkTrbJxSO5poWfbzO6SaQiYRBG.hNfOm5toygKDIi1oSwzGu', 'tender_officer', NULL),
  (gen_random_uuid(), 'Kavitha Ramasamy', 'hr@sprincehightech.com', '$2a$10$3Y65mEkTrbJxSO5poWfbzO6SaQiYRBG.hNfOm5toygKDIi1oSwzGu', 'hr_officer', NULL)
ON CONFLICT (email) DO NOTHING;

-- ---------------------------------------------------------------------
-- Tenders — across all stages of the workflow, all 3 regions
-- ---------------------------------------------------------------------
INSERT INTO tenders (id, tender_code, organisation, tender_name, work_description, tender_value, emd, tender_fee, submission_date, opening_date, eligibility, status, region, created_by)
SELECT gen_random_uuid(), v.tender_code, v.organisation, v.tender_name, v.work_description, v.tender_value, v.emd, v.tender_fee, v.submission_date::date, v.opening_date::date, v.eligibility, v.status::tender_status, v.region::region,
  (SELECT id FROM users WHERE email = 'tenders@sprincehightech.com')
FROM (VALUES
  ('TND-2026-001', 'NTPC Ltd', 'Ash Slurry Pipeline Replacement', 'Cast basalt pipeline install, Unit 4', 48000000, 480000, 25000, '2026-10-20', '2026-10-25', 'ISO 9001, 5yr experience', 'submitted', 'korba'),
  ('TND-2026-002', 'MSPGCL', 'Steel Structure Restoration – Phase 2', 'Corrosion coating, conveyor gantry', 32000000, 320000, 20000, '2026-11-05', '2026-11-10', 'ISO 9001', 'bid_preparing', 'maharashtra'),
  ('TND-2026-003', 'GSECL', 'Township Civil Works', 'Employee housing, admin block', 75000000, 750000, 40000, '2026-09-15', '2026-09-20', 'Civil EPC license', 'won', 'delhi'),
  ('TND-2026-004', 'IOCL', 'Coal Handling Plant Painting', 'Full plant repainting & corrosion treatment', 15000000, 150000, 10000, '2026-08-01', '2026-08-05', 'ISO 9001', 'lost', 'korba'),
  ('TND-2026-005', 'KPCL', 'Cast Basalt Pipeline – Ash Handling Plant', '2.5km abrasion-resistant slurry pipeline, design + supply + install', 61000000, 610000, 30000, '2026-10-15', '2026-10-18', 'ISO 9001, prior KPCL vendor', 'under_evaluation', 'maharashtra'),
  ('TND-2026-006', 'CSPGCL', 'Coal Conveyor Stone Picking Manpower', 'Deployment of 60 workers for belt stone extraction, 2-year contract', 18500000, 185000, 8000, '2026-10-30', '2026-11-02', 'Labour license, PF/ESI registration', 'new', 'korba'),
  ('TND-2026-007', 'GIPCL', 'Pre-Engineered Building – Store Shed', 'EPC for steel PEB structure, 4500 sqm', 29000000, 290000, 15000, '2026-11-20', '2026-11-25', 'EPC license, structural steel experience', 'new', 'delhi'),
  ('TND-2026-008', 'LICL', 'Employee Township – Phase 1 Housing', 'G+3 residential blocks, 120 units', 92000000, 920000, 45000, '2026-07-10', '2026-07-15', 'Civil EPC license, township experience', 'won', 'maharashtra')
) AS v(tender_code, organisation, tender_name, work_description, tender_value, emd, tender_fee, submission_date, opening_date, eligibility, status, region)
ON CONFLICT (tender_code) DO NOTHING;

-- ---------------------------------------------------------------------
-- Projects — converted from won tenders (p1/p2), plus one direct-entry (p3)
-- ---------------------------------------------------------------------
INSERT INTO projects (id, tender_id, client, work_order, project_value, start_date, end_date, site, region, project_manager_id, work_status, progress_percent, billing, payment_received)
SELECT gen_random_uuid(),
  (SELECT id FROM tenders WHERE tender_code = 'TND-2026-003'),
  'GSECL', 'WO-GSECL-2026-11', 75000000, '2026-10-01', '2027-06-30', 'Gandhinagar Township Site', 'delhi',
  (SELECT id FROM users WHERE email = 'pm.delhi@sprincehightech.com'),
  'in_progress', 18, 13500000, 9000000
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE work_order = 'WO-GSECL-2026-11');

INSERT INTO projects (id, tender_id, client, work_order, project_value, start_date, end_date, site, region, project_manager_id, work_status, progress_percent, billing, payment_received)
SELECT gen_random_uuid(),
  (SELECT id FROM tenders WHERE tender_code = 'TND-2026-008'),
  'LICL', 'WO-LICL-2026-07', 92000000, '2026-08-01', '2027-12-31', 'Bhandup Township Site', 'maharashtra',
  (SELECT id FROM users WHERE email = 'regionalhead.maharashtra@sprincehightech.com'),
  'in_progress', 32, 29000000, 25000000
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE work_order = 'WO-LICL-2026-07');

INSERT INTO projects (id, tender_id, client, work_order, project_value, start_date, end_date, site, region, project_manager_id, work_status, progress_percent, billing, payment_received)
SELECT gen_random_uuid(), NULL,
  'NTPC Ltd', 'WO-NTPC-2025-44', 41000000, '2025-11-01', '2026-09-30', 'Korba Super Thermal Power Station', 'korba',
  (SELECT id FROM users WHERE email = 'pm.korba@sprincehightech.com'),
  'completed', 100, 41000000, 41000000
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE work_order = 'WO-NTPC-2025-44');

-- ---------------------------------------------------------------------
-- Subcontractors (master)
-- ---------------------------------------------------------------------
INSERT INTO subcontractors (id, company_name, contact_name, contact_phone, contact_email)
SELECT gen_random_uuid(), v.company_name, v.contact_name, v.contact_phone, v.contact_email
FROM (VALUES
  ('Balaji Civil Contractors', 'Suresh Balaji', '9876543210', 'suresh@balajicivil.in'),
  ('Everest Stone Picking Co.', 'Murugesan Thangavel', '9876501234', 'murugesan@evereststone.in'),
  ('Shree Coating Works', 'Rajesh Kannan', '9876512345', 'rajesh@shreecoating.in'),
  ('Konkan Steel Fabricators', 'Ravikumar Elango', '9820011223', 'ravikumar@konkansteel.in'),
  ('Precision Electricals', 'Imran Basheer', '9811002233', 'imran@precisionelec.in')
) AS v(company_name, contact_name, contact_phone, contact_email)
WHERE NOT EXISTS (SELECT 1 FROM subcontractors WHERE company_name = v.company_name);

-- ---------------------------------------------------------------------
-- Subcontractor assignments — the many-to-many: one subcontractor can
-- work on multiple projects; one project can have multiple subcontractors.
-- ---------------------------------------------------------------------
INSERT INTO subcontractor_assignments (id, subcontractor_id, project_id, assigned_work, contract_value, work_start_date, work_end_date, work_progress_percent, bill_submitted, bill_amount, paid_amount, payment_date)
SELECT gen_random_uuid(),
  (SELECT id FROM subcontractors WHERE company_name = 'Balaji Civil Contractors'),
  (SELECT id FROM projects WHERE work_order = 'WO-GSECL-2026-11'),
  'Civil Work', 20000000, '2026-10-05', '2027-03-31', 22, TRUE, 4000000, 2500000, '2026-10-25'
WHERE EXISTS (SELECT 1 FROM projects WHERE work_order = 'WO-GSECL-2026-11')
  AND NOT EXISTS (
    SELECT 1 FROM subcontractor_assignments sa
    JOIN subcontractors s ON s.id = sa.subcontractor_id
    JOIN projects p ON p.id = sa.project_id
    WHERE s.company_name = 'Balaji Civil Contractors' AND p.work_order = 'WO-GSECL-2026-11'
  );

INSERT INTO subcontractor_assignments (id, subcontractor_id, project_id, assigned_work, contract_value, work_start_date, work_end_date, work_progress_percent, bill_submitted, bill_amount, paid_amount, payment_date)
SELECT gen_random_uuid(),
  (SELECT id FROM subcontractors WHERE company_name = 'Shree Coating Works'),
  (SELECT id FROM projects WHERE work_order = 'WO-GSECL-2026-11'),
  'Painting', 6000000, '2026-11-01', '2027-02-28', 5, FALSE, 0, 0, NULL
WHERE EXISTS (SELECT 1 FROM projects WHERE work_order = 'WO-GSECL-2026-11')
  AND NOT EXISTS (
    SELECT 1 FROM subcontractor_assignments sa
    JOIN subcontractors s ON s.id = sa.subcontractor_id
    JOIN projects p ON p.id = sa.project_id
    WHERE s.company_name = 'Shree Coating Works' AND p.work_order = 'WO-GSECL-2026-11'
  );

INSERT INTO subcontractor_assignments (id, subcontractor_id, project_id, assigned_work, contract_value, work_start_date, work_end_date, work_progress_percent, bill_submitted, bill_amount, paid_amount, payment_date)
SELECT gen_random_uuid(),
  (SELECT id FROM subcontractors WHERE company_name = 'Konkan Steel Fabricators'),
  (SELECT id FROM projects WHERE work_order = 'WO-LICL-2026-07'),
  'Steel Structure Fabrication', 28000000, '2026-08-15', '2027-06-30', 40, TRUE, 11000000, 9500000, '2026-10-10'
WHERE EXISTS (SELECT 1 FROM projects WHERE work_order = 'WO-LICL-2026-07')
  AND NOT EXISTS (
    SELECT 1 FROM subcontractor_assignments sa
    JOIN subcontractors s ON s.id = sa.subcontractor_id
    JOIN projects p ON p.id = sa.project_id
    WHERE s.company_name = 'Konkan Steel Fabricators' AND p.work_order = 'WO-LICL-2026-07'
  );

INSERT INTO subcontractor_assignments (id, subcontractor_id, project_id, assigned_work, contract_value, work_start_date, work_end_date, work_progress_percent, bill_submitted, bill_amount, paid_amount, payment_date)
SELECT gen_random_uuid(),
  (SELECT id FROM subcontractors WHERE company_name = 'Precision Electricals'),
  (SELECT id FROM projects WHERE work_order = 'WO-LICL-2026-07'),
  'Electrical Wiring', 9500000, '2026-09-01', '2027-05-31', 28, TRUE, 2600000, 2600000, '2026-10-02'
WHERE EXISTS (SELECT 1 FROM projects WHERE work_order = 'WO-LICL-2026-07')
  AND NOT EXISTS (
    SELECT 1 FROM subcontractor_assignments sa
    JOIN subcontractors s ON s.id = sa.subcontractor_id
    JOIN projects p ON p.id = sa.project_id
    WHERE s.company_name = 'Precision Electricals' AND p.work_order = 'WO-LICL-2026-07'
  );

INSERT INTO subcontractor_assignments (id, subcontractor_id, project_id, assigned_work, contract_value, work_start_date, work_end_date, work_progress_percent, bill_submitted, bill_amount, paid_amount, payment_date)
SELECT gen_random_uuid(),
  (SELECT id FROM subcontractors WHERE company_name = 'Everest Stone Picking Co.'),
  (SELECT id FROM projects WHERE work_order = 'WO-NTPC-2025-44'),
  'Stone Picking', 7200000, '2025-11-10', '2026-09-15', 100, TRUE, 7200000, 7200000, '2026-09-20'
WHERE EXISTS (SELECT 1 FROM projects WHERE work_order = 'WO-NTPC-2025-44')
  AND NOT EXISTS (
    SELECT 1 FROM subcontractor_assignments sa
    JOIN subcontractors s ON s.id = sa.subcontractor_id
    JOIN projects p ON p.id = sa.project_id
    WHERE s.company_name = 'Everest Stone Picking Co.' AND p.work_order = 'WO-NTPC-2025-44'
  );

-- ---------------------------------------------------------------------
-- Employees — across all 3 regions and HQ, various designations
-- ---------------------------------------------------------------------
INSERT INTO employees (id, full_name, designation, department, region, site, joining_date, base_salary, pf_applicable, esi_applicable, is_active)
SELECT gen_random_uuid(), v.full_name, v.designation, v.department, v.region::region, v.site, v.joining_date::date, v.base_salary, v.pf_applicable, v.esi_applicable, v.is_active
FROM (VALUES
  ('Mani Chezhian', 'Site Supervisor', 'Operations', 'korba', 'Korba TPS', '2022-04-01', 32000, TRUE, TRUE, TRUE),
  ('Kavitha Ramasamy', 'HR Officer', 'HR', NULL, 'HQ Mumbai', '2021-01-15', 45000, TRUE, FALSE, TRUE),
  ('Senthil Kumar', 'Site Engineer', 'Engineering', 'delhi', 'Gandhinagar Township Site', '2023-07-10', 38000, TRUE, TRUE, TRUE),
  ('Ramesh Iyer', 'Project Manager', 'Operations', 'korba', 'Korba TPS', '2019-06-01', 68000, TRUE, FALSE, TRUE),
  ('Karthik Subramaniam', 'Project Manager', 'Operations', 'delhi', 'Gandhinagar Township Site', '2020-02-15', 65000, TRUE, FALSE, TRUE),
  ('Murugan Palanisamy', 'Site Supervisor', 'Operations', 'korba', 'Korba TPS', '2022-09-01', 30000, TRUE, TRUE, TRUE),
  ('Lakshmi Narayanan', 'Accounts Executive', 'Finance', NULL, 'HQ Mumbai', '2021-11-01', 36000, TRUE, FALSE, TRUE),
  ('Abdul Rahman', 'Welder', 'Fabrication', 'maharashtra', 'Bhandup Township Site', '2024-01-10', 22000, TRUE, TRUE, TRUE),
  ('Valli Murugesan', 'Store Keeper', 'Operations', 'maharashtra', 'Bhandup Township Site', '2023-03-20', 24000, TRUE, TRUE, TRUE),
  ('Arun Prakash', 'Electrician', 'Fabrication', 'delhi', 'Gandhinagar Township Site', '2024-05-01', 26000, TRUE, TRUE, TRUE),
  ('Selvam Raju', 'Driver', 'Logistics', 'korba', 'Korba TPS', '2020-08-12', 20000, TRUE, TRUE, FALSE)
) AS v(full_name, designation, department, region, site, joining_date, base_salary, pf_applicable, esi_applicable, is_active)
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE full_name = v.full_name AND site = v.site);

-- ---------------------------------------------------------------------
-- Payroll runs — Sept 2026, mixed payment statuses
-- ---------------------------------------------------------------------
INSERT INTO payroll_runs (id, employee_id, period_month, period_year, gross_salary, advance, deduction, pf_amount, esi_amount, payment_status, payment_date)
SELECT gen_random_uuid(), e.id, 9, 2026, v.gross_salary, v.advance, v.deduction, v.pf_amount, v.esi_amount, v.payment_status::payroll_payment_status, v.payment_date::date
FROM (VALUES
  ('Mani Chezhian', 32000, 2000, 500, 3840, 240, 'paid', '2026-10-01'),
  ('Senthil Kumar', 38000, 0, 0, 4560, 285, 'pending', NULL),
  ('Ramesh Iyer', 68000, 5000, 0, 8160, 0, 'paid', '2026-10-01'),
  ('Karthik Subramaniam', 65000, 0, 1000, 7800, 0, 'paid', '2026-10-01'),
  ('Abdul Rahman', 22000, 0, 0, 2640, 165, 'pending', NULL),
  ('Valli Murugesan', 24000, 1500, 0, 2880, 180, 'partially_paid', NULL)
) AS v(full_name, gross_salary, advance, deduction, pf_amount, esi_amount, payment_status, payment_date)
JOIN employees e ON e.full_name = v.full_name
WHERE NOT EXISTS (
  SELECT 1 FROM payroll_runs pr WHERE pr.employee_id = e.id AND pr.period_month = 9 AND pr.period_year = 2026
);

-- ---------------------------------------------------------------------
-- GST Invoices
-- ---------------------------------------------------------------------
INSERT INTO invoices (id, project_id, gstin, invoice_number, invoice_date, customer, taxable_value, cgst, sgst, igst, payment_status, gst_filing_status, due_date)
SELECT gen_random_uuid(), (SELECT id FROM projects WHERE work_order = v.work_order), v.gstin, v.invoice_number, v.invoice_date::date, v.customer, v.taxable_value, v.cgst, v.sgst, v.igst, v.payment_status::invoice_payment_status, v.gst_filing_status::gst_filing_status, v.due_date::date
FROM (VALUES
  ('WO-GSECL-2026-11', '27AAACS1234F1Z5', 'INV-2026-0091', '2026-09-28', 'GSECL', 4500000, 405000, 405000, 0, 'partially_paid', 'filed', '2026-10-28'),
  ('WO-GSECL-2026-11', '27AAACS1234F1Z5', 'INV-2026-0098', '2026-10-05', 'GSECL', 3000000, 0, 0, 540000, 'pending', 'not_filed', '2026-11-04'),
  ('WO-LICL-2026-07', '27AAACS1234F1Z5', 'INV-2026-0075', '2026-09-01', 'LICL', 12000000, 1080000, 1080000, 0, 'paid', 'filed', '2026-10-01'),
  ('WO-LICL-2026-07', '27AAACS1234F1Z5', 'INV-2026-0102', '2026-10-10', 'LICL', 8500000, 765000, 765000, 0, 'pending', 'not_filed', '2026-11-09'),
  ('WO-NTPC-2025-44', '27AAACS1234F1Z5', 'INV-2026-0060', '2026-08-20', 'NTPC Ltd', 20000000, 0, 0, 3600000, 'paid', 'filed', '2026-09-19'),
  ('WO-NTPC-2025-44', '27AAACS1234F1Z5', 'INV-2026-0068', '2026-09-10', 'NTPC Ltd', 18000000, 0, 0, 3240000, 'overdue', 'filed', '2026-10-10')
) AS v(work_order, gstin, invoice_number, invoice_date, customer, taxable_value, cgst, sgst, igst, payment_status, gst_filing_status, due_date)
ON CONFLICT (invoice_number) DO NOTHING;

-- ---------------------------------------------------------------------
-- Daily Work Updates
-- ---------------------------------------------------------------------
INSERT INTO daily_work_updates (id, project_id, site, work_date, entered_by, work_done, manpower_deployed, materials_used, approved_by, approved_at)
SELECT gen_random_uuid(),
  (SELECT id FROM projects WHERE work_order = 'WO-GSECL-2026-11'),
  'Gandhinagar Township Site', '2026-10-05',
  (SELECT id FROM users WHERE email = 'pm.delhi@sprincehightech.com'),
  'Foundation casting completed for Block C, admin wing shuttering started.', 42, 'Cement 120 bags, steel 2.4T',
  (SELECT id FROM users WHERE email = 'pm.delhi@sprincehightech.com'), '2026-10-05T18:00:00Z'
WHERE EXISTS (SELECT 1 FROM projects WHERE work_order = 'WO-GSECL-2026-11');

INSERT INTO daily_work_updates (id, project_id, site, work_date, entered_by, work_done, manpower_deployed, materials_used, approved_by, approved_at)
SELECT gen_random_uuid(),
  (SELECT id FROM projects WHERE work_order = 'WO-GSECL-2026-11'),
  'Gandhinagar Township Site', '2026-10-06',
  (SELECT id FROM users WHERE email = 'pm.delhi@sprincehightech.com'),
  'Block C shuttering 60% done, electrical conduit laying started in Block A.', 38, 'PVC conduit 400m',
  NULL, NULL
WHERE EXISTS (SELECT 1 FROM projects WHERE work_order = 'WO-GSECL-2026-11');

INSERT INTO daily_work_updates (id, project_id, site, work_date, entered_by, work_done, manpower_deployed, materials_used, approved_by, approved_at)
SELECT gen_random_uuid(),
  (SELECT id FROM projects WHERE work_order = 'WO-LICL-2026-07'),
  'Bhandup Township Site', '2026-10-04',
  (SELECT id FROM users WHERE email = 'regionalhead.maharashtra@sprincehightech.com'),
  'Steel column erection for Block D completed, welding inspection passed.', 55, 'Structural steel 8T, welding rods 40kg',
  (SELECT id FROM users WHERE email = 'regionalhead.maharashtra@sprincehightech.com'), '2026-10-04T19:00:00Z'
WHERE EXISTS (SELECT 1 FROM projects WHERE work_order = 'WO-LICL-2026-07');

INSERT INTO daily_work_updates (id, project_id, site, work_date, entered_by, work_done, manpower_deployed, materials_used, approved_by, approved_at)
SELECT gen_random_uuid(),
  (SELECT id FROM projects WHERE work_order = 'WO-LICL-2026-07'),
  'Bhandup Township Site', '2026-10-06',
  (SELECT id FROM users WHERE email = 'regionalhead.maharashtra@sprincehightech.com'),
  'Electrical first-fix wiring started in Blocks A and B.', 30, 'Copper wiring 1200m, conduit boxes 80 units',
  NULL, NULL
WHERE EXISTS (SELECT 1 FROM projects WHERE work_order = 'WO-LICL-2026-07');

INSERT INTO daily_work_updates (id, project_id, site, work_date, entered_by, work_done, manpower_deployed, materials_used, approved_by, approved_at)
SELECT gen_random_uuid(),
  (SELECT id FROM projects WHERE work_order = 'WO-NTPC-2025-44'),
  'Korba Super Thermal Power Station', '2026-09-12',
  (SELECT id FROM users WHERE email = 'pm.korba@sprincehightech.com'),
  'Final stone-picking handover completed, belt inspection signed off by NTPC engineer.', 18, 'N/A',
  (SELECT id FROM users WHERE email = 'pm.korba@sprincehightech.com'), '2026-09-12T17:30:00Z'
WHERE EXISTS (SELECT 1 FROM projects WHERE work_order = 'WO-NTPC-2025-44');

COMMIT;

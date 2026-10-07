-- S. Prince Hightech CRM — Phase 1 schema
-- Covers: users/roles, tenders, projects, subcontractors, employees,
-- attendance, payroll, GST invoices, daily work updates.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- Users & Roles
-- ---------------------------------------------------------------------
CREATE TYPE user_role AS ENUM (
  'director',
  'regional_head',
  'project_manager',
  'site_supervisor',
  'accounts_officer',
  'tender_officer',
  'hr_officer'
);

CREATE TYPE region AS ENUM ('korba', 'delhi', 'maharashtra');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  region region,                         -- NULL = company-wide (e.g. director)
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Tenders
-- ---------------------------------------------------------------------
CREATE TYPE tender_status AS ENUM (
  'new', 'under_evaluation', 'bid_preparing', 'submitted', 'won', 'lost'
);

CREATE TABLE tenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_code VARCHAR(50) UNIQUE NOT NULL,     -- "Tender ID"
  organisation VARCHAR(200) NOT NULL,
  tender_name VARCHAR(200) NOT NULL,
  work_description TEXT,
  tender_value NUMERIC(14, 2),
  emd NUMERIC(14, 2),
  tender_fee NUMERIC(14, 2),
  submission_date DATE,
  opening_date DATE,
  eligibility TEXT,
  status tender_status NOT NULL DEFAULT 'new',
  region region,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tender_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Projects (created from a Won tender)
-- ---------------------------------------------------------------------
CREATE TYPE project_work_status AS ENUM (
  'not_started', 'in_progress', 'on_hold', 'completed'
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID REFERENCES tenders(id),       -- source tender, nullable for direct-entry projects
  client VARCHAR(200) NOT NULL,
  work_order VARCHAR(100),
  project_value NUMERIC(14, 2),
  start_date DATE,
  end_date DATE,
  site VARCHAR(200),
  region region NOT NULL,
  project_manager_id UUID REFERENCES users(id),
  work_status project_work_status NOT NULL DEFAULT 'not_started',
  progress_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  billing NUMERIC(14, 2) NOT NULL DEFAULT 0,
  payment_received NUMERIC(14, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Subcontractors (master + many-to-many project assignment)
-- ---------------------------------------------------------------------
CREATE TABLE subcontractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(200) NOT NULL,
  contact_name VARCHAR(150),
  contact_phone VARCHAR(30),
  contact_email VARCHAR(150),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE subcontractor_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id UUID NOT NULL REFERENCES subcontractors(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  assigned_work VARCHAR(200) NOT NULL,         -- e.g. "Civil Work", "Stone Picking", "Painting"
  contract_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
  work_start_date DATE,
  work_end_date DATE,
  work_progress_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  bill_submitted BOOLEAN NOT NULL DEFAULT FALSE,
  bill_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  balance NUMERIC(14, 2) GENERATED ALWAYS AS (bill_amount - paid_amount) STORED,
  payment_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE subcontractor_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES subcontractor_assignments(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Employees, Attendance, Payroll
-- ---------------------------------------------------------------------
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),           -- linked login, if the employee has system access
  full_name VARCHAR(150) NOT NULL,
  designation VARCHAR(100),
  department VARCHAR(100),
  region region,
  site VARCHAR(200),
  joining_date DATE,
  base_salary NUMERIC(12, 2) NOT NULL DEFAULT 0,
  pf_applicable BOOLEAN NOT NULL DEFAULT TRUE,
  esi_applicable BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'half_day', 'leave');

CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  site VARCHAR(200),
  attendance_date DATE NOT NULL,
  status attendance_status NOT NULL,
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, attendance_date)
);

CREATE TYPE payroll_payment_status AS ENUM ('pending', 'paid', 'partially_paid');

CREATE TABLE payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  period_month SMALLINT NOT NULL,              -- 1-12
  period_year SMALLINT NOT NULL,
  gross_salary NUMERIC(12, 2) NOT NULL DEFAULT 0,
  advance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  deduction NUMERIC(12, 2) NOT NULL DEFAULT 0,
  pf_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  esi_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  net_salary NUMERIC(12, 2) GENERATED ALWAYS AS
    (gross_salary - advance - deduction - pf_amount - esi_amount) STORED,
  payment_status payroll_payment_status NOT NULL DEFAULT 'pending',
  payment_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, period_month, period_year)
);

-- ---------------------------------------------------------------------
-- GST / Finance (tracking layer, not a filing engine)
-- ---------------------------------------------------------------------
CREATE TYPE invoice_payment_status AS ENUM ('pending', 'paid', 'partially_paid', 'overdue');
CREATE TYPE gst_filing_status AS ENUM ('not_filed', 'filed');

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  gstin VARCHAR(20),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_date DATE NOT NULL,
  customer VARCHAR(200) NOT NULL,
  taxable_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
  cgst NUMERIC(14, 2) NOT NULL DEFAULT 0,
  sgst NUMERIC(14, 2) NOT NULL DEFAULT 0,
  igst NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(14, 2) GENERATED ALWAYS AS
    (taxable_value + cgst + sgst + igst) STORED,
  payment_status invoice_payment_status NOT NULL DEFAULT 'pending',
  gst_filing_status gst_filing_status NOT NULL DEFAULT 'not_filed',
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Daily Work Updates (site -> director rollup)
-- ---------------------------------------------------------------------
CREATE TABLE daily_work_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  site VARCHAR(200),
  work_date DATE NOT NULL,
  entered_by UUID REFERENCES users(id),
  work_done TEXT NOT NULL,
  manpower_deployed INTEGER DEFAULT 0,
  materials_used TEXT,
  progress_delta NUMERIC(5, 2) DEFAULT 0,
  photo_url VARCHAR(500),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Indexes for common dashboard/filter queries
-- ---------------------------------------------------------------------
CREATE INDEX idx_tenders_status ON tenders(status);
CREATE INDEX idx_tenders_region ON tenders(region);
CREATE INDEX idx_projects_region ON projects(region);
CREATE INDEX idx_projects_manager ON projects(project_manager_id);
CREATE INDEX idx_subcontractor_assignments_project ON subcontractor_assignments(project_id);
CREATE INDEX idx_subcontractor_assignments_subcontractor ON subcontractor_assignments(subcontractor_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_payroll_period ON payroll_runs(period_year, period_month);
CREATE INDEX idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX idx_daily_work_updates_project ON daily_work_updates(project_id);

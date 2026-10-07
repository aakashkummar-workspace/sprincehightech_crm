import { Router } from 'express';
import { pool } from '../../db/pool.js';
import { authenticate, regionFilter } from '../../middleware/auth.js';

const router = Router();

// GET /api/dashboard  — the 12 KPIs from the PDF spec, region-scoped for non-management roles
router.get('/dashboard', authenticate, async (req, res) => {
  const scopeRegion = regionFilter(req.user);
  const regionClauseTenders = scopeRegion ? 'AND region = $1' : '';
  const regionClauseProjects = scopeRegion ? 'AND region = $1' : '';
  const params = scopeRegion ? [scopeRegion] : [];

  const [
    activeTenders, upcomingDeadlines, wonLost, activeProjects, projectValue,
    subcontractorWork, subcontractorPayable, subcontractorBillsPending, employeeCount, salaryPending,
    pfStatus, gstStatus, receivables, revenueExpenses,
  ] = await Promise.all([
    pool.query(
      `SELECT COUNT(*) FROM tenders WHERE status NOT IN ('won','lost') ${regionClauseTenders}`, params
    ),
    pool.query(
      `SELECT tender_code, tender_name, submission_date FROM tenders
       WHERE status NOT IN ('won','lost') AND submission_date >= CURRENT_DATE
       ${regionClauseTenders} ORDER BY submission_date ASC LIMIT 10`, params
    ),
    pool.query(
      `SELECT status, COUNT(*) FROM tenders WHERE status IN ('won','lost')
       ${regionClauseTenders} GROUP BY status`, params
    ),
    pool.query(
      `SELECT COUNT(*) FROM projects WHERE work_status != 'completed' ${regionClauseProjects}`, params
    ),
    pool.query(
      `SELECT COALESCE(SUM(project_value),0) AS total FROM projects
       WHERE work_status != 'completed' ${regionClauseProjects}`, params
    ),
    pool.query(
      `SELECT COUNT(*) FROM subcontractor_assignments sa
       JOIN projects p ON p.id = sa.project_id
       WHERE sa.work_progress_percent < 100 ${scopeRegion ? 'AND p.region = $1' : ''}`, params
    ),
    pool.query(
      `SELECT COALESCE(SUM(sa.balance),0) AS total FROM subcontractor_assignments sa
       JOIN projects p ON p.id = sa.project_id
       WHERE sa.balance > 0 ${scopeRegion ? 'AND p.region = $1' : ''}`, params
    ),
    pool.query(
      `SELECT COUNT(*) FROM subcontractor_assignments sa
       JOIN projects p ON p.id = sa.project_id
       WHERE sa.bill_submitted = FALSE ${scopeRegion ? 'AND p.region = $1' : ''}`, params
    ),
    pool.query(
      `SELECT COUNT(*) FROM employees WHERE is_active = TRUE ${scopeRegion ? 'AND region = $1' : ''}`, params
    ),
    pool.query(
      `SELECT COALESCE(SUM(net_salary),0) AS total FROM payroll_runs
       WHERE payment_status = 'pending'`, []
    ),
    pool.query(
      `SELECT COALESCE(SUM(pf_amount),0) AS total_pf FROM payroll_runs
       WHERE period_year = EXTRACT(YEAR FROM CURRENT_DATE)
       AND period_month = EXTRACT(MONTH FROM CURRENT_DATE)`, []
    ),
    pool.query(
      `SELECT gst_filing_status, COUNT(*) FROM invoices GROUP BY gst_filing_status`, []
    ),
    pool.query(
      `SELECT COALESCE(SUM(total_amount),0) AS total FROM invoices
       WHERE payment_status IN ('pending','partially_paid','overdue')`, []
    ),
    pool.query(
      `SELECT
        (SELECT COALESCE(SUM(total_amount),0) FROM invoices) AS revenue,
        (SELECT COALESCE(SUM(net_salary),0) FROM payroll_runs) +
        (SELECT COALESCE(SUM(paid_amount),0) FROM subcontractor_assignments) AS expenses
      `, []
    ),
  ]);

  res.json({
    active_tenders: Number(activeTenders.rows[0].count),
    upcoming_tender_deadlines: upcomingDeadlines.rows,
    won_lost_tenders: wonLost.rows,
    active_projects: Number(activeProjects.rows[0].count),
    project_value: Number(projectValue.rows[0].total),
    subcontractor_work_pending: Number(subcontractorWork.rows[0].count),
    subcontractor_pending_payments: Number(subcontractorPayable.rows[0].total),
    subcontractor_bills_pending: Number(subcontractorBillsPending.rows[0].count),
    employee_count: Number(employeeCount.rows[0].count),
    salary_pending: Number(salaryPending.rows[0].total),
    pf_status_current_month: Number(pfStatus.rows[0].total_pf),
    gst_filing_status: gstStatus.rows,
    customer_receivables: Number(receivables.rows[0].total),
    revenue_expenses: {
      revenue: Number(revenueExpenses.rows[0].revenue),
      expenses: Number(revenueExpenses.rows[0].expenses),
    },
  });
});

export default router;

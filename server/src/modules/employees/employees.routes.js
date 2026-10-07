import { Router } from 'express';
import { pool } from '../../db/pool.js';
import { authenticate, requireRole, regionFilter } from '../../middleware/auth.js';

const router = Router();

// ---------------------------------------------------------------------
// Employee master
// ---------------------------------------------------------------------

router.get('/employees', authenticate, async (req, res) => {
  const scopeRegion = regionFilter(req.user);
  const params = [];
  let where = '';
  if (scopeRegion) {
    params.push(scopeRegion);
    where = 'WHERE region = $1';
  }
  const { rows } = await pool.query(
    `SELECT * FROM employees ${where} ORDER BY full_name`,
    params
  );
  res.json(rows);
});

router.get('/employees/:id', authenticate, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM employees WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Employee not found' });
  res.json(rows[0]);
});

router.post(
  '/employees',
  authenticate,
  requireRole('hr_officer', 'director'),
  async (req, res) => {
    const {
      full_name, designation, department, region, site, joining_date,
      base_salary, pf_applicable, esi_applicable,
    } = req.body;
    if (!full_name) return res.status(400).json({ error: 'full_name is required' });

    const { rows } = await pool.query(
      `INSERT INTO employees
        (full_name, designation, department, region, site, joining_date, base_salary,
         pf_applicable, esi_applicable)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [full_name, designation, department, region, site, joining_date,
       base_salary || 0, pf_applicable ?? true, esi_applicable ?? false]
    );
    res.status(201).json(rows[0]);
  }
);

router.patch(
  '/employees/:id',
  authenticate,
  requireRole('hr_officer', 'director'),
  async (req, res) => {
    const fields = [
      'full_name', 'designation', 'department', 'region', 'site', 'joining_date',
      'base_salary', 'pf_applicable', 'esi_applicable', 'is_active',
    ];
    const updates = [];
    const params = [];
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        params.push(req.body[f]);
        updates.push(`${f} = $${params.length}`);
      }
    }
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });

    params.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE employees SET ${updates.join(', ')}, updated_at = now()
       WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (!rows[0]) return res.status(404).json({ error: 'Employee not found' });
    res.json(rows[0]);
  }
);

// ---------------------------------------------------------------------
// Attendance (day-wise, per site)
// ---------------------------------------------------------------------

// POST /api/attendance/bulk  — grid entry: one site, one date, many employees
router.post(
  '/attendance/bulk',
  authenticate,
  requireRole('hr_officer', 'site_supervisor', 'director'),
  async (req, res) => {
    const { site, attendance_date, entries } = req.body; // entries: [{employee_id, status}]
    if (!attendance_date || !Array.isArray(entries) || !entries.length) {
      return res.status(400).json({ error: 'attendance_date and entries[] are required' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const results = [];
      for (const entry of entries) {
        const { rows } = await client.query(
          `INSERT INTO attendance (employee_id, site, attendance_date, status, recorded_by)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (employee_id, attendance_date)
           DO UPDATE SET status = EXCLUDED.status, site = EXCLUDED.site
           RETURNING *`,
          [entry.employee_id, site, attendance_date, entry.status, req.user.id]
        );
        results.push(rows[0]);
      }
      await client.query('COMMIT');
      res.status(201).json(results);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
);

router.get('/attendance', authenticate, async (req, res) => {
  const { employee_id, from, to, site } = req.query;
  const conditions = [];
  const params = [];
  if (employee_id) { params.push(employee_id); conditions.push(`employee_id = $${params.length}`); }
  if (site) { params.push(site); conditions.push(`site = $${params.length}`); }
  if (from) { params.push(from); conditions.push(`attendance_date >= $${params.length}`); }
  if (to) { params.push(to); conditions.push(`attendance_date <= $${params.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT * FROM attendance ${where} ORDER BY attendance_date DESC`,
    params
  );
  res.json(rows);
});

// ---------------------------------------------------------------------
// Payroll — statutory rates centralised here (Phase 1 defaults, India norms)
// ---------------------------------------------------------------------
const PF_RATE = 0.12;   // 12% of basic, employee share
const ESI_RATE = 0.0075; // 0.75% of gross, employee share (applicable below wage ceiling)

// POST /api/payroll/run  — compute a payroll run for one employee/period (review before save)
router.post(
  '/payroll/preview',
  authenticate,
  requireRole('accounts_officer', 'director'),
  async (req, res) => {
    const { employee_id, period_month, period_year, advance = 0, deduction = 0 } = req.body;
    const { rows } = await pool.query('SELECT * FROM employees WHERE id = $1', [employee_id]);
    const employee = rows[0];
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const gross_salary = Number(employee.base_salary);
    const pf_amount = employee.pf_applicable ? Number((gross_salary * PF_RATE).toFixed(2)) : 0;
    const esi_amount = employee.esi_applicable ? Number((gross_salary * ESI_RATE).toFixed(2)) : 0;
    const net_salary = gross_salary - advance - deduction - pf_amount - esi_amount;

    res.json({
      employee_id, period_month, period_year, gross_salary,
      advance, deduction, pf_amount, esi_amount, net_salary,
    });
  }
);

// POST /api/payroll/run  — confirm and persist a payroll run
router.post(
  '/payroll/run',
  authenticate,
  requireRole('accounts_officer', 'director'),
  async (req, res) => {
    const {
      employee_id, period_month, period_year,
      gross_salary, advance = 0, deduction = 0, pf_amount = 0, esi_amount = 0,
    } = req.body;

    if (!employee_id || !period_month || !period_year) {
      return res.status(400).json({ error: 'employee_id, period_month, period_year are required' });
    }

    const { rows } = await pool.query(
      `INSERT INTO payroll_runs
        (employee_id, period_month, period_year, gross_salary, advance, deduction, pf_amount, esi_amount)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (employee_id, period_month, period_year)
       DO UPDATE SET gross_salary = EXCLUDED.gross_salary, advance = EXCLUDED.advance,
         deduction = EXCLUDED.deduction, pf_amount = EXCLUDED.pf_amount,
         esi_amount = EXCLUDED.esi_amount, updated_at = now()
       RETURNING *`,
      [employee_id, period_month, period_year, gross_salary, advance, deduction, pf_amount, esi_amount]
    );
    res.status(201).json(rows[0]);
  }
);

router.patch(
  '/payroll/:id/mark-paid',
  authenticate,
  requireRole('accounts_officer', 'director'),
  async (req, res) => {
    const { payment_date } = req.body;
    const { rows } = await pool.query(
      `UPDATE payroll_runs SET payment_status = 'paid', payment_date = $1, updated_at = now()
       WHERE id = $2 RETURNING *`,
      [payment_date || new Date(), req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Payroll run not found' });
    res.json(rows[0]);
  }
);

router.get('/payroll', authenticate, async (req, res) => {
  const { period_month, period_year, employee_id } = req.query;
  const conditions = [];
  const params = [];
  if (period_month) { params.push(period_month); conditions.push(`period_month = $${params.length}`); }
  if (period_year) { params.push(period_year); conditions.push(`period_year = $${params.length}`); }
  if (employee_id) { params.push(employee_id); conditions.push(`employee_id = $${params.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT pr.*, e.full_name, e.designation, e.region
     FROM payroll_runs pr JOIN employees e ON e.id = pr.employee_id
     ${where} ORDER BY pr.period_year DESC, pr.period_month DESC`,
    params
  );
  res.json(rows);
});

export default router;

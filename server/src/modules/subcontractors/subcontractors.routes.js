import { Router } from 'express';
import { pool } from '../../db/pool.js';
import { authenticate, requireRole } from '../../middleware/auth.js';

const router = Router();

// GET /api/subcontractors  (master list)
router.get('/subcontractors', authenticate, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM subcontractors ORDER BY company_name');
  res.json(rows);
});

// GET /api/subcontractors/:id  (with all assignments across projects)
router.get('/subcontractors/:id', authenticate, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM subcontractors WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Subcontractor not found' });

  const assignments = await pool.query(
    `SELECT sa.*, p.client, p.site, p.region
     FROM subcontractor_assignments sa
     JOIN projects p ON p.id = sa.project_id
     WHERE sa.subcontractor_id = $1
     ORDER BY sa.created_at DESC`,
    [req.params.id]
  );
  res.json({ ...rows[0], assignments: assignments.rows });
});

// POST /api/subcontractors  (create master record)
router.post(
  '/subcontractors',
  authenticate,
  requireRole('director', 'regional_head', 'project_manager'),
  async (req, res) => {
    const { company_name, contact_name, contact_phone, contact_email } = req.body;
    if (!company_name) return res.status(400).json({ error: 'company_name is required' });
    const { rows } = await pool.query(
      `INSERT INTO subcontractors (company_name, contact_name, contact_phone, contact_email)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [company_name, contact_name, contact_phone, contact_email]
    );
    res.status(201).json(rows[0]);
  }
);

// POST /api/projects/:projectId/subcontractor-assignments  (assign sub to a project)
router.post(
  '/projects/:projectId/subcontractor-assignments',
  authenticate,
  requireRole('director', 'regional_head', 'project_manager'),
  async (req, res) => {
    const { subcontractor_id, assigned_work, contract_value, work_start_date, work_end_date } = req.body;
    if (!subcontractor_id || !assigned_work) {
      return res.status(400).json({ error: 'subcontractor_id and assigned_work are required' });
    }
    const { rows } = await pool.query(
      `INSERT INTO subcontractor_assignments
        (subcontractor_id, project_id, assigned_work, contract_value, work_start_date, work_end_date)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [subcontractor_id, req.params.projectId, assigned_work, contract_value || 0, work_start_date, work_end_date]
    );
    res.status(201).json(rows[0]);
  }
);

// PATCH /api/subcontractor-assignments/:id  (progress, bill submission, payment)
router.patch(
  '/subcontractor-assignments/:id',
  authenticate,
  requireRole('director', 'regional_head', 'project_manager', 'accounts_officer'),
  async (req, res) => {
    const fields = [
      'assigned_work', 'contract_value', 'work_start_date', 'work_end_date',
      'work_progress_percent', 'bill_submitted', 'bill_amount', 'paid_amount', 'payment_date',
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
      `UPDATE subcontractor_assignments SET ${updates.join(', ')}, updated_at = now()
       WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (!rows[0]) return res.status(404).json({ error: 'Assignment not found' });
    res.json(rows[0]);
  }
);

// POST /api/subcontractor-assignments/:id/documents
router.post(
  '/subcontractor-assignments/:id/documents',
  authenticate,
  requireRole('director', 'regional_head', 'project_manager', 'accounts_officer'),
  async (req, res) => {
    const { file_name, file_url } = req.body;
    if (!file_name || !file_url) {
      return res.status(400).json({ error: 'file_name and file_url are required' });
    }
    const { rows } = await pool.query(
      `INSERT INTO subcontractor_documents (assignment_id, file_name, file_url)
       VALUES ($1,$2,$3) RETURNING *`,
      [req.params.id, file_name, file_url]
    );
    res.status(201).json(rows[0]);
  }
);

export default router;

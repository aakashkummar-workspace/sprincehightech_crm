import { Router } from 'express';
import { pool } from '../../db/pool.js';
import { authenticate, requireRole, regionFilter, isManagement } from '../../middleware/auth.js';

const router = Router();

// GET /api/projects
router.get('/projects', authenticate, async (req, res) => {
  const { region, status } = req.query;
  const scopeRegion = regionFilter(req.user);
  const conditions = [];
  const params = [];

  // Project Managers only see their own projects unless management/accounts.
  if (req.user.role === 'project_manager') {
    params.push(req.user.id);
    conditions.push(`p.project_manager_id = $${params.length}`);
  }

  const effectiveRegion = region || scopeRegion;
  if (effectiveRegion) {
    params.push(effectiveRegion);
    conditions.push(`p.region = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`p.work_status = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT p.*, u.name AS project_manager_name
     FROM projects p
     LEFT JOIN users u ON u.id = p.project_manager_id
     ${where} ORDER BY p.created_at DESC`,
    params
  );
  res.json(rows);
});

// GET /api/projects/:id  (with subcontractor assignments + recent daily updates)
router.get('/projects/:id', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT p.*, u.name AS project_manager_name
     FROM projects p
     LEFT JOIN users u ON u.id = p.project_manager_id
     WHERE p.id = $1`,
    [req.params.id]
  );
  const project = rows[0];
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const subs = await pool.query(
    `SELECT sa.*, s.company_name, s.contact_name, s.contact_phone
     FROM subcontractor_assignments sa
     JOIN subcontractors s ON s.id = sa.subcontractor_id
     WHERE sa.project_id = $1
     ORDER BY sa.created_at DESC`,
    [req.params.id]
  );

  const updates = await pool.query(
    `SELECT * FROM daily_work_updates WHERE project_id = $1 ORDER BY work_date DESC LIMIT 20`,
    [req.params.id]
  );

  res.json({ ...project, subcontractor_assignments: subs.rows, recent_daily_updates: updates.rows });
});

// POST /api/projects  (direct creation, bypassing a tender — e.g. negotiated work)
router.post(
  '/projects',
  authenticate,
  requireRole('director', 'regional_head'),
  async (req, res) => {
    const {
      client, work_order, project_value, start_date, end_date, site,
      region, project_manager_id,
    } = req.body;
    if (!client || !region) {
      return res.status(400).json({ error: 'client and region are required' });
    }
    const { rows } = await pool.query(
      `INSERT INTO projects
        (client, work_order, project_value, start_date, end_date, site, region, project_manager_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [client, work_order, project_value, start_date, end_date, site, region, project_manager_id]
    );
    res.status(201).json(rows[0]);
  }
);

// PATCH /api/projects/:id
router.patch('/projects/:id', authenticate, async (req, res) => {
  // Project Manager may only edit their own project; management can edit any.
  const existing = await pool.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
  if (!existing.rows[0]) return res.status(404).json({ error: 'Project not found' });

  const owns = existing.rows[0].project_manager_id === req.user.id;
  if (!isManagement(req.user) && !owns) {
    return res.status(403).json({ error: 'Not authorized to edit this project' });
  }

  const fields = [
    'client', 'work_order', 'project_value', 'start_date', 'end_date', 'site',
    'project_manager_id', 'work_status', 'progress_percent', 'billing', 'payment_received',
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
    `UPDATE projects SET ${updates.join(', ')}, updated_at = now()
     WHERE id = $${params.length} RETURNING *`,
    params
  );
  res.json(rows[0]);
});

export default router;

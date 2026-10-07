import { Router } from 'express';
import { pool } from '../../db/pool.js';
import { authenticate, requireRole } from '../../middleware/auth.js';

const router = Router();

// POST /api/daily-work-updates  (site_supervisor/project_manager enter day-to-day; director can too)
router.post(
  '/daily-work-updates',
  authenticate,
  requireRole('site_supervisor', 'project_manager', 'director'),
  async (req, res) => {
    const { project_id, site, work_date, work_done, manpower_deployed, materials_used, photo_url } = req.body;
    if (!project_id || !work_date || !work_done) {
      return res.status(400).json({ error: 'project_id, work_date, work_done are required' });
    }
    const { rows } = await pool.query(
      `INSERT INTO daily_work_updates
        (project_id, site, work_date, entered_by, work_done, manpower_deployed, materials_used, photo_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [project_id, site, work_date, req.user.id, work_done, manpower_deployed || 0, materials_used, photo_url]
    );
    res.status(201).json(rows[0]);
  }
);

// PATCH /api/daily-work-updates/:id/approve  (project_manager approves, applies progress_delta to project)
router.patch(
  '/daily-work-updates/:id/approve',
  authenticate,
  requireRole('project_manager', 'director', 'regional_head'),
  async (req, res) => {
    const { progress_delta = 0 } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const updRes = await client.query(
        `UPDATE daily_work_updates
         SET progress_delta = $1, approved_by = $2, approved_at = now()
         WHERE id = $3 RETURNING *`,
        [progress_delta, req.user.id, req.params.id]
      );
      const update = updRes.rows[0];
      if (!update) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Daily work update not found' });
      }

      await client.query(
        `UPDATE projects
         SET progress_percent = LEAST(100, progress_percent + $1), updated_at = now()
         WHERE id = $2`,
        [progress_delta, update.project_id]
      );

      await client.query('COMMIT');
      res.json(update);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
);

// GET /api/daily-work-updates?project_id=...
router.get('/daily-work-updates', authenticate, async (req, res) => {
  const { project_id, from, to } = req.query;
  const conditions = [];
  const params = [];
  if (project_id) { params.push(project_id); conditions.push(`project_id = $${params.length}`); }
  if (from) { params.push(from); conditions.push(`work_date >= $${params.length}`); }
  if (to) { params.push(to); conditions.push(`work_date <= $${params.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT * FROM daily_work_updates ${where} ORDER BY work_date DESC`,
    params
  );
  res.json(rows);
});

export default router;

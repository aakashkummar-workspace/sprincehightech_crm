import { Router } from 'express';
import { pool } from '../../db/pool.js';
import { authenticate, requireRole, regionFilter } from '../../middleware/auth.js';

const router = Router();

const VALID_STATUSES = ['new', 'under_evaluation', 'bid_preparing', 'submitted', 'won', 'lost'];

// GET /api/tenders  (list + filter by status/region)
router.get('/tenders', authenticate, async (req, res) => {
  const { status, region } = req.query;
  const scopeRegion = regionFilter(req.user);
  const conditions = [];
  const params = [];

  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }
  const effectiveRegion = region || scopeRegion;
  if (effectiveRegion) {
    params.push(effectiveRegion);
    conditions.push(`region = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT * FROM tenders ${where} ORDER BY created_at DESC`,
    params
  );
  res.json(rows);
});

// GET /api/tenders/:id
router.get('/tenders/:id', authenticate, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM tenders WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Tender not found' });
  const docs = await pool.query(
    'SELECT * FROM tender_documents WHERE tender_id = $1 ORDER BY uploaded_at DESC',
    [req.params.id]
  );
  res.json({ ...rows[0], documents: docs.rows });
});

// POST /api/tenders  (tender_officer, director)
router.post(
  '/tenders',
  authenticate,
  requireRole('tender_officer', 'director'),
  async (req, res) => {
    const {
      tender_code, organisation, tender_name, work_description,
      tender_value, emd, tender_fee, submission_date, opening_date,
      eligibility, region,
    } = req.body;

    if (!tender_code || !organisation || !tender_name) {
      return res.status(400).json({ error: 'tender_code, organisation, tender_name are required' });
    }

    const { rows } = await pool.query(
      `INSERT INTO tenders
        (tender_code, organisation, tender_name, work_description, tender_value, emd,
         tender_fee, submission_date, opening_date, eligibility, region, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [tender_code, organisation, tender_name, work_description, tender_value, emd,
       tender_fee, submission_date, opening_date, eligibility, region, req.user.id]
    );
    res.status(201).json(rows[0]);
  }
);

// PATCH /api/tenders/:id  (edit fields)
router.patch(
  '/tenders/:id',
  authenticate,
  requireRole('tender_officer', 'director'),
  async (req, res) => {
    const fields = [
      'organisation', 'tender_name', 'work_description', 'tender_value', 'emd',
      'tender_fee', 'submission_date', 'opening_date', 'eligibility', 'region',
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
      `UPDATE tenders SET ${updates.join(', ')}, updated_at = now()
       WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (!rows[0]) return res.status(404).json({ error: 'Tender not found' });
    res.json(rows[0]);
  }
);

// PATCH /api/tenders/:id/status  (workflow progression)
router.patch(
  '/tenders/:id/status',
  authenticate,
  requireRole('tender_officer', 'director'),
  async (req, res) => {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }
    const { rows } = await pool.query(
      `UPDATE tenders SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Tender not found' });
    res.json(rows[0]);
  }
);

// POST /api/tenders/:id/documents  (record an uploaded doc's metadata)
router.post(
  '/tenders/:id/documents',
  authenticate,
  requireRole('tender_officer', 'director'),
  async (req, res) => {
    const { file_name, file_url } = req.body;
    if (!file_name || !file_url) {
      return res.status(400).json({ error: 'file_name and file_url are required' });
    }
    const { rows } = await pool.query(
      `INSERT INTO tender_documents (tender_id, file_name, file_url)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.params.id, file_name, file_url]
    );
    res.status(201).json(rows[0]);
  }
);

// POST /api/tenders/:id/convert-to-project  (Won tender -> new Project, pre-filled)
router.post(
  '/tenders/:id/convert-to-project',
  authenticate,
  requireRole('director', 'regional_head', 'tender_officer'),
  async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const tenderRes = await client.query('SELECT * FROM tenders WHERE id = $1', [req.params.id]);
      const tender = tenderRes.rows[0];
      if (!tender) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Tender not found' });
      }
      if (tender.status !== 'won') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Only a Won tender can be converted to a project' });
      }

      const {
        client: clientName, work_order, project_value, start_date, end_date,
        site, project_manager_id,
      } = req.body;

      const projRes = await client.query(
        `INSERT INTO projects
          (tender_id, client, work_order, project_value, start_date, end_date, site,
           region, project_manager_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING *`,
        [
          tender.id,
          clientName || tender.organisation,
          work_order || null,
          project_value || tender.tender_value,
          start_date || null,
          end_date || null,
          site || null,
          tender.region,
          project_manager_id || null,
        ]
      );

      await client.query('COMMIT');
      res.status(201).json(projRes.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
);

export default router;

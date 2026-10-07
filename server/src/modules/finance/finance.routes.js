import { Router } from 'express';
import { pool } from '../../db/pool.js';
import { authenticate, requireRole } from '../../middleware/auth.js';

const router = Router();

const DEFAULT_GST_RATE = 0.18; // 18% standard rate; split CGST/SGST (intra-state) or IGST (inter-state)

// POST /api/invoices/calculate  — helper: auto-split GST given taxable value + state match
router.post('/invoices/calculate', authenticate, (req, res) => {
  const { taxable_value, is_inter_state, gst_rate = DEFAULT_GST_RATE } = req.body;
  if (taxable_value === undefined) {
    return res.status(400).json({ error: 'taxable_value is required' });
  }
  const taxAmount = Number(taxable_value) * Number(gst_rate);
  let cgst = 0, sgst = 0, igst = 0;
  if (is_inter_state) {
    igst = taxAmount;
  } else {
    cgst = taxAmount / 2;
    sgst = taxAmount / 2;
  }
  const total_amount = Number(taxable_value) + cgst + sgst + igst;
  res.json({ taxable_value, cgst, sgst, igst, total_amount });
});

// GET /api/invoices
router.get('/invoices', authenticate, async (req, res) => {
  const { payment_status, project_id } = req.query;
  const conditions = [];
  const params = [];
  if (payment_status) { params.push(payment_status); conditions.push(`payment_status = $${params.length}`); }
  if (project_id) { params.push(project_id); conditions.push(`project_id = $${params.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT * FROM invoices ${where} ORDER BY invoice_date DESC`,
    params
  );
  res.json(rows);
});

router.get('/invoices/:id', authenticate, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM invoices WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Invoice not found' });
  res.json(rows[0]);
});

router.post(
  '/invoices',
  authenticate,
  requireRole('accounts_officer', 'director'),
  async (req, res) => {
    const {
      project_id, gstin, invoice_number, invoice_date, customer,
      taxable_value, cgst = 0, sgst = 0, igst = 0, due_date,
    } = req.body;
    if (!invoice_number || !invoice_date || !customer) {
      return res.status(400).json({ error: 'invoice_number, invoice_date, customer are required' });
    }
    const { rows } = await pool.query(
      `INSERT INTO invoices
        (project_id, gstin, invoice_number, invoice_date, customer, taxable_value, cgst, sgst, igst, due_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [project_id, gstin, invoice_number, invoice_date, customer, taxable_value || 0, cgst, sgst, igst, due_date]
    );
    res.status(201).json(rows[0]);
  }
);

router.patch(
  '/invoices/:id',
  authenticate,
  requireRole('accounts_officer', 'director'),
  async (req, res) => {
    const fields = [
      'gstin', 'invoice_number', 'invoice_date', 'customer', 'taxable_value',
      'cgst', 'sgst', 'igst', 'payment_status', 'gst_filing_status', 'due_date',
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
      `UPDATE invoices SET ${updates.join(', ')}, updated_at = now()
       WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (!rows[0]) return res.status(404).json({ error: 'Invoice not found' });
    res.json(rows[0]);
  }
);

export default router;

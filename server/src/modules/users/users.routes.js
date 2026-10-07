import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../../db/pool.js';
import { authenticate, requireRole } from '../../middleware/auth.js';

const router = Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, region: user.region, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );
}

// POST /api/auth/login
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
    [email]
  );
  const user = rows[0];
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, region: user.region },
  });
});

// GET /api/auth/me
router.get('/auth/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/users  (director-only: create staff accounts)
router.post('/users', authenticate, requireRole('director'), async (req, res) => {
  const { name, email, password, role, region } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'name, email, password, role are required' });
  }
  const password_hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, region)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, role, region, created_at`,
    [name, email, password_hash, role, region || null]
  );
  res.status(201).json(rows[0]);
});

// GET /api/users  (director-only: list staff)
router.get('/users', authenticate, requireRole('director'), async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, name, email, role, region, is_active, created_at FROM users ORDER BY created_at DESC'
  );
  res.json(rows);
});

export default router;

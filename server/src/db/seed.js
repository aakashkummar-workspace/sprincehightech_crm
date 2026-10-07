import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import { pool } from './pool.js';

async function seed() {
  const client = await pool.connect();
  try {
    const password_hash = await bcrypt.hash('ChangeMe123!', 10);

    const { rows } = await client.query(
      `INSERT INTO users (name, email, password_hash, role, region)
       VALUES ('Admin Director', 'admin@sprincehightech.com', $1, 'director', NULL)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email`,
      [password_hash]
    );

    if (rows[0]) {
      console.log(`Seeded director account: ${rows[0].email} / ChangeMe123! (change immediately)`);
    } else {
      console.log('Director account already exists, skipped.');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

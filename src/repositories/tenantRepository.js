const pool = require('../config/database');

async function create({ email, passwordHash }) {
  const result = await pool.query(
    'INSERT INTO tenants (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
    [email, passwordHash]
  );
  return result.rows[0];
}

async function findByEmail(email) {
  const result = await pool.query(
    'SELECT id, email, password_hash, created_at FROM tenants WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
}

module.exports = { create, findByEmail };
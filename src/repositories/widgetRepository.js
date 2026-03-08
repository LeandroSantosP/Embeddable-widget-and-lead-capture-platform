const pool = require('../config/database');

async function listByTenant(tenantId) {
  const result = await pool.query(
    'SELECT id, tenant_id, title, type, settings, created_at FROM widgets WHERE tenant_id = $1 ORDER BY created_at DESC',
    [tenantId]
  );
  return result.rows;
}

async function findByIdForTenant(widgetId, tenantId) {
  const result = await pool.query(
    'SELECT id, tenant_id, title, type, settings, created_at FROM widgets WHERE id = $1 AND tenant_id = $2',
    [widgetId, tenantId]
  );
  return result.rows[0] || null;
}

async function findPublicById(widgetId) {
  const result = await pool.query(
    'SELECT id, title, type, settings FROM widgets WHERE id = $1',
    [widgetId]
  );
  return result.rows[0] || null;
}

async function createForTenant(tenantId, { title, type, settings = {} }) {
  const result = await pool.query(
    'INSERT INTO widgets (tenant_id, title, type, settings) VALUES ($1, $2, $3, $4) RETURNING id, tenant_id, title, type, settings, created_at',
    [tenantId, title, type, settings]
  );
  return result.rows[0];
}

async function deleteForTenant(widgetId, tenantId) {
  const result = await pool.query(
    'DELETE FROM widgets WHERE id = $1 AND tenant_id = $2 RETURNING id',
    [widgetId, tenantId]
  );
  return result.rowCount > 0;
}

async function updateForTenant(widgetId, tenantId, changes) {
  const fields = [];
  const values = [];

  if (changes.title !== undefined) {
    values.push(changes.title);
    fields.push(`title = $${values.length}`);
  }
  if (changes.type !== undefined) {
    values.push(changes.type);
    fields.push(`type = $${values.length}`);
  }
  if (changes.settings !== undefined) {
    values.push(changes.settings);
    fields.push(`settings = $${values.length}`);
  }
  if (fields.length === 0) return findByIdForTenant(widgetId, tenantId);

  values.push(widgetId, tenantId);
  const result = await pool.query(
    `UPDATE widgets SET ${fields.join(', ')} WHERE id = $${values.length - 1} AND tenant_id = $${values.length}
     RETURNING id, tenant_id, title, type, settings, created_at`,
    values
  );
  return result.rows[0] || null;
}

module.exports = { listByTenant, findByIdForTenant, findPublicById, createForTenant, updateForTenant, deleteForTenant };
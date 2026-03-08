const pool = require('../config/database');

async function listByWidgetForTenant(widgetId, tenantId) {
  const result = await pool.query(
    `SELECT s.id, s.widget_id, s.data, s.ip_address, s.geo_data, s.created_at
     FROM submissions AS s
     INNER JOIN widgets AS w ON w.id = s.widget_id
     WHERE s.widget_id = $1 AND w.tenant_id = $2
     ORDER BY s.created_at DESC`,
    [widgetId, tenantId]
  );
  return result.rows;
}

async function createForWidget(widgetId, { data, ipAddress, geoData = null }) {
  const result = await pool.query(
    `INSERT INTO submissions (widget_id, data, ip_address, geo_data)
     SELECT $1, $2, $3, $4
     WHERE EXISTS (SELECT 1 FROM widgets WHERE id = $1)
     RETURNING id, widget_id, data, ip_address, geo_data, created_at`,
    [widgetId, data, ipAddress, geoData]
  );
  return result.rows[0] || null;
}

async function statsByWidgetForTenant(widgetId, tenantId) {
  const result = await pool.query(
    `SELECT COUNT(s.id)::int AS total,
            COALESCE(json_agg(json_build_object('country', country, 'city', city, 'count', count)
              ORDER BY count DESC) FILTER (WHERE country IS NOT NULL OR city IS NOT NULL), '[]'::json) AS locations
     FROM (
       SELECT s.id,
              NULLIF(s.geo_data->>'country', '') AS country,
              NULLIF(s.geo_data->>'city', '') AS city,
              COUNT(*) OVER (PARTITION BY s.geo_data->>'country', s.geo_data->>'city')::int AS count
       FROM submissions AS s
       INNER JOIN widgets AS w ON w.id = s.widget_id
       WHERE s.widget_id = $1 AND w.tenant_id = $2
     ) AS s`,
    [widgetId, tenantId]
  );
  return result.rows[0];
}

module.exports = { listByWidgetForTenant, statsByWidgetForTenant, createForWidget };
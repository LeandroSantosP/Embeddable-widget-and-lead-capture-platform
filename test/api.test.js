const request = require('supertest');
const app = require('../src/server');
const pool = require('../src/config/database');
const geoService = require('../src/services/geoService');
const notificationService = require('../src/services/notificationService');

const createdTenantIds = [];

async function createTenantAndWidget() {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const tenant = (await pool.query(
    'INSERT INTO tenants (email, password_hash) VALUES ($1, $2) RETURNING id',
    [`test-${suffix}@example.com`, 'test-hash']
  )).rows[0];
  createdTenantIds.push(tenant.id);
  const widget = (await pool.query(
    'INSERT INTO widgets (tenant_id, title, type, settings) VALUES ($1, $2, $3, $4) RETURNING id',
    [tenant.id, 'Test widget', 'signup', {}]
  )).rows[0];
  return { tenant, widget };
}

describe('API acceptance probes', () => {
  afterAll(async () => {
    if (createdTenantIds.length > 0) {
      await pool.query('DELETE FROM tenants WHERE id = ANY($1::uuid[])', [createdTenantIds]);
    }
    await pool.end();
  });

  test('serves OpenAPI documentation', async () => {
    const response = await request(app).get('/api-docs/');
    expect(response.status).toBe(200);
    expect(response.text).toContain('swagger-ui');
  });

  test('registers and logs in a tenant with a JWT', async () => {
    const email = `auth-${Date.now()}@example.com`;
    const register = await request(app).post('/api/auth/register').send({ email, password: 'password-123' });
    createdTenantIds.push(register.body.id);
    expect(register.status).toBe(201);

    const login = await request(app).post('/api/auth/login').send({ email, password: 'password-123' });
    expect(login.status).toBe(200);
    expect(login.body.token).toEqual(expect.any(String));
  });

  test('rejects protected widget routes without a valid token', async () => {
    expect((await request(app).get('/api/widgets')).status).toBe(401);
    expect((await request(app).get('/api/widgets').set('Authorization', 'Bearer invalid')).status).toBe(401);
  });

  test('isolates widget access between tenants', async () => {
    const owner = await createTenantAndWidget();
    const other = await createTenantAndWidget();
    const ownerToken = require('jsonwebtoken').sign({ id: owner.tenant.id }, require('../src/config/env').JWT_SECRET);
    const otherToken = require('jsonwebtoken').sign({ id: other.tenant.id }, require('../src/config/env').JWT_SECRET);

    expect((await request(app).get(`/api/widgets/${owner.widget.id}`).set('Authorization', `Bearer ${otherToken}`)).status).toBe(404);
    expect((await request(app).put(`/api/widgets/${owner.widget.id}`).set('Authorization', `Bearer ${otherToken}`).send({ title: 'Hijacked' })).status).toBe(404);
    expect((await request(app).delete(`/api/widgets/${owner.widget.id}`).set('Authorization', `Bearer ${otherToken}`)).status).toBe(404);
    expect((await request(app).get(`/api/widgets/${owner.widget.id}`).set('Authorization', `Bearer ${ownerToken}`)).status).toBe(200);
  });

  test('handles CORS preflight and invalid or oversized payloads with 4xx', async () => {
    const preflight = await request(app).options('/api/submissions').set('Origin', 'http://localhost:8080').set('Access-Control-Request-Method', 'POST');
    expect(preflight.status).toBe(204);
    expect(preflight.headers['access-control-allow-origin']).toBe('*');

    const invalid = await request(app).post('/api/submissions').send({ widget_id: 'invalid', data: {} });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error).toBe('Validation failed');

    const oversized = await request(app).post('/api/submissions').send({ widget_id: 'invalid', data: { content: 'x'.repeat(20000) } });
    expect(oversized.status).toBe(413);
  });

  test('rejects honeypot submissions without inserting a lead', async () => {
    const { widget } = await createTenantAndWidget();
    const before = await pool.query('SELECT COUNT(*)::int AS count FROM submissions WHERE widget_id = $1', [widget.id]);
    const response = await request(app).post('/api/submissions').send({ widget_id: widget.id, data: { email: 'bot@example.com', address_line_2: 'filled' } });
    const after = await pool.query('SELECT COUNT(*)::int AS count FROM submissions WHERE widget_id = $1', [widget.id]);
    expect(response.status).toBe(400);
    expect(after.rows[0].count).toBe(before.rows[0].count);
  });

  test('saves leads when geo providers fail and notifications throw', async () => {
    const { widget } = await createTenantAndWidget();
    jest.spyOn(geoService, 'enrich').mockResolvedValue(null);
    jest.spyOn(notificationService, 'notify').mockRejectedValue(new Error('simulated failure'));

    const response = await request(app).post('/api/submissions').send({ widget_id: widget.id, data: { email: 'lead@example.com' } });
    const saved = await pool.query('SELECT geo_data FROM submissions WHERE widget_id = $1', [widget.id]);
    expect(response.status).toBe(201);
    expect(saved.rowCount).toBe(1);
    expect(saved.rows[0].geo_data).toBeNull();
  });

  test('returns 429 after five submissions for the same IP and widget', async () => {
    const { widget } = await createTenantAndWidget();
    jest.spyOn(geoService, 'enrich').mockResolvedValue(null);
    jest.spyOn(notificationService, 'notify').mockResolvedValue(undefined);
    const responses = [];
    for (let index = 0; index < 6; index += 1) {
      responses.push(await request(app).post('/api/submissions').send({ widget_id: widget.id, data: { email: `lead-${index}@example.com` } }));
    }
    expect(responses.slice(0, 5).every((response) => response.status === 201)).toBe(true);
    expect(responses[5].status).toBe(429);
  });

  test('provides authenticated submissions and stats only to the widget owner', async () => {
    const owner = await createTenantAndWidget();
    const other = await createTenantAndWidget();
    const jwt = require('jsonwebtoken');
    const env = require('../src/config/env');
    const ownerToken = jwt.sign({ id: owner.tenant.id }, env.JWT_SECRET);
    const otherToken = jwt.sign({ id: other.tenant.id }, env.JWT_SECRET);
    await pool.query(
      'INSERT INTO submissions (widget_id, data, ip_address, geo_data) VALUES ($1, $2, $3, $4)',
      [owner.widget.id, { email: 'dashboard@example.com' }, '203.0.113.10', { country: 'Brazil', city: 'Sao Paulo' }]
    );

    const submissions = await request(app).get(`/api/widgets/${owner.widget.id}/submissions`).set('Authorization', `Bearer ${ownerToken}`);
    const stats = await request(app).get(`/api/widgets/${owner.widget.id}/stats`).set('Authorization', `Bearer ${ownerToken}`);
    const foreign = await request(app).get(`/api/widgets/${owner.widget.id}/submissions`).set('Authorization', `Bearer ${otherToken}`);

    expect(submissions.status).toBe(200);
    expect(submissions.body).toHaveLength(1);
    expect(stats.body).toEqual({ total_submissions: 1, locations: [{ country: 'Brazil', city: 'Sao Paulo', count: 1 }] });
    expect(foreign.status).toBe(200);
    expect(foreign.body).toEqual([]);
  });
});
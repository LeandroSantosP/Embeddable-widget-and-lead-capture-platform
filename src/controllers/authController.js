const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const env = require('../config/env');
const tenantRepository = require('../repositories/tenantRepository');

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

function validationError(response, error) {
  return response.status(400).json({ error: 'Validation failed', details: error.issues });
}

async function register(request, response) {
  const parsed = credentialsSchema.safeParse(request.body);
  if (!parsed.success) return validationError(response, parsed.error);

  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const tenant = await tenantRepository.create({ email: parsed.data.email, passwordHash });
    return response.status(201).json({ id: tenant.id, email: tenant.email, created_at: tenant.created_at });
  } catch (error) {
    if (error.code === '23505') return response.status(409).json({ error: 'Email already registered' });
    throw error;
  }
}

async function login(request, response) {
  const parsed = credentialsSchema.safeParse(request.body);
  if (!parsed.success) return validationError(response, parsed.error);

  const tenant = await tenantRepository.findByEmail(parsed.data.email);
  const validPassword = tenant && await bcrypt.compare(parsed.data.password, tenant.password_hash);
  if (!tenant || !validPassword) return response.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: tenant.id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
  return response.status(200).json({ token, expires_in: env.JWT_EXPIRES_IN });
}

module.exports = { register, login };
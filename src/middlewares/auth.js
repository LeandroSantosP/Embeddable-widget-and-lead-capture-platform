const jwt = require('jsonwebtoken');
const env = require('../config/env');

function authenticate(request, response, next) {
  const authorization = request.get('authorization');
  const [scheme, token] = authorization ? authorization.split(' ') : [];

  if (scheme !== 'Bearer' || !token) {
    return response.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (!payload || typeof payload.id !== 'string') {
      throw new Error('Invalid token payload');
    }
    request.tenantId = payload.id;
    return next();
  } catch (_error) {
    return response.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authenticate;
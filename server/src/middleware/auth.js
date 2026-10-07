import jwt from 'jsonwebtoken';

// Management tier: full read access across all regions, approval actions.
// Staff tier: scoped read/write to their own module + assigned region/projects.
export const MANAGEMENT_ROLES = new Set(['director', 'regional_head']);

export function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Missing authentication token' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, role, region, email }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Restrict a route to a specific set of roles.
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions for this action' });
    }
    next();
  };
}

export function isManagement(user) {
  return MANAGEMENT_ROLES.has(user.role);
}

// Scope a query to the requester's region unless they are management (whole company).
export function regionFilter(user) {
  return isManagement(user) ? null : user.region;
}

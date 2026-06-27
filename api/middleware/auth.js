// middleware/auth.js – JWT authentication middleware

const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token)
    return res.status(401).json({ success: false, message: 'Token required' });

  jwt.verify(token, process.env.JWT_SECRET || 'carbochem_secret', (err, user) => {
    if (err)
      return res.status(403).json({ success: false, message: 'Invalid token' });
    req.user = user;
    next();
  });
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return res.status(403).json({ success: false, message: `Requires role: ${roles.join(' or ')}` });
    next();
  };
}

module.exports = { authenticateToken, requireRole };

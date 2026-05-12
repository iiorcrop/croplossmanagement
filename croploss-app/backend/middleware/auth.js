const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ── Verify JWT and attach user to request ─────────────────────────────────
const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated. Please login.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) return res.status(401).json({ success: false, message: 'User no longer exists.' });
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account is inactive. Contact admin.' });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

// ── Restrict to specific roles ────────────────────────────────────────────
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Role '${req.user.role}' is not authorized for this action.`,
    });
  }
  next();
};

// ── Check crop access (from route param or body) ───────────────────────────
const cropAccess = (req, res, next) => {
  if (req.user.role === 'super_admin') return next();

  const crop = req.params.crop || req.body.crop || req.query.crop;
  if (!crop) return next(); // no crop specified, let route handle it

  const allowed = [...(req.user.assignedCrops || []), ...(req.user.reviewCrops || [])];
  if (!allowed.includes(crop)) {
    return res.status(403).json({
      success: false,
      message: `You do not have access to crop: ${crop}`,
    });
  }
  next();
};

// ── Error handler middleware ───────────────────────────────────────────────
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, message: messages.join('. ') });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ success: false, message: `${field} already exists.` });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid ID format.' });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server error. Please try again.',
  });
};

module.exports = { protect, authorize, cropAccess, errorHandler };

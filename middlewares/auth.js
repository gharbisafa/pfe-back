const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next(); // User is an admin, proceed to the next middleware or route handler
  }
  res.status(403).json({ error: 'FORBIDDEN: Admin access required' }); // User is not an admin
};

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next(); // User is authenticated, proceed
  }
  res.status(401).json({ error: 'UNAUTHORIZED: Authentication required' }); // User is not authenticated
};

module.exports = {
  isAdmin,
  isAuthenticated,
};
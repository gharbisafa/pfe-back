const authorize = (...permissions) => {
  return async (req, res, next) => {
    next();
  };
};

module.exports = { authorize };

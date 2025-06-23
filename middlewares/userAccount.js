const { hashPassword } = require("../utils/password");

const setData = async (req, res, next) => {
  try {
    let passwordHash;
    if (req.body.password) {
      passwordHash = await hashPassword(req.body.password);
    }
    req.data = {
      ...req.body,
      ...(passwordHash ? { password: passwordHash } : {}),
      ...(req.image ? { image: req.image } : {}),
    };
    next();
  } catch (error) {
    console.error("Error in setData middleware:", error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
};

module.exports = { setData };
const { hashPassword } = require("../utils/password");

const setData = async (req, res, next) => {
  let passwordHash;
  try {
    if (req.body.password) {
      passwordHash = await hashPassword(req.body.password);
    }
    try {
    } catch (error) {
    } finally {
      req.data = {
        ...req.body,
        ...(passwordHash ? { password: passwordHash } : {}),
        ...(req.image ? { image: req.image } : {}),
      };
      next();
    }
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};

module.exports = { setData };

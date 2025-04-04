const { issueJWT } = require("../utils/token");
const userAccountService = require("../services/userAccountService");
const checkToken = (req, res) => {
  let token = issueJWT("user", req.user._id);
  res.status(200).json({
    token,
    ...req.user.userInfo,
    _id: req.user._id,
    balance: req.user.balance,
    role: req.user.role,
  });
};

const login = (req, res) => {
  let token = issueJWT("user", req.user._id);
  res.status(200).json({
    token,
    ...req.user.userInfo,
    _id: req.user._id,
    role: req.user.role,
  });
};

module.exports = {
  checkToken,
  login,
};

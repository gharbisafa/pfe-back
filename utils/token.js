const jsonwebtoken = require("jsonwebtoken");
const { getPrivKey } = require("../utils/keys");
const PRIV_KEY = getPrivKey();

const issueJWT = (
  type,
  sub,
  expiresIn = 31 * 24 * 3600,
  algorithm = "RS256"
) => {
  const payload = {
    exp: Math.floor(Date.now() / 1000) + expiresIn,
    sub: sub,
    iam: Math.floor(Date.now() / 1000),
    type,
  };

  const signedToken = jsonwebtoken.sign(payload, PRIV_KEY, {
    algorithm,
  });

  return "Bearer " + signedToken;
};

module.exports = { issueJWT };

const userAccountService = require("../services/userAccountService");
const { checkPassword } = require("../utils/password");

const jwtUserHandler = async (jwt_payload, done) => {
  try {
    let user = await userAccountService.getById(jwt_payload.sub);
    if (!user) {
      return done(null, false);
    }
    return done(null, { ...user });
  } catch (error) {
    return done(error, false);
  }
};

const localUserHandler = async (email, password, done) => {
  try {
    let user = await userAccountService.getByEmail(email);
    if (!user) {
      return done(null, false);
    }
    if (!(await checkPassword(password, user.password))) {
      return done(null, false);
    }

    return done(null, { ...user });
  } catch (error) {
    return done(error, false);
  }
};

module.exports = {
  jwtUserHandler,
  localUserHandler,
};

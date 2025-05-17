const JwtStrategy = require("passport-jwt").Strategy;
const LocalStrategy = require("passport-local").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const passport = require("passport");
const { getPubKey } = require("../utils/keys");
const { jwtUserHandler, localUserHandler } = require("./passportHandlers");

const PUB_KEY = getPubKey();

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: PUB_KEY,
  algorithms: ["RS256"],
  ignoreExpiration: false,
  jsonWebTokenOptions: {
    maxAge: "1d",
  },
};

passport.use(
  new JwtStrategy(jwtOptions, async (jwt_payload, done) => {
    return jwtUserHandler(jwt_payload, done);
  })
);

const localOptions = {
  usernameField: "email",
  passwordField: "password",
};

passport.use(
  new LocalStrategy(localOptions, (email, password, done) => {
    return localUserHandler(email, password, done);
  })
);


module.exports = passport;

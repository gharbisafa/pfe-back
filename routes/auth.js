const express = require("express");
const router = express.Router();
const passport = require("passport");
const authController = require("../controllers/auth");

router.get(
  "/check-token",
  passport.authenticate("jwt", { session: false }),
  authController.checkToken
);

router.post(
  "/login",
  passport.authenticate("local", { session: false }),
  authController.login
);

module.exports = router;

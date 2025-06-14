const express = require("express");
const router = express.Router();
const passport = require("passport");
const authController = require("../controllers/auth");

// ✅ Secure token check (unchanged)
router.get(
  "/check-token",
  passport.authenticate("jwt", { session: false }),
  authController.checkToken
);

// ✅ Custom login handler with manual error response
router.post("/login", (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    req.user = user;
    return authController.login(req, res);
  })(req, res, next);
});

module.exports = router;

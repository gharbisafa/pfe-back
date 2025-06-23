const express = require("express");
const router = express.Router();
const passport = require("passport");
const { create , getAll, getById} = require("../controllers/reportController");

router.post("/", passport.authenticate("jwt", { session: false }), create);
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  getAll
);
router.get(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  getById
);

module.exports = router;

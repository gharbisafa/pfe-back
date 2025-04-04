const express = require("express");
const router = express.Router();
const middlewares = require("../middlewares/userAccount");
const userAccountController = require("../controllers/userAccount");
const passport = require("passport");

router.post("/", middlewares.setData, userAccountController.post);

router.put(
  "/",
  passport.authenticate("jwt", { session: false }),
  middlewares.setData,
  userAccountController.putSelf
);

router.delete(
  "/",
  passport.authenticate("jwt", { session: false }),
  userAccountController.deleteSelf
);

module.exports = router;

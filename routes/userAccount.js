const express = require("express");
const router = express.Router();
const middlewares = require("../middlewares/userAccount");
const userAccountController = require("../controllers/userAccount");
const passport = require("passport");

const { uploadProfileImage } = require("../middlewares/upload");

router.put(
  "/profile-image",
  passport.authenticate("jwt", { session: false }),
  uploadProfileImage,
  userAccountController.uploadProfileImage
);

router.post("/", middlewares.setData, userAccountController.post);

router.put(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  middlewares.setData,
  userAccountController.putSelf
);

router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  userAccountController.deleteSelf
);




module.exports = router;

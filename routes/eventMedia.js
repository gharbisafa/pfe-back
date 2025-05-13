const express = require("express");
const router = express.Router();
const passport = require("passport");
const {
  getByEventId,
  addMedia,
  deleteById,
  archiveById,
  toggleLike,
} = require("../controllers/eventMedia");
const { uploadEventMedia } = require("../middlewares/upload");
const { setData, validateMediaData } = require("../middlewares/eventMedia");

router.get("/:eventId", passport.authenticate("jwt", { session: false }), getByEventId);
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  uploadEventMedia,
  validateMediaData,
  setData,
  addMedia   
);
router.delete("/:id", passport.authenticate("jwt", { session: false }), deleteById);
router.put("/:id/archive", passport.authenticate("jwt", { session: false }), archiveById);
router.put("/:id/like", passport.authenticate("jwt", { session: false }), toggleLike);

module.exports = router;

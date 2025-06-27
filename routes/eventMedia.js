const express = require("express");
const router = express.Router();
const passport = require("passport");

const {
  getByEventId,
  addMedia,
  deleteById,
  archiveById,
  toggleLike,
  addEventPhotos,
} = require("../controllers/eventMedia");
const { uploadEventMedia } = require("../middlewares/upload");
const { setData, validateMediaData } = require("../middlewares/eventMedia");

router.get("/:eventId", passport.authenticate("jwt", { session: false }), getByEventId);
router.post("/media", passport.authenticate("jwt", { session: false }), uploadEventMedia, validateMediaData, setData, addMedia);
router.post("/photos", passport.authenticate("jwt", { session: false }), uploadEventMedia, addEventPhotos);
router.delete("/:id", passport.authenticate("jwt", { session: false }), deleteById);
router.put("/:id/like", passport.authenticate("jwt", { session: false }), toggleLike); // Ensure this line exists
router.put("/:id/archive", passport.authenticate("jwt", { session: false }), archiveById);

module.exports = router;
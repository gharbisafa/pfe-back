const express = require("express");
const router = express.Router();
const passport = require("passport");
const commentController = require("../controllers/comments");

// Add a comment to an event
router.post(
  "/:eventId",
  passport.authenticate("jwt", { session: false }),
  commentController.addComment
);

// Get all comments for an event
router.get(
  "/:eventId",
  passport.authenticate("jwt", { session: false }),
  commentController.getCommentsByEvent
);

// Update a comment
router.put(
  "/:commentId",
  passport.authenticate("jwt", { session: false }),
  commentController.updateComment
);

// Delete a comment
router.delete(
  "/:commentId",
  passport.authenticate("jwt", { session: false }),
  commentController.deleteComment
);

// Like/Unlike a comment
router.post(
  "/:commentId/like",
  passport.authenticate("jwt", { session: false }),
  commentController.toggleCommentLike
);

// Reply to a comment
router.post(
  "/:commentId/reply",
  passport.authenticate("jwt", { session: false }),
  commentController.replyToComment
);
module.exports = router;
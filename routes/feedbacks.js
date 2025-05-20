const express = require("express");
const router = express.Router();
const passport = require("passport");
const feedbackController = require("../controllers/feedbacks");

// Add feedback for an event
router.post(
  "/:eventId",
  passport.authenticate("jwt", { session: false }),
  feedbackController.addFeedback
);

// Get all feedback for an event
router.get(
  "/:eventId",
  passport.authenticate("jwt", { session: false }),
  feedbackController.getFeedbackByEvent
);

// Update feedback
router.put(
  "/:feedbackId",
  passport.authenticate("jwt", { session: false }),
  feedbackController.updateFeedback
);

// Delete feedback
router.delete(
  "/:feedbackId",
  passport.authenticate("jwt", { session: false }),
  feedbackController.deleteFeedback
);

// Like/Unlike feedback
router.post(
  "/:feedbackId/like",
  passport.authenticate("jwt", { session: false }),
  feedbackController.toggleFeedbackLike
);

module.exports = router;
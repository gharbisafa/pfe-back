const express = require("express");
const router = express.Router();
const passport = require("passport");
const eventController = require("../controllers/event");
const eventMiddleware = require("../middlewares/event");


// CREATE: Add a new event
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  eventMiddleware.setData,
  eventMiddleware.validateEventData,
  eventController.add
);

// UPDATE: Update event by ID
router.put(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  eventMiddleware.validateEventData,
  eventMiddleware.isEventOwner,
  eventController.updateById
);

// DELETE: Soft-delete event
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  eventMiddleware.isEventOwner,
  eventController.deleteById
);
// GET: Get all events created by the authenticated user
router.get(
  '/user/me',
  passport.authenticate('jwt', { session: false }),
  eventController.getMyEvents
);


// GET ALL: Get all events with filters, pagination, sorting
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  eventController.get
);

// GET BY ID: Get single event
router.get(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  eventController.getById
);

// GET DELETED EVENTS (optional route, useful for admin panels)
router.get(
  "/deleted/list",
  passport.authenticate("jwt", { session: false }),
  eventController.getDeleted
);
// RSVP
router.post(
  "/:eventId/rsvp",
  passport.authenticate("jwt", { session: false }),
  eventController.addRSVP
);

// Comments
router.post(
  "/:eventId/comment",
  passport.authenticate("jwt", { session: false }),
  eventController.addComment
);

// Feedback
router.post(
  "/:eventId/feedback",
  passport.authenticate("jwt", { session: false }),
  eventController.addFeedback
);
// Toggle likes, going, interested
router.post(
  "/:eventId/toggle",
  passport.authenticate("jwt", { session: false }),
  eventMiddleware.setUserId,
  eventController.toggleField
);

module.exports = router;

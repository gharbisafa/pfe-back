const express = require("express");
const router = express.Router();
const passport = require("passport");
const eventController = require("../controllers/event");
const eventMiddleware = require("../middlewares/event");

const { uploadEventPhotos } = require("../middlewares/upload");

// RSVP Routes
router.post(
  "/:eventId/rsvp",
  passport.authenticate("jwt", { session: false }),
  eventController.updateRSVP // New endpoint to handle RSVP updates
);

router.get(
  "/:eventId/rsvp",
  passport.authenticate("jwt", { session: false }),
  eventController.getEventRSVPs // New endpoint to fetch RSVPs for an event
);

router.get("/liked", passport.authenticate("jwt", { session: false }), eventController.getLikedEvents);
router.get("/media", passport.authenticate("jwt", { session: false }), eventController.getUserEventMedia);
router.get("/interested", passport.authenticate("jwt", { session: false }), eventController.getInterestedEvents);
router.get("/going", passport.authenticate("jwt", { session: false }), eventController.getGoingEvents);

// CREATE: Add a new event
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  uploadEventPhotos,
  eventMiddleware.setData,
  eventMiddleware.validateEventData,
  eventController.add
);

// UPDATE: Update event by ID
router.put(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  uploadEventPhotos,
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

// Likes
router.post(
  "/:eventId/like",
  passport.authenticate("jwt", { session: false }),
  eventController.toggleLike
);
// Archive/Unarchive Event
router.put(
  "/:eventId/archive",
  passport.authenticate("jwt", { session: false }),
  eventMiddleware.isEventOwner, // Ensure only the event creator can toggle archive
  eventController.toggleArchive
);
router.get(
  '/user/:id/public-events'
  , eventController.getPublicEventsByUser);
// Public liked events by user ID
router.get(
  "/user/:id/liked",
  passport.authenticate("jwt", { session: false }),
  eventController.getUserLikedEventsById
);

// Public attending events by user ID
router.get(
  "/user/:id/attending",
  passport.authenticate("jwt", { session: false }),
  eventController.getUserGoingEventsById
);



module.exports = router;

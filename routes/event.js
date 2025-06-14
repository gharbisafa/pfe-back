const express = require("express");
const router = express.Router();
const passport = require("passport");
const eventController = require("../controllers/event");
const eventMiddleware = require("../middlewares/event");

const { uploadEventPhotos } = require("../middlewares/upload");
const { sendInviteEmail } = require("../utils/emailUtils");
const Event = require("../models/event");
const UserAccount = require("../models/userAccount");
// RSVP Routes
router.post(
  "/:eventId/rsvp",
  passport.authenticate("jwt", { session: false }),
  eventController.updateRSVP
);
router.get(
  "/:eventId/rsvp",
  passport.authenticate("jwt", { session: false }),
  eventController.getEventRSVPs
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
router.post(
  "/upload-front-photos",
  passport.authenticate("jwt", { session: false }),
  uploadEventPhotos,
  eventController.uploadEventPhotos
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
router.post(
  "/:id/invite",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const { id }    = req.params;
      const { email } = req.body;

      // --- 1) Load & validate
      const ev = await Event.findById(id);
      if (!ev) return res.status(404).json({ message: "Event not found" });

      const invitedUser = await UserAccount.findOne({ email });
      if (!invitedUser) return res.status(404).json({ message: "User not found" });

      // --- 2) Send the branded invite
      const inviteeName = invitedUser.userInfo?.name || invitedUser.email;
      await sendInviteEmail(invitedUser.email, ev, inviteeName);

      // --- 3) Prevent duplicates
      if (ev.guests.some(g => g.user.equals(invitedUser._id))) {
        return res.status(400).json({ message: "Already invited" });
      }

      // --- 4) Mark as pending guest & save
      ev.guests.push({ user: invitedUser._id, rsvp: "pending" });
      await ev.save();

      // --- 5) Populate and send back the updated list
      await ev.populate("guests.user", "userInfo email");
      return res.json({
        guests: ev.guests,
        message: "Invitation sent",
      });
    } catch (err) {
      console.error("💥 Invite handler error:", err);
      return res.status(500).json({ message: "Failed to send invite" });
    }
  }
);


// GET BY ID: Get single event
router.get("/:id", eventController.getById);

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

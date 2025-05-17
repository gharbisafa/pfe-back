const express = require("express");
const router = express.Router();
const passport = require("passport");
const reservationController = require("../controllers/reservation");

// Routes for reservations
router.post(
  "/:eventId",
  passport.authenticate("jwt", { session: false }),
  reservationController.makeReservation
);

router.put(
  "/:reservationId",
  passport.authenticate("jwt", { session: false }),
  reservationController.updateReservation
);

router.delete(
  "/:reservationId",
  passport.authenticate("jwt", { session: false }),
  reservationController.cancelReservation
);

router.put(
  "/:reservationId/respond",
  passport.authenticate("jwt", { session: false }),
  reservationController.respondToReservation
);

// Get all reservations for an event
router.get(
  "/:eventId",
  passport.authenticate("jwt", { session: false }),
  reservationController.getReservations
);

// Cancel a reservation made by the authenticated user
router.delete(
  "/user/cancel/:reservationId",
  passport.authenticate("jwt", { session: false }),
  reservationController.cancelUserReservation
);

// Get reservations made by the authenticated user
router.get(
  "/user/mine",
  passport.authenticate("jwt", { session: false }),
  reservationController.getUserReservations
);

module.exports = router;
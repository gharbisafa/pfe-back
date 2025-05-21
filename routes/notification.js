const express = require("express");
const router = express.Router();
const passport = require("passport");
const notificationController = require("../controllers/notification");

// Get all notifications for the current user
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  notificationController.getNotifications
);

// Mark a notification as read
router.put(
  "/:notificationId/read",
  passport.authenticate("jwt", { session: false }),
  notificationController.markAsRead
);

// Delete a notification
router.delete(
  "/:notificationId",
  passport.authenticate("jwt", { session: false }),
  notificationController.deleteNotification
);

module.exports = router;
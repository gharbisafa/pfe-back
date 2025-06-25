// routes/admin.js
const express = require("express");
const router  = express.Router();
const passport = require("passport");
const { isAuthenticated, isAdmin } = require("../middlewares/auth");
const adminController = require("../controllers/admin");

// apply JWT + admin guard to everything under /api/admin
router.use(
  passport.authenticate("jwt", { session: false }),
  isAuthenticated,
  isAdmin
);

// users
router.get   ("/admin",          adminController.welcomeAdmin);
router.get   ("/users",          adminController.fetchUsers);
router.put   ("/users/:id",      adminController.updateUserRole);
router.delete("/users/:id",      adminController.softDeleteUser);
// fetch this user's created events:

// users list
router.get("/users", adminController.fetchUsers);

// single‐user events must come *before* the single‐user route:
router.get(
  "/users/:id/events",
  adminController.fetchEventsByUser
);

// single user
router.get("/users/:id", adminController.fetchUserById);

// update / soft‐delete...
router.put("/users/:id", adminController.updateUserRole);
router.delete("/users/:id", adminController.softDeleteUser);

// ban user route
router.put("/users/:id/ban", adminController.banUser);

// events
router.get   ("/events/deleted", adminController.getDeletedEvents);
router.put   ("/events/restore/:id", adminController.restoreEvent);
router.delete("/events/:id", adminController.hardDeleteEvent);

// media
router.get   ("/media/deleted", adminController.getDeletedMedia);
router.put   ("/media/restore/:id", adminController.restoreMedia);
router.delete("/media/:id", adminController.hardDeleteMedia);

// analytics
router.get("/analytics", adminController.getPlatformAnalytics);
// fetch all events created by a given user
router.get("/events", adminController.fetchAllEvents);

// Existing event routes
router.get   ("/events/deleted",     adminController.getDeletedEvents);
router.put   ("/events/restore/:id", adminController.restoreEvent);
router.put   ("/events/:id/ban",     adminController.banEvent);
router.delete("/events/:id",         adminController.hardDeleteEvent);

module.exports = router;

// routes/admin.js

const express = require("express");
const router  = express.Router();
const passport = require("passport");
const { isAuthenticated, isAdmin } = require("../middlewares/auth");
const adminController = require("../controllers/admin");

// Middleware to ensure admin access
router.use(
  passport.authenticate("jwt", { session: false }),
  isAuthenticated,
  isAdmin
);

// Simple ping for admins
router.get("/admin", adminController.welcomeAdmin);

// Admin routes for managing users
router.get   ("/users",        adminController.fetchUsers);       // Fetch all users
router.put   ("/users/:id",    adminController.updateUserRole);   // Update user roles
router.delete("/users/:id",    adminController.softDeleteUser);    // Soft-delete a user

// Admin routes for managing events
router.get   ("/events/deleted",        adminController.getDeletedEvents);    // Fetch deleted events
router.put   ("/events/restore/:id",    adminController.restoreEvent);         // Restore event
router.delete("/events/:id",            adminController.hardDeleteEvent);      // Hard delete event

// Admin routes for managing media
router.get   ("/media/deleted",         adminController.getDeletedMedia);     // Fetch deleted media
router.put   ("/media/restore/:id",     adminController.restoreMedia);         // Restore deleted media
router.delete("/media/:id",             adminController.hardDeleteMedia);      // Hard delete media

// Admin route for platform analytics
router.get("/analytics", adminController.getPlatformAnalytics);        // Platform analytics

module.exports = router;

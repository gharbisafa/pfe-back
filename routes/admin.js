const express = require("express");
const router = express.Router();
const passport = require("passport");
const { isAdmin, isAuthenticated } = require("../middlewares/auth"); // Import middleware
const adminController = require("../controllers/admin");

// Middleware to ensure admin access
router.use(passport.authenticate("jwt", { session: false }), isAdmin);

router.get('/admin', isAuthenticated, isAdmin, (req, res) => {
  res.json({ message: 'Welcome Admin!' });
});

// Admin routes for managing events
router.get("/events/deleted", adminController.getDeletedEvents); // Fetch deleted events
router.put("/events/restore/:id", adminController.restoreEvent); // Restore deleted event
router.delete("/events/:id", adminController.hardDeleteEvent); // Hard delete event

// Admin routes for managing media
router.get("/media/deleted", adminController.getDeletedMedia); // Fetch deleted media
router.put("/media/restore/:id", adminController.restoreMedia); // Restore deleted media
router.delete("/media/:id", adminController.hardDeleteMedia); // Hard delete media

// Admin route for platform analytics
router.get("/analytics", adminController.getPlatformAnalytics); // Platform analytics

module.exports = router;
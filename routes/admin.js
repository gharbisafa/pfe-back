const express = require("express");
const router = express.Router();
const passport = require("passport");
const { isAdmin, isAuthenticated } = require("../middlewares/auth"); // Import middleware
const adminController = require("../controllers/admin");

// Middleware to ensure admin access
router.use(passport.authenticate("jwt", { session: false }), isAdmin);

router.get('/admin', isAuthenticated, isAdmin, adminController.welcomeAdmin);

// Admin routes for managing users
router.get("/users", adminController.fetchUsers); // Fetch all users
router.put("/users/:id", adminController.updateUserRole); // Update user roles
router.delete("/users/:id", adminController.softDeleteUser); // Soft-delete a user

// Admin routes for managing events
// router.put("/event/:id/ban", adminController.banEvent); // Ban an event
// const validateObjectId = (req, res, next) => {
//   const { id } = req.params;
//   if (!ObjectId.isValid(id)) {
//     return res.status(400).json({ error: "Invalid Object ID" });
//   }
//   next();
// };

// // Use it in routes
// router.put("/events/:id/ban", validateObjectId, adminController.banEvent);

// Admin routes for managing media
router.get("/media/deleted", adminController.getDeletedMedia); // Fetch deleted media
router.put("/media/restore/:id", adminController.restoreMedia); // Restore deleted media
router.delete("/media/:id", adminController.hardDeleteMedia); // Hard delete media

// Admin route for platform analytics
router.get("/analytics", adminController.getPlatformAnalytics); // Platform analytics

module.exports = router;
const express = require("express");
const router = express.Router();
const middlewares = require("../middlewares/userAccount");
const userAccountController = require("../controllers/userAccount");
const dashboardController = require("../controllers/dashboard");
const passport = require("passport");
const { uploadProfileImage } = require("../middlewares/upload");

router.post(
  "/save-player-id",
  passport.authenticate("jwt", { session: false }),
  userAccountController.savePlayerId
);


// ✅ User activity dashboard route
router.get(
  "/dashboard",
  passport.authenticate("jwt", { session: false }),
  dashboardController.getUserDashboard
);

// Upload profile image
router.put(
  "/profile-image",
  passport.authenticate("jwt", { session: false }),
  uploadProfileImage,
  userAccountController.uploadProfileImage
);

// Create user
router.post("/", middlewares.setData, userAccountController.post);

// Update own user
router.put(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  middlewares.setData,
  userAccountController.putSelf
);

// Delete own user
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  userAccountController.deleteSelf
);

// Toggle follow/unfollow another user
router.post(
  "/follow/:id",
  passport.authenticate("jwt", { session: false }),
  userAccountController.toggleFollow
);

// ✅ Get followers & following list
router.get(
  "/:id/follow-stats",
  passport.authenticate("jwt", { session: false }),
  userAccountController.getFollowStats
);

// ✅ Get full followers list
router.get(
  "/:id/followers",
  passport.authenticate("jwt", { session: false }),
  userAccountController.getFollowers
);

// ✅ Get full following list
router.get(
  "/:id/following",
  passport.authenticate("jwt", { session: false }),
  userAccountController.getFollowing
);

// ✅ Get user by ID
router.get(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  userAccountController.getUserById
);


// Add these to your auth routes
router.post('/verify-email', userAccountController.verifyEmail);
router.post('/resend-verification', userAccountController.resendVerificationCode);
router.post('/forgot-password', userAccountController.forgotPassword);
router.post('/reset-password', userAccountController.resetPassword);
router.post('/verify-reset-code', userAccountController.verifyResetCode);
module.exports = router;
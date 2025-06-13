const userAccountService = require("../services/userAccountService");
const DataValidationError = require("../errors/dataValidationError");
const RecordNotFoundError = require("../errors/recordNotFoundError");
const UserAccount = require("../models/userAccount");
const Users = require("../models/user"); 

const savePlayerId = async (req, res) => {
  try {
    const userId = req.user._id;
    const { playerId } = req.body;

    if (!playerId) {
      return res.status(400).json({ error: "PLAYER_ID_REQUIRED" });
    }

    const updatedUser = await userAccountService.savePlayerId(userId, playerId);
    return res.status(200).json({
      message: "Player ID saved",
      oneSignalPlayerId: updatedUser.oneSignalPlayerId,
    });
  } catch (error) {
    console.error("Failed to save OneSignal playerId:", error);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
};

const get = async (req, res) => {
  try {
    const { search } = req.query;
    const query = { deleted: false };

    if (search) {
      query["userInfo.name"] = { $regex: search, $options: "i" };
    }

    const users = await UserAccount.find(query).populate("userInfo", "name profileImage").select("-password");
    res.status(200).json(users);
  } catch (error) {
    console.error("User search error:", error);
    res.sendStatus(500);
  }
};

const getAllUsers = async (req, res) => {
  try {
    const search = req.query.search || '';
    const filter = {
      deleted: false,
      ...(search && {
        $or: [
          { email: { $regex: search, $options: 'i' } },
          { 'userInfo.name': { $regex: search, $options: 'i' } },
        ]
      })
    };

    const users = await UserAccount.find(filter)
      .populate('userInfo', 'name profileImage')
      .select('email userInfo');

    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "FETCH_FAILED" });
  }
};




const getDeleted = async (req, res) => {
  try {
    let result = await userAccountService.getDeleted({}, { password: 0, deleted: 0 });
    res.status(200).json(result);
  } catch (error) {
    res.sendStatus(500);
  }
};

const getById = async (req, res) => {
  try {
    let result = await userAccountService.getById(req.params.id);
    if (!result || result.deleted) {
      res.sendStatus(404);
      return;
    }
    res.status(200).json(result);
  } catch (error) {
    res.sendStatus(500);
  }
};

const post = async (req, res) => {
  try {
    let result = await userAccountService.add(req.data);
    if (!result) {
      res.status(400).json({ error: "DATA_MISSING" });
      return;
    }

    try {
      await userAccountService.generateAndSendVerificationCode(result.email);
      res.status(201).json({
        ...result.toObject(),
        emailSent: true,
        message: "Account created. Please check your email for verification code."
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      res.status(201).json({
        ...result.toObject(),
        emailSent: false,
        message: "Account created but verification email failed to send"
      });
    }
  } catch (error) {
    console.error(error);
    if (error instanceof DataValidationError) {
      res.status(400).json({
        error: "DATA_VALIDATION",
        model: error.model.modelName,
        fields: error.issues.map((issue) => ({
          kind: issue.kind,
          path: issue.path,
          value: issue.value,
          message: issue.message,
        })),
      });
    } else {
      res.sendStatus(500);
    }
  }
};
const isFollowedByMe = async (req, res) => {
  try {
    // 1. Get current UserAccount and profile
    const currentUserAccount = await UserAccount.findById(req.user._id);
    if (!currentUserAccount) {
      console.log('currentUserAccount not found:', req.user._id);
      return res.status(401).json({ isFollowing: false });
    }
    const currentProfileId = currentUserAccount.userInfo?.toString();

    // 2. Get target UserAccount
    const targetUserAccount = await UserAccount.findById(req.params.id);
    if (!targetUserAccount) {
      console.log('targetUserAccount not found:', req.params.id);
      return res.status(404).json({ isFollowing: false });
    }
    const targetProfileId = targetUserAccount.userInfo?.toString();

    // 3. Get your Users doc
    const currentUserProfile = await Users.findById(currentProfileId);
    if (!currentUserProfile) {
      console.log('currentUserProfile not found:', currentProfileId);
      return res.status(404).json({ isFollowing: false });
    }

    // 4. Debug
    console.log('currentUserAccount:', currentUserAccount);
    console.log('targetUserAccount:', targetUserAccount);
    console.log('currentProfileId:', currentProfileId);
    console.log('targetProfileId:', targetProfileId);

    // 5. Check if following
    const isFollowing = currentUserProfile.following.some(
      id => id.toString() === targetProfileId
    );

    return res.status(200).json({ isFollowing });
  } catch (err) {
    console.error("Error in isFollowedByMe:", err);
    res.status(500).json({ isFollowing: false });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "EMAIL_AND_CODE_REQUIRED", message: "Email and verification code are required" });
    }

    const result = await userAccountService.verifyEmailWithCode(email, code);
    if (!result) {
      return res.status(400).json({ error: "INVALID_OR_EXPIRED_CODE", message: "Invalid or expired verification code" });
    }

    res.status(200).json({ message: "Email verified successfully", emailVerified: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Internal server error" });
  }
};

const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "EMAIL_AND_CODE_REQUIRED", message: "Email and reset code are required" });
    }

    const user = await userAccountService.getByEmail(email);
    if (!user || user.passwordResetCode !== code || !user.passwordResetExpires || user.passwordResetExpires < Date.now()) {
      return res.status(400).json({ error: "INVALID_OR_EXPIRED_CODE", message: "Reset code is invalid or has expired" });
    }

    res.status(200).json({ message: "Reset code is valid" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Internal server error" });
  }
};

const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "EMAIL_REQUIRED", message: "Email is required" });

    const userAccount = await userAccountService.getByEmail(email);
    if (!userAccount) return res.status(404).json({ error: "USER_NOT_FOUND", message: "User not found" });
    if (userAccount.emailVerified) return res.status(400).json({ error: "EMAIL_ALREADY_VERIFIED", message: "Email is already verified" });

    try {
      await userAccountService.generateAndSendVerificationCode(email);
      res.status(200).json({ message: "Verification code sent successfully", emailSent: true });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      res.status(500).json({ error: "EMAIL_SEND_FAILED", message: "Failed to send verification email" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Internal server error" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "EMAIL_REQUIRED", message: "Email is required" });

    try {
      const result = await userAccountService.generateAndSendPasswordResetCode(email);
      if (result) {
        res.status(200).json({ message: "Password reset code sent to your email", emailSent: true });
      } else {
        res.status(200).json({ message: "If the email exists, a password reset code has been sent" });
      }
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      res.status(500).json({ error: "EMAIL_SEND_FAILED", message: "Failed to send password reset email" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Internal server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: "ALL_FIELDS_REQUIRED", message: "Email, code, and new password are required" });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\S]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ error: "INVALID_PASSWORD", message: "Password must be at least 8 characters with uppercase, lowercase, and number" });
    }

    const result = await userAccountService.resetPasswordWithCode(email, code, newPassword);
    if (!result) {
      return res.status(400).json({ error: "INVALID_OR_EXPIRED_CODE", message: "Invalid or expired reset code" });
    }

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "SERVER_ERROR", message: "Internal server error" });
  }
};

const putSelf = async (req, res) => {
  try {
    let result = await userAccountService.updateById(req.user._id, req.data);
    if (!result) return res.status(400).json({ error: "DATA_MISSING" });
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof RecordNotFoundError) {
      res.sendStatus(404);
    } else if (error instanceof DataValidationError) {
      res.status(400).json({
        error: "DATA_VALIDATION",
        model: error.model.modelName,
        fields: error.issues.map(issue => ({
          kind: issue.kind,
          path: issue.path,
          value: issue.value,
          message: issue.message,
        }))
      });
    } else {
      console.error(error);
      res.sendStatus(500);
    }
  }
};

const deleteSelf = async (req, res) => {
  try {
    let result = await userAccountService.deleteById(req.user._id);
    if (!result) return res.status(400).json({ error: "ALREADY_DELETED" });
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof RecordNotFoundError) {
      res.sendStatus(404);
    } else {
      console.error(error);
      res.sendStatus(500);
    }
  }
};

const uploadProfileImage = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "NO_IMAGE_PROVIDED" });
    }

    // Create public URL for frontend and MongoDB
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/profileImages/${file.filename}`;

    // Save public URL instead of local file path
    const updatedUser = await userAccountService.updateProfileImage(
      req.user._id,
      imageUrl
    );

    res.status(200).json({
      message: "PROFILE_IMAGE_UPDATED",
      profileImage: updatedUser.profileImage,
    });
  } catch (error) {
    console.error(error);
    if (error instanceof RecordNotFoundError) {
      return res.status(404).json({ error: "USER_NOT_FOUND" });
    }
    res.sendStatus(500);
  }
};


const toggleFollow = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id.toString();
    const result = await userAccountService.toggleFollow(currentUserId, targetUserId);
    res.status(200).json(result); // Returns { message, followers, isFollowing }
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};

const getFollowStats = async (req, res) => {
  try {
    const stats = await userAccountService.getFollowStats(req.params.id);
    console.log("Follow stats for user:", req.params.id, stats); // <-- ADD THIS
    res.status(200).json(stats);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};


const getFollowers = async (req, res) => {
  try {
    const followers = await userAccountService.getFollowers(req.params.id);
    res.status(200).json(followers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching followers" });
  }
};

const getFollowing = async (req, res) => {
  try {
    const following = await userAccountService.getFollowing(req.params.id);
    res.status(200).json(following);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching following" });
  }
};

const getMyFollowing = async (req, res) => {
  try {
    const following = await userAccountService.getFollowing(req.user._id);
    res.status(200).json(following);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching current user's following list" });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await UserAccount.findById(req.params.id)
      .populate("userInfo", "name profileImage");

    if (!user) {
      return res.status(404).json({ error: "USER_NOT_FOUND", message: "User not found" });
    }

    res.status(200).json({
      _id: user._id,
      email: user.email,
      role: user.role,
      userInfo: user.userInfo,
    });
  } catch (err) {
    console.error("Error in getUserById:", err);
    res.status(500).json({ error: "SERVER_ERROR", message: "Failed to fetch user" });
  }
};

module.exports = {
  get,
  getAllUsers,
  getDeleted,
  getById,
  post,
  verifyEmail,
  resendVerificationCode,
  forgotPassword,
  resetPassword,
  verifyResetCode,
  putSelf,
  deleteSelf,
  uploadProfileImage,
  toggleFollow,
  getFollowStats,
  getFollowers,
  getFollowing,
  getMyFollowing,
  getUserById,
  savePlayerId,
  isFollowedByMe,
};

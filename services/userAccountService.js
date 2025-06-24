const UserAccount = require("../models/userAccount");
const userService = require("./userService");
const { getDB } = require("../config/db");
const mongoose = require("mongoose");
const DataValidationError = require("../errors/dataValidationError");
const RecordNotFoundError = require("../errors/recordNotFoundError");
const { castData, generateVerificationCode } = require("../utils/general");
const bcrypt = require('bcrypt');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailUtils');
const User = require("../models/user");
const FollowModel = require("../models/follow");

async function toggleFollow(currentUserAccountId, targetUserAccountId) {
  try {
    console.log("[Service] toggleFollow:", currentUserAccountId, "→", targetUserAccountId);

    // See if we already have a record
    const existing = await FollowModel.findOne({
      follower: currentUserAccountId,
      followee: targetUserAccountId,
    });

    let isFollowing;
    if (existing) {
      // Unfollow
      await existing.deleteOne();
      isFollowing = false;
      console.log("[Service] unfollowed");
    } else {
      // Follow
      await FollowModel.create({
        follower: currentUserAccountId,
        followee: targetUserAccountId,
      });
      isFollowing = true;
      console.log("[Service] followed");
    }

    // Re-compute follower count
    const followers = await FollowModel.countDocuments({
      followee: targetUserAccountId,
    });

    console.log("[Service] new follower count:", followers);
    return { isFollowing, followers };
  } catch (err) {
    console.error("[Service] toggleFollow error:", err);
    throw err;
  }
}


const savePlayerId = async (userId, playerId) => {
  const userAccount = await UserAccount.findByIdAndUpdate(
    userId,
    { oneSignalPlayerId: playerId },
    { new: true }
  );

  if (!userAccount) {
    throw new RecordNotFoundError(UserAccount, userId);
  }

  return userAccount;
};


const getById = async (_id) => {
  let userAccount = await UserAccount.findById(_id)
    .populate(["userInfo"])
    .lean({ virtuals: true })
    .exec();
  if (!userAccount) {
    return false;
  }
  return userAccount;
};

const get = async (filter = {}, projection = {}) => {
  let userAccounts = await UserAccount.find(
    {
      $or: [
        { deleted: { $exists: false } },
        { deleted: { $exists: true, $eq: false } },
      ],
      ...filter,
    },
    projection
  )
    .populate([
      {
        path: "userInfo",
      },
    ])
    .lean()
    .exec();
  return userAccounts;
};

const getByEmail = async (email) => {
  try {
    let userAccount = await UserAccount.findOne({ email })
      .populate(["userInfo"])
      .lean()
      .exec();
    if (!userAccount) {
      return false;
    }
    return userAccount;
  } catch (error) {
    console.error("error", error);
  }

};

const getDeleted = async (filter = {}, projection = {}) => {
  let userAccounts = await UserAccount.find(
    { ...filter, deleted: true },
    projection
  )
    .populate(["userInfo"])
    .lean()
    .exec();
  return userAccounts;
};

const add = async (data) => {
  let db = getDB();
  const session = await db.startSession();
  try {
    session.startTransaction();
    console.log("Creating user with data:", data);
    let user = await userService.add({ name: data.name, phone: data.phone }, session);
    if (!user) {
      throw new Error("Failed to create user");
    }
    const hashedPassword = await bcrypt.hash(data.password, 12);
    data = { ...castData(data, ["email", "role"]), password: hashedPassword };
    console.log("Creating userAccount with data:", data);
    const userAccount = new UserAccount({
      ...data,
      userInfo: user._id,
      emailVerified: false, // Explicitly set to false
      emailVerificationCode: generateVerificationCode(),
      emailVerificationExpires: new Date(Date.now() + 30 * 60 * 1000),
    });
    await userAccount.save({ session });
    await session.commitTransaction();
    return userAccount;
  } catch (error) {
    await session.abortTransaction();
    console.error("Error in add:", error);
    if (error instanceof mongoose.Error.ValidationError) {
      throw new DataValidationError(UserAccount, error.errors);
    }
    throw error;
  } finally {
    session.endSession();
  }
};
const updateById = async (_id, data) => {
  let newData = castData(data, ["email", "password", "role", "balance"]);
  if (!newData) {
    return false;
  }
  let db = getDB();
  const session = await db.startSession();
  try {
    session.startTransaction();
    let userAccount = await UserAccount.findOneAndUpdate({ _id }, newData, {
      new: true,
      runValidators: true,
    }).populate(["userInfo"]);
    if (!userAccount || userAccount.deleted) {
      throw new RecordNotFoundError(Category, _id);
    }
    await userService.updateById(userAccount.userInfo._id, data, session);
    await session.commitTransaction();
    return userAccount;
  } catch (error) {
    await session.abortTransaction();
    if (error instanceof mongoose.Error.ValidationError) {
      throw new DataValidationError(UserAccount, error.errors);
    } else {
      throw error;
    }
  } finally {
    session.endSession();
  }
};

const deleteById = async (_id) => {
  let userAccount = await UserAccount.findById(_id).exec();
  if (!userAccount) {
    throw new RecordNotFoundError(UserAccount, _id);
  }
  if (userAccount.deleted) {
    return false;
  }
  userAccount = await UserAccount.findOneAndUpdate(
    { _id },
    { deleted: true },
    {
      new: true,
    }
  );
  return userAccount;
};
const updateProfileImage = async (userAccountId, imagePath) => {
  const userAccount = await UserAccount.findById(userAccountId).exec();
  if (!userAccount) {
    throw new RecordNotFoundError(UserAccount, userAccountId);
  }

  const updatedUser = await userService.updateProfileImage(userAccount.userInfo, imagePath);
  return updatedUser;
};

async function getFollowers(userId) {
  const docs = await FollowModel
    .find({ followee: userId })
    .populate({
      path: "follower",
      // first populate the follower field from FollowModel,
      // then populate its userInfo sub‐field
      populate: {
        path: "userInfo",
        select: "name profileImage"
      },
      select: "userInfo"
    })
    .lean();

  return docs
    .filter(d => d.follower && d.follower.userInfo)  // guard against any missing data
    .map(d => ({
      _id: d.follower._id,
      userInfo: {
        name: d.follower.userInfo.name,
        profileImage: d.follower.userInfo.profileImage,
      },
    }));
}

async function getFollowing(userId) {
  const docs = await FollowModel
    .find({ follower: userId })
    .populate({
      path: "followee",
      populate: {
        path: "userInfo",
        select: "name profileImage"
      },
      select: "userInfo"
    })
    .lean();

  return docs
    .filter(d => d.followee && d.followee.userInfo)
    .map(d => ({
      _id: d.followee._id,
      userInfo: {
        name: d.followee.userInfo.name,
        profileImage: d.followee.userInfo.profileImage,
      },
    }));
}

async function getFollowStats(userId) {
  const followersCount = await FollowModel.countDocuments({ followee: userId });
  const followingCount = await FollowModel.countDocuments({ follower: userId });
  return { followersCount, followingCount };
}

const generateAndSendVerificationCode = async (email) => {
  const code = generateVerificationCode();
  const userAccount = await UserAccount.findOneAndUpdate(
    { email },
    {
      emailVerificationCode: code,
      emailVerificationExpires: new Date(Date.now() + 30 * 60 * 1000),
    },
    { new: true }
  );

  if (!userAccount) return false;

  try {
    await sendVerificationEmail(email, code);
    console.log(`Verification code sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send verification email to ${email}:`, error);
    throw error;
  }
  return userAccount;
};

// Verify email with code
const verifyEmailWithCode = async (email, code) => {
  const userAccount = await UserAccount.findOne({
    email,
    emailVerificationCode: code,
    emailVerificationExpires: { $gt: Date.now() }
  });

  if (!userAccount) return false;

  userAccount.emailVerified = true;
  userAccount.emailVerificationCode = null;
  userAccount.emailVerificationExpires = null;
  await userAccount.save();

  return userAccount;
};

// Generate and send password reset code
const generateAndSendPasswordResetCode = async (email) => {
  const code = generateVerificationCode();
  const userAccount = await UserAccount.findOneAndUpdate(
    { email },
    {
      passwordResetCode: code,
      passwordResetExpires: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    },
    { new: true }
  );

  if (!userAccount) return false;

  await sendPasswordResetEmail(email, code);
  return userAccount;
};

// Reset password with code
const resetPasswordWithCode = async (email, code, newPassword) => {
  const userAccount = await UserAccount.findOne({
    email,
    passwordResetCode: code,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!userAccount) return false;

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  userAccount.password = hashedPassword;
  userAccount.passwordResetCode = null;
  userAccount.passwordResetExpires = null;
  await userAccount.save();

  return userAccount;
};

// Check if email is verified
const isEmailVerified = async (email) => {
  const userAccount = await UserAccount.findOne({ email });
  return userAccount ? userAccount.emailVerified : false;
};


module.exports = {
  getFollowStats,
  getFollowers,
  getFollowing,
  toggleFollow,
  updateProfileImage,
  getById,
  get,
  getByEmail,
  getDeleted,
  add,
  updateById,
  deleteById,
  generateAndSendVerificationCode,
  verifyEmailWithCode,
  generateAndSendPasswordResetCode,
  resetPasswordWithCode,
  isEmailVerified,
  savePlayerId,
};

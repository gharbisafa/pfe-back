const UserAccount = require("../models/userAccount");
const userService = require("./userService");
const { getDB } = require("../config/db");
const mongoose = require("mongoose");
const DataValidationError = require("../errors/dataValidationError");
const RecordNotFoundError = require("../errors/recordNotFoundError");
const { castData, generateVerificationCode } = require("../utils/general");
const bcrypt = require('bcrypt');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailUtils');

const toggleFollow = async (currentUserAccountId, targetUserAccountId) => {
  const currentUserAccount = await UserAccount.findById(currentUserAccountId);
  const targetUserAccount = await UserAccount.findById(targetUserAccountId);

  if (!currentUserAccount || !targetUserAccount || currentUserAccount.deleted || targetUserAccount.deleted) {
    throw new RecordNotFoundError(UserAccount, targetUserAccountId);
  }

  return await userService.toggleFollow(
    currentUserAccount.userInfo.toString(),
    targetUserAccount.userInfo.toString()
  );
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
  try{
    let userAccount = await UserAccount.findOne({ email })
    .populate(["userInfo"])
    .lean()
    .exec();
  if (!userAccount) {
    return false;
  }
  return userAccount;
  }catch(error){
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
    let user = await userService.add(data, session);
    if (!user) {
      throw new Error();
    }
    data = castData(data, ["email", "password", "role"]);
    if (!data) {
      return false;
    }
    try {
      const userAccount = new UserAccount({
        ...data,
        userInfo: user._id,
      });
      await userAccount.save({ session });
      await session.commitTransaction();
      return userAccount;
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        throw new DataValidationError(UserAccount, error.errors);
      } else {
        throw error;
      }
    }
  } catch (error) {
    await session.abortTransaction();
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
// Get followers list of a user
const getFollowers = async (_id) => {
  // Find the user account by ID and populate the followers
  const userAccount = await UserAccount.findById(_id).populate({
    path: "userInfo",
    select: "followers", // Include the followers array
  }).lean();

  if (!userAccount || !userAccount.userInfo) {
    throw new RecordNotFoundError(UserAccount, _id);
  }

  const followers = await userService.get({ "_id": { $in: userAccount.userInfo.followers } });
  return followers;
};
// Get following list of a user
const getFollowing = async (_id) => {
  // Find the user account by ID and populate the following list
  const userAccount = await UserAccount.findById(_id).populate({
    path: "userInfo",
    select: "following", // Include the following array
  }).lean();

  if (!userAccount || !userAccount.userInfo) {
    throw new RecordNotFoundError(UserAccount, _id);
  }

  const following = await userService.get({ "_id": { $in: userAccount.userInfo.following } });
  return following;
};
const getFollowStats = async (userAccountId) => {
  const userAccount = await UserAccount.findById(userAccountId)
    .populate("userInfo")
    .exec();

  if (!userAccount || userAccount.deleted) {
    throw new RecordNotFoundError(UserAccount, userAccountId);
  }

  const user = userAccount.userInfo;

  return {
    followersCount: user.followers?.length || 0,
    followingCount: user.following?.length || 0,
  };
};
// Generate and send email verification code
const generateAndSendVerificationCode = async (email) => {
  const code = generateVerificationCode();
  const userAccount = await UserAccount.findOneAndUpdate(
    { email },
    {
      emailVerificationCode: code,
      emailVerificationExpires: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    },
    { new: true }
  );

  if (!userAccount) return false;

  await sendVerificationEmail(email, code);
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
};
